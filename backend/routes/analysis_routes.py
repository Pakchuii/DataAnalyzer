import os
import pandas as pd
import numpy as np
import scipy.stats as stats
from flask import Blueprint, request, jsonify
from config import UPLOAD_FOLDER

analysis_bp = Blueprint('analysis', __name__)


def read_df(filepath):
    ext = filepath.rsplit('.', 1)[1].lower()
    if ext == 'csv':
        try:
            return pd.read_csv(filepath, encoding='utf-8')
        except:
            return pd.read_csv(filepath, encoding='gbk')
    else:
        return pd.read_excel(filepath, engine='openpyxl' if ext == 'xlsx' else 'xlrd')


@analysis_bp.route('/api/analyze/descriptive', methods=['POST'])
def descriptive_analysis():
    df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
    selected = [c for c in request.json.get('columns', []) if c in df.columns]
    stats_data = []
    for col in selected:
        d = df[col].dropna()
        stats_data.append({"variable": str(col), "count": int(d.count()), "mean": float(round(d.mean(), 4)),
                           "median": float(round(d.median(), 4)), "std": float(round(d.std(), 4)),
                           "min": float(round(d.min(), 4)), "max": float(round(d.max(), 4))})
    return jsonify({"status": "success", "data": stats_data})


@analysis_bp.route('/api/visualize/distribution', methods=['POST'])
def visualize_distribution():
    df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
    selected = request.json.get('columns', [])
    charts_data = []
    for col in selected:
        if col not in df.columns: continue
        d = df[col].dropna()
        if len(d) == 0: continue
        counts, bin_edges = np.histogram(d, bins='auto')
        charts_data.append({"variable": col, "boxplot": [float(d.min()), float(d.quantile(0.25)), float(d.median()),
                                                         float(d.quantile(0.75)), float(d.max())], "histogram": {
            "categories": [f"{round(bin_edges[i], 1)}~{round(bin_edges[i + 1], 1)}" for i in range(len(counts))],
            "series": [int(c) for c in counts]}})
    return jsonify({"status": "success", "data": charts_data})


@analysis_bp.route('/api/visualize/categorical', methods=['POST'])
def visualize_categorical():
    df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
    cat_cols = df.select_dtypes(include=['object']).columns.tolist()
    charts_data = []
    for col in cat_cols:
        if any(kw in str(col).lower() for kw in ['姓名', 'name']) or df[col].nunique() > 10: continue
        counts = df[col].value_counts()
        charts_data.append({"variable": col, "categories": counts.index.tolist(), "values": counts.values.tolist(),
                            "pie_data": [{"name": str(k), "value": int(v)} for k, v in counts.items()]})
    return jsonify({"status": "success", "data": charts_data})


@analysis_bp.route('/api/analyze/advanced', methods=['POST'])
def advanced_analysis():
    df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
    selected = [c for c in request.json.get('columns', []) if c in df.columns]
    if len(selected) < 2: return jsonify({"status": "error", "message": "变量过少"}), 400
    try:
        normality_results = []
        for col in selected:
            d = df[col].dropna()
            if len(d) >= 3:
                stat, p = stats.shapiro(d)
                normality_results.append(
                    {"variable": col, "statistic": float(round(stat, 4)), "p_value": float(round(p, 4)),
                     "is_normal": bool(p > 0.05)})

        corr_matrix = []
        corr_df = df[selected].corr(method='pearson').fillna(0).round(3)
        for i in range(len(selected)):
            for j in range(len(selected)): corr_matrix.append([i, j, float(corr_df.iloc[i, j])])

        # 稳定版：固定取前两个变量画散点图，防止出错
        var1, var2 = selected[0], selected[1]
        scatter_vars = [var1, var2]
        temp_df = df[[var1, var2]].copy()
        temp_df[var1] = pd.to_numeric(temp_df[var1], errors='coerce')
        temp_df[var2] = pd.to_numeric(temp_df[var2], errors='coerce')
        scatter_data = temp_df.dropna().values.tolist()

        return jsonify({"status": "success", "data": {"variables": selected, "normality": normality_results,
                                                      "correlation_matrix": corr_matrix, "scatter_data": scatter_data,
                                                      "scatter_vars": scatter_vars}})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@analysis_bp.route('/api/analyze/ttest', methods=['POST'])
def ttest_analysis():
    df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
    group_col, target_cols = request.json.get('group_col'), request.json.get('columns', [])
    if not group_col or group_col not in df.columns: return jsonify(
        {"status": "error", "message": "未选择有效分组变量"}), 400
    try:
        groups = df[group_col].dropna().unique()
        if len(groups) != 2: return jsonify({"status": "error", "message": "非二分类变量"}), 400
        group1_data, group2_data = df[df[group_col] == groups[0]], df[df[group_col] == groups[1]]
        results = []
        for col in target_cols:
            if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                d1, d2 = group1_data[col].dropna(), group2_data[col].dropna()
                if len(d1) > 1 and len(d2) > 1:
                    stat, p = stats.ttest_ind(d1, d2, equal_var=False)
                    results.append(
                        {"variable": col, "group1_name": str(groups[0]), "group1_mean": float(round(d1.mean(), 4)),
                         "group2_name": str(groups[1]), "group2_mean": float(round(d2.mean(), 4)),
                         "t_value": float(round(stat, 4)), "p_value": float(round(p, 4)),
                         "significant": bool(p < 0.05)})
        return jsonify({"status": "success", "data": results})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500