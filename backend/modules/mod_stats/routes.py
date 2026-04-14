import os
import pandas as pd
from flask import Blueprint, request, jsonify
from core.config import UPLOAD_FOLDER
from core.utils import read_df

bp = Blueprint('stats', __name__)


@bp.route('/api/analyze/descriptive', methods=['POST'])
def descriptive_analysis():
    """获取标量特征维度的描述性综合测度"""
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
