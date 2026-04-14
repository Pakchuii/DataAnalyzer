import os
import numpy as np
import pandas as pd
from flask import Blueprint, request, jsonify
from core.config import UPLOAD_FOLDER
from core.utils import read_df

bp = Blueprint('visualize', __name__)


@bp.route('/api/visualize/distribution', methods=['POST'])
def visualize_distribution():
    """
    【特征编码】：将连续数值型特征转换为适用于 ECharts 渲染的五数概括 (Boxplot) 及分组聚类 (Histogram) JSON结构
    """
    try:
        df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
        selected = request.json.get('columns', [])
        charts_data = []
        for col in selected:
            if col not in df.columns: continue
            d = df[col].dropna()
            if len(d) == 0: continue

            # 使用 numpy 的 auto 模式实现高斯分箱平滑
            counts, bin_edges = np.histogram(d, bins='auto')
            charts_data.append({
                "variable": col,
                "boxplot": [float(d.min()), float(d.quantile(0.25)), float(d.median()), float(d.quantile(0.75)),
                            float(d.max())],
                "histogram": {"categories": [f"{round(bin_edges[i], 1)}~{round(bin_edges[i + 1], 1)}" for i in
                                             range(len(counts))], "series": [int(c) for c in counts]}
            })
        return jsonify({"status": "success", "data": charts_data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@bp.route('/api/visualize/categorical', methods=['POST'])
def visualize_categorical():
    """提取高维类别数据的非空频数映射表 (支撑饼图、南丁格尔图降维渲染)"""
    try:
        df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
        cat_cols = df.select_dtypes(include=['object']).columns.tolist()
        charts_data = []
        for col in cat_cols:
            # 过滤超高维稀疏特征与干扰项，防止前端图表灾难性覆盖
            if any(kw in str(col).lower() for kw in ['姓名', 'name', '号', 'id']) or df[col].nunique() > 15: continue
            counts = df[col].value_counts()
            charts_data.append({
                "variable": col, "categories": counts.index.tolist(), "values": counts.values.tolist(),
                "pie_data": [{"name": str(k), "value": int(v)} for k, v in counts.items()]
            })
        return jsonify({"status": "success", "data": charts_data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
