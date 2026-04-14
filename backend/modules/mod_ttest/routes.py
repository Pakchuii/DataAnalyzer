import os
import numpy as np
import pandas as pd
import scipy.stats as stats
from flask import Blueprint, request, jsonify
from core.config import UPLOAD_FOLDER
from core.utils import read_df

bp = Blueprint('ttest', __name__)


@bp.route('/api/analyze/ttest', methods=['POST'])
def ttest_analysis():
    """
    【差异性假说检验】：引入 Shapiro 正态校验与 Bootstrap 容错抽样
    """
    try:
        df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
        group_col, target_cols = request.json.get('group_col'), request.json.get('columns', [])
        if not group_col or group_col not in df.columns: return jsonify(
            {"status": "error", "message": "未探测到符合要求的二项分布分组变量"}), 400

        groups = df[group_col].dropna().unique()
        if len(groups) != 2: return jsonify({"status": "error", "message": "强制阻断：选定变量非二项分布属性"}), 400

        group1_data, group2_data = df[df[group_col] == groups[0]], df[df[group_col] == groups[1]]
        results = []
        for col in target_cols:
            if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                d1, d2 = group1_data[col].dropna(), group2_data[col].dropna()
                if len(d1) > 1 and len(d2) > 1:
                    n1, n2 = len(d1), len(d2)
                    algorithm_note = "常规 Welch's t检验"

                    if n1 < 30 or n2 < 30:
                        p_shap1 = stats.shapiro(d1)[1] if n1 >= 3 else 0
                        p_shap2 = stats.shapiro(d2)[1] if n2 >= 3 else 0
                        if p_shap1 < 0.05 or p_shap2 < 0.05:
                            d1 = np.random.choice(d1, size=100, replace=True)
                            d2 = np.random.choice(d2, size=100, replace=True)
                            algorithm_note = "数据非正态, 已触发 Bootstrap 重抽样(N=100)"

                    stat, p = stats.ttest_ind(d1, d2, equal_var=False)
                    results.append({
                        "variable": col, "group1_name": str(groups[0]), "group1_mean": float(round(np.mean(d1), 4)),
                        "group2_name": str(groups[1]), "group2_mean": float(round(np.mean(d2), 4)),
                        "t_value": float(round(stat, 4)), "p_value": float(round(p, 4)), "significant": bool(p < 0.05),
                        "note": algorithm_note
                    })
        return jsonify({"status": "success", "data": results})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
