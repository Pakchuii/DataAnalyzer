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
        # 【修复1】恢复严格过滤，绝对不让“姓名”或“学号”这种唯一标识符去画饼图！
        if any(kw in str(col).lower() for kw in ['姓名', 'name', '号', 'id']) or df[col].nunique() > 15:
            continue
        counts = df[col].value_counts()
        charts_data.append({"variable": col, "categories": counts.index.tolist(), "values": counts.values.tolist(),
                            "pie_data": [{"name": str(k), "value": int(v)} for k, v in counts.items()]})
    return jsonify({"status": "success", "data": charts_data})


# ================== 【全新】专门用于获取雷达图下拉选项的接口 ==================
@analysis_bp.route('/api/get_options', methods=['POST'])
def get_options():
    try:
        df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
        col = request.json.get('column')
        if col not in df.columns:
            return jsonify({"status": "error", "message": "列不存在"}), 400

        # 强制将该列转为字符串并去重，最多取1000个防止浏览器卡死
        options = df[col].dropna().astype(str).unique().tolist()[:1000]
        return jsonify({"status": "success", "data": options})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ========================================================================

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

        var1, var2 = selected[0], selected[1]
        scatter_vars = [var1, var2]
        temp_df = df[[var1, var2]].copy().dropna()
        scatter_data = temp_df.values.tolist()

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


@analysis_bp.route('/api/analyze/summary', methods=['POST'])
def generate_summary():
    try:
        filename = request.json.get('filename')
        if not filename: return jsonify({"status": "error", "message": "系统未找到当前处理的文件"}), 400
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        for col in df.columns:
            try:
                df[col] = pd.to_numeric(df[col])
            except Exception:
                pass
        numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c]) and not any(
            kw in str(c).lower() for kw in ['号', 'id', '编号', '代码'])]
        insights = []
        insights.append(
            f"✨ **数据概览**：当前数据集共包含 {len(df)} 条记录，成功识别出 {len(numeric_cols)} 个关键数值指标。")
        if len(numeric_cols) > 0:
            std_series = df[numeric_cols].std()
            if not std_series.isna().all():
                max_std_col = std_series.idxmax()
                min_std_col = std_series.idxmin()
                if pd.notna(max_std_col) and pd.notna(min_std_col):
                    insights.append(
                        f"📊 **波动洞察**：数据中【{max_std_col}】的离散程度最大，说明个体差异最显著；而【{min_std_col}】分布最为集中稳定。")
            if len(numeric_cols) >= 2:
                corr_df = df[numeric_cols].corr().abs()
                for i in range(len(corr_df.columns)): corr_df.iloc[i, i] = 0.0
                if not corr_df.isna().all().all():
                    max_corr = corr_df.max().max()
                    if pd.notna(max_corr) and max_corr > 0.5:
                        safe_matrix = corr_df.to_numpy()
                        row_idx, col_idx = np.unravel_index(np.nanargmax(safe_matrix), safe_matrix.shape)
                        var1, var2 = corr_df.index[row_idx], corr_df.columns[col_idx]
                        insights.append(
                            f"🔗 **强关联发现**：系统检测到【{var1}】与【{var2}】存在较强的线性相关性（r={round(max_corr, 2)}）。这表明当其中一个指标变化时，另一个往往也会随之呈现规律性波动。")
        insights.append("💡 **分析建议**：建议结合右侧的雷达图进行个体优势诊断，并利用 t 检验进一步探索不同群体间的差异。")
        return jsonify({"status": "success", "data": insights})
    except Exception as e:
        return jsonify({"status": "error", "message": f"算法运算异常: {str(e)}"}), 500


@analysis_bp.route('/api/visualize/radar', methods=['POST'])
def visualize_radar():
    try:
        filename = request.json.get('filename')
        id_col = request.json.get('id_col')
        target_val = request.json.get('target_val')
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        numeric_df = df.select_dtypes(include=['number'])
        valid_numeric_cols = [c for c in numeric_df.columns if
                              not any(kw in str(c).lower() for kw in ['号', 'id', '编号', '代码'])]
        if not valid_numeric_cols: return jsonify({"status": "error", "message": "未找到可用于雷达图的数值指标"}), 400
        avg_data = numeric_df[valid_numeric_cols].mean().round(2).tolist()

        # 【修复2】强制将表格里的列和前端传来的值都转成字符串再做比对！完美解决学号匹配失败问题！
        target_row = df[df[id_col].astype(str) == str(target_val)]

        if target_row.empty: return jsonify({"status": "error", "message": "未找到指定个体"}), 400
        target_data = target_row[valid_numeric_cols].iloc[0].fillna(0).round(2).tolist()
        indicators = [{"name": col, "max": float(numeric_df[col].max()) * 1.1} for col in valid_numeric_cols]
        return jsonify({"status": "success",
                        "data": {"indicators": indicators, "avg_data": avg_data, "target_data": target_data,
                                 "target_name": str(target_val)}})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500