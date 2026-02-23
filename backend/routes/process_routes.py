import os
import traceback
import pandas as pd
from flask import Blueprint, request, jsonify
from config import UPLOAD_FOLDER
# 【核心修复1】：确保引入全局读取工具
from utils import read_df

process_bp = Blueprint('process', __name__)

@process_bp.route('/api/preview', methods=['POST'])
def preview_data():
    try:
        filename = request.json.get('filename')
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        preview_df = df.head(15).fillna("").astype(str)
        return jsonify({"status": "success", "data": {"columns": preview_df.columns.tolist(), "rows": preview_df.to_dict(orient='records')}})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@process_bp.route('/api/clean', methods=['POST'])
def clean_data():
    try:
        filename = request.json.get('filename')
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        numeric_cols = df.select_dtypes(include=['number']).columns

        if len(numeric_cols) > 0:
            df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
            outliers_handled = 0
            for col in numeric_cols:
                mean = df[col].mean()
                std = df[col].std()
                # 【核心修复2】：防止小样本数据导致标准差计算出 NaN
                if pd.isna(std):
                    std = 0
                lower_bound = mean - 3 * std
                upper_bound = mean + 3 * std
                outliers_handled += int(((df[col] < lower_bound) | (df[col] > upper_bound)).sum())
                df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
        else:
            outliers_handled = 0

        cleaned_filename = f"cleaned_{filename.split('.')[0]}.csv"
        df.to_csv(os.path.join(UPLOAD_FOLDER, cleaned_filename), index=False, encoding='utf-8-sig')

        return jsonify({"status": "success", "message": "清洗完成", "data": {"cleaned_filename": cleaned_filename, "outliers_handled": outliers_handled}})
    except Exception as e:
        # 【核心修复3】：让后端控制台打印出极其详细的报错原因
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@process_bp.route('/api/standardize', methods=['POST'])
def standardize_data():
    try:
        filename = request.json.get('filename')
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        numeric_cols = df.select_dtypes(include=['number']).columns

        for col in numeric_cols:
            std_val = df[col].std()
            if pd.isna(std_val): std_val = 0
            df[col] = (df[col] - df[col].mean()) / std_val if std_val != 0 else 0

        std_filename = f"std_{filename}"
        df.to_csv(os.path.join(UPLOAD_FOLDER, std_filename), index=False, encoding='utf-8-sig')
        return jsonify({"status": "success", "message": "标准化完成", "data": {"std_filename": std_filename}})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500