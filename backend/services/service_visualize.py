import os
import pandas as pd
import numpy as np
from flask import request, jsonify
from config import UPLOAD_FOLDER
from utils import read_df

def do_get_options():
    try:
        df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
        col = request.json.get('column')
        if col not in df.columns: return jsonify({"status": "error", "message": "列不存在"}), 400
        options = df[col].dropna().astype(str).unique().tolist()[:1000]
        return jsonify({"status": "success", "data": options})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

def do_distribution():
    try:
        df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
        selected = request.json.get('columns', [])
        charts_data = []
        for col in selected:
            if col not in df.columns: continue
            d = df[col].dropna()
            if len(d) == 0: continue
            counts, bin_edges = np.histogram(d, bins='auto')
            charts_data.append({
                "variable": col,
                "boxplot": [float(d.min()), float(d.quantile(0.25)), float(d.median()), float(d.quantile(0.75)), float(d.max())],
                "histogram": {"categories": [f"{round(bin_edges[i], 1)}~{round(bin_edges[i + 1], 1)}" for i in range(len(counts))], "series": [int(c) for c in counts]}
            })
        return jsonify({"status": "success", "data": charts_data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

def do_categorical():
    try:
        df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
        cat_cols = df.select_dtypes(include=['object']).columns.tolist()
        charts_data = []
        for col in cat_cols:
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
    try:
        filename, id_col, target_val = request.json.get('filename'), request.json.get('id_col'), request.json.get('target_val')
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        numeric_df = df.select_dtypes(include=['number'])

        valid_numeric_cols = [c for c in numeric_df.columns if not any(kw in str(c).lower() for kw in ['号', 'id', '编号', '代码'])]
        if not valid_numeric_cols: return jsonify({"status": "error", "message": "未找到可用于雷达图的数值指标"}), 400

        avg_data = numeric_df[valid_numeric_cols].mean().round(2).tolist()
        target_row = df[df[id_col].astype(str) == str(target_val)]
        if target_row.empty: return jsonify({"status": "error", "message": "未找到指定个体"}), 400

        target_data = target_row[valid_numeric_cols].iloc[0].fillna(0).round(2).tolist()
        indicators = [{"name": col, "max": float(numeric_df[col].max()) * 1.1} for col in valid_numeric_cols]

        return jsonify({"status": "success", "data": {"indicators": indicators, "avg_data": avg_data, "target_data": target_data, "target_name": str(target_val)}})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500