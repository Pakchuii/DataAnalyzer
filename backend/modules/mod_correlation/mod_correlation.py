import os
import pandas as pd
import scipy.stats as stats
from flask import Blueprint, request, jsonify
from core.config import UPLOAD_FOLDER
from core.utils import read_df

bp = Blueprint('correlation', __name__)


@bp.route('/api/analyze/advanced', methods=['POST'])
def advanced_analysis():
    """实施 Shapiro-Wilk 参数正态性校验，构建 Pearson 线性关联热力矩阵"""
    try:
        df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
        selected = [c for c in request.json.get('columns', []) if c in df.columns]
        if len(selected) < 2: return jsonify({"status": "error", "message": "维度特征不足，无法构建关联矩阵"}), 400

        normality_results = []
        for col in selected:
            d = df[col].dropna()
            if len(d) >= 3:
                stat, p = stats.shapiro(d)
                normality_results.append({
                    "variable": col, "statistic": float(round(stat, 4)), "p_value": float(round(p, 4)),
                    "is_normal": bool(p > 0.05)
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
