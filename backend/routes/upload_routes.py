import os
import time
import shutil
import pandas as pd
from flask import Blueprint, request, jsonify
from config import UPLOAD_FOLDER, allowed_file

upload_bp = Blueprint('upload', __name__)

def read_df(filepath):
    ext = filepath.rsplit('.', 1)[1].lower()
    if ext == 'csv':
        try: return pd.read_csv(filepath, encoding='utf-8')
        except: return pd.read_csv(filepath, encoding='gbk')
    else: return pd.read_excel(filepath, engine='openpyxl' if ext == 'xlsx' else 'xlrd')

@upload_bp.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files: return jsonify({"status": "error", "message": "没有文件"}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({"status": "error", "message": "未选择文件"}), 400

    if file and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        safe_filename = f"upload_{int(time.time())}.{ext}"
        filepath = os.path.join(UPLOAD_FOLDER, safe_filename)
        file.save(filepath)
        try:
            df = read_df(filepath)
            columns = df.columns.tolist()
            numeric_columns = [col for col in columns if pd.api.types.is_numeric_dtype(df[col]) and not any(kw in str(col).lower() for kw in ['号', 'id', '编号', '代码', '索引', 'index'])]
            binary_columns = [col for col in columns if df[col].nunique() == 2]
            return jsonify({"status": "success", "message": "上传成功", "data": {"filename": safe_filename, "original_filename": file.filename, "columns": columns, "numeric_columns": numeric_columns, "binary_columns": binary_columns, "row_count": len(df)}})
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500
    return jsonify({"status": "error", "message": "格式不支持"}), 400

@upload_bp.route('/api/cleanup', methods=['POST'])
def cleanup_cache():
    try:
        shutil.rmtree(UPLOAD_FOLDER)
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        return jsonify({"status": "success", "message": "缓存清理完毕"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500