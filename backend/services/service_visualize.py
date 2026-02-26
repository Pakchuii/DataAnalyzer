import os
import pandas as pd
import numpy as np
from flask import request, jsonify
from config import UPLOAD_FOLDER
from utils import read_df


def do_get_options():
    """解析检索特征维度内的唯一实例清单"""
    try:
        df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
        col = request.json.get('column')
        if col not in df.columns: return jsonify({"status": "error", "message": "检索列索引失效"}), 400
        options = df[col].dropna().astype(str).unique().tolist()[:1000]
        return jsonify({"status": "success", "data": options})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def do_distribution():
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


def do_categorical():
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


def do_radar():
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