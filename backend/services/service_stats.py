import os
import pandas as pd
import scipy.stats as stats
from flask import request, jsonify
from config import UPLOAD_FOLDER
from utils import read_df


def do_descriptive():
    try:
        df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
        selected = [c for c in request.json.get('columns', []) if c in df.columns]
        stats_data = []
        for col in selected:
            d = df[col].dropna()
            stats_data.append({
                "variable": str(col), "count": int(d.count()), "mean": float(round(d.mean(), 4)),
                "median": float(round(d.median(), 4)), "std": float(round(d.std(), 4)),
                "min": float(round(d.min(), 4)), "max": float(round(d.max(), 4))
            })
        return jsonify({"status": "success", "data": stats_data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def do_advanced():
    try:
        df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
        selected = [c for c in request.json.get('columns', []) if c in df.columns]
        if len(selected) < 2: return jsonify({"status": "error", "message": "变量过少，无法进行关联分析"}), 400

        normality_results = []
        for col in selected:
            d = df[col].dropna()
            if len(d) >= 3:
                stat, p = stats.shapiro(d)
                normality_results.append({
                    "variable": col, "statistic": float(round(stat, 4)),
                    "p_value": float(round(p, 4)), "is_normal": bool(p > 0.05)
                })

        corr_matrix = []
        corr_df = df[selected].corr(method='pearson').fillna(0).round(3)
        for i in range(len(selected)):
            for j in range(len(selected)):
                corr_matrix.append([i, j, float(corr_df.iloc[i, j])])

        var1, var2 = selected[0], selected[1]
        scatter_data = df[[var1, var2]].copy().dropna().values.tolist()

        return jsonify({"status": "success", "data": {"variables": selected, "normality": normality_results,
                                                      "correlation_matrix": corr_matrix, "scatter_data": scatter_data,
                                                      "scatter_vars": [var1, var2]}})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def do_ttest():
    try:
        df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
        group_col, target_cols = request.json.get('group_col'), request.json.get('columns', [])
        if not group_col or group_col not in df.columns: return jsonify(
            {"status": "error", "message": "未选择有效分组变量"}), 400

        groups = df[group_col].dropna().unique()
        if len(groups) != 2: return jsonify({"status": "error", "message": "非二分类变量，无法进行 t 检验"}), 400

        group1_data, group2_data = df[df[group_col] == groups[0]], df[df[group_col] == groups[1]]
        results = []
        for col in target_cols:
            if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                d1, d2 = group1_data[col].dropna(), group2_data[col].dropna()
                if len(d1) > 1 and len(d2) > 1:
                    stat, p = stats.ttest_ind(d1, d2, equal_var=False)
                    results.append({
                        "variable": col, "group1_name": str(groups[0]), "group1_mean": float(round(d1.mean(), 4)),
                        "group2_name": str(groups[1]), "group2_mean": float(round(d2.mean(), 4)),
                        "t_value": float(round(stat, 4)), "p_value": float(round(p, 4)), "significant": bool(p < 0.05)
                    })
        return jsonify({"status": "success", "data": results})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500