import os
import pandas as pd
from flask import Blueprint, request, jsonify
from config import UPLOAD_FOLDER

process_bp = Blueprint('process', __name__)

def read_df(filepath):
    ext = filepath.rsplit('.', 1)[1].lower()
    if ext == 'csv':
        try: return pd.read_csv(filepath, encoding='utf-8')
        except: return pd.read_csv(filepath, encoding='gbk')
    else: return pd.read_excel(filepath, engine='openpyxl' if ext == 'xlsx' else 'xlrd')

@process_bp.route('/api/preview', methods=['POST'])
def preview_data():
    try:
        df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
        preview_df = df.head(15).fillna("").astype(str)
        return jsonify({"status": "success", "data": { "columns": preview_df.columns.tolist(), "rows": preview_df.to_dict(orient='records') }})
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

@process_bp.route('/api/clean', methods=['POST'])
def clean_data():
    try:
        filename = request.json.get('filename')
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        numeric_cols = df.select_dtypes(include=['number']).columns
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
        outliers_handled = 0
        for col in numeric_cols:
            mean, std = df[col].mean(), df[col].std()
            lower_bound, upper_bound = mean - 3 * std, mean + 3 * std
            outliers_handled += ((df[col] < lower_bound) | (df[col] > upper_bound)).sum()
            df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
        cleaned_filename = f"cleaned_{filename.split('.')[0]}.csv"
        df.to_csv(os.path.join(UPLOAD_FOLDER, cleaned_filename), index=False, encoding='utf-8-sig')
        return jsonify({"status": "success", "message": "清洗完成", "data": {"cleaned_filename": cleaned_filename, "outliers_handled": int(outliers_handled)}})
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

@process_bp.route('/api/standardize', methods=['POST'])
def standardize_data():
    try:
        filename = request.json.get('filename')
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        numeric_cols = df.select_dtypes(include=['number']).columns
        for col in numeric_cols:
            std_val = df[col].std()
            df[col] = (df[col] - df[col].mean()) / std_val if std_val != 0 else 0
        std_filename = f"std_{filename}"
        df.to_csv(os.path.join(UPLOAD_FOLDER, std_filename), index=False, encoding='utf-8-sig')
        return jsonify({"status": "success", "message": "Z-score 标准化完成！", "data": {"std_filename": std_filename}})
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500