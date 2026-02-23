import os
import time
import shutil
import pandas as pd
import numpy as np
from flask import Blueprint, request, jsonify
from config import UPLOAD_FOLDER, allowed_file

upload_bp = Blueprint('upload', __name__)

# [Pro哥点评: 难点解决 - 编码地狱]
# 中文 Windows 系统下保存的 CSV 很多是 GBK 编码，而 Pandas 默认用 UTF-8 读取。
# 这里的 try-except 完美化解了 UnicodeDecodeError 这个最常见的数据读取报错！
def read_df(filepath):
    """通用文件读取函数 (支持编码自动降级)"""
    ext = filepath.rsplit('.', 1)[1].lower()
    if ext == 'csv':
        try:
            return pd.read_csv(filepath, encoding='utf-8')
        except UnicodeDecodeError:
            return pd.read_csv(filepath, encoding='gbk')
    else:
        return pd.read_excel(filepath, engine='openpyxl' if ext == 'xlsx' else 'xlrd')

def process_and_respond(df, safe_filename, original_name):
    """通用响应构建器：智能推断数据列的业务属性"""
    columns = df.columns.tolist()

    # [Pro哥点评: 创新点 - 智能特征过滤]
    # 自动识别数值列，同时利用关键词识别，把“学号”、“ID”这种假数值（本质是标识符）剔除，
    # 防止它们跑到统计图表里去拉低分析的专业度。
    numeric_cols = [c for c in columns if pd.api.types.is_numeric_dtype(df[c]) and not any(
        kw in str(c).lower() for kw in ['号', 'id', '编号', '代码', '索引'])]

    # 识别二分类变量，专门为后续的 T 检验提供分组备选项
    binary_cols = [c for c in columns if df[c].nunique() == 2]

    return jsonify({
        "status": "success",
        "data": {
            "filename": safe_filename,
            "original_filename": original_name,
            "columns": columns,
            "numeric_columns": numeric_cols,
            "binary_columns": binary_cols,
            "row_count": len(df)
        }
    })

@upload_bp.route('/api/upload', methods=['POST'])
def upload_file():
    """处理物理文件上传"""
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "请求中未包含文件对象"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "未选择任何文件"}), 400

    if file and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        safe_filename = f"upload_{int(time.time())}.{ext}" # 使用时间戳防止重名覆盖
        filepath = os.path.join(UPLOAD_FOLDER, safe_filename)
        file.save(filepath)

        try:
            df = read_df(filepath)
            return process_and_respond(df, safe_filename, file.filename)
        except Exception as e:
            return jsonify({"status": "error", "message": f"文件解析异常: {str(e)}"}), 500

    return jsonify({"status": "error", "message": "系统不支持该文件格式"}), 400

@upload_bp.route('/api/upload_manual', methods=['POST'])
def upload_manual():
    """处理前端手工输入的表格数据"""
    data = request.json.get('grid')
    if not data or len(data) < 2:
        return jsonify({"status": "error", "message": "表格内容不足，请至少输入一行数据"}), 400

    try:
        # [Pro哥点评: 难点解决 - 数据安全降级]
        # 放弃 Pandas 自带的不稳定 replace，使用纯 Python 列表推导式进行初级清洗。
        # 这样能彻底避免前端传来的空字符串或怪异字符导致后端类型推断崩溃。
        raw_headers = data[0]
        headers = []
        for i, h in enumerate(raw_headers):
            h_str = str(h).strip() if h else f"指标_{i + 1}"
            while h_str in headers:
                h_str = f"{h_str}_副本" # 防止表头重名
            headers.append(h_str)

        cleaned_rows = []
        for row in data[1:]:
            cleaned_row = [np.nan if str(val).strip() == "" else str(val).strip() for val in row]
            if any(pd.notna(val) for val in cleaned_row):
                cleaned_rows.append(cleaned_row)

        if not cleaned_rows:
            return jsonify({"status": "error", "message": "提交的表格没有任何有效数据，请先填写内容"}), 400

        df = pd.DataFrame(cleaned_rows, columns=headers)

        for col in df.columns:
            try:
                df[col] = pd.to_numeric(df[col])
            except (ValueError, TypeError):
                pass

        safe_filename = f"manual_{int(time.time())}.csv"
        df.to_csv(os.path.join(UPLOAD_FOLDER, safe_filename), index=False, encoding='utf-8-sig')

        return process_and_respond(df, safe_filename, "在线创建数据.csv")
    except Exception as e:
        return jsonify({"status": "error", "message": f"手工表格解析失败: {str(e)}"}), 500

@upload_bp.route('/api/cleanup', methods=['POST'])
def cleanup_cache():
    """清理服务器缓存"""
    try:
        shutil.rmtree(UPLOAD_FOLDER)
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        return jsonify({"status": "success", "message": "系统核心缓存已清空"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500