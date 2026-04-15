import os
import pandas as pd
from flask import Blueprint, request, jsonify
from core.config import UPLOAD_FOLDER
from core.utils import read_df

bp = Blueprint('radar', __name__)


@bp.route('/api/get_options', methods=['POST'])
def get_options():
    """解析检索特征维度内的唯一实例清单"""
    try:
        df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
        col = request.json.get('column')
        if col not in df.columns: return jsonify({"status": "error", "message": "检索列索引失效"}), 400
        options = df[col].dropna().astype(str).unique().tolist()[:1000]
        return jsonify({"status": "success", "data": options})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@bp.route('/api/visualize/radar', methods=['POST'])
def visualize_radar():
    """【多维标量空间构建】：提取指定单一实例的多元坐标，并计算群体重心准线以构建雷达图映射"""
    try:
        filename, id_col, target_val = request.json.get('filename'), request.json.get('id_col'), request.json.get(
            'target_val')
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        numeric_df = df.select_dtypes(include=['number'])

        valid_numeric_cols = [c for c in numeric_df.columns if
                              not any(kw in str(c).lower() for kw in ['号', 'id', '编号', '代码'])]
        if not valid_numeric_cols: return jsonify({"status": "error", "message": "无法构建有效维度的雷达骨架"}), 400

        avg_data = numeric_df[valid_numeric_cols].mean().round(2).tolist()
        target_row = df[df[id_col].astype(str) == str(target_val)]
        if target_row.empty: return jsonify({"status": "error", "message": "寻址失败，目标实体丢失"}), 400

        target_data = target_row[valid_numeric_cols].iloc[0].fillna(0).round(2).tolist()

        # 将各维度的界限量程向外拓展 10%，维持雷达图的视觉张力与边界留白
        indicators = [{"name": col, "max": float(numeric_df[col].max()) * 1.1} for col in valid_numeric_cols]

        return jsonify({"status": "success",
                        "data": {"indicators": indicators, "avg_data": avg_data, "target_data": target_data,
                                 "target_name": str(target_val)}})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
