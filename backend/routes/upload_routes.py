import os
import time
import shutil
import pandas as pd
import numpy as np
from flask import Blueprint, request, jsonify
from config import UPLOAD_FOLDER, allowed_file

upload_bp = Blueprint('upload', __name__)


def read_df(filepath):
    """通用文件读取函数"""
    ext = filepath.rsplit('.', 1)[1].lower()
    if ext == 'csv':
        try:
            return pd.read_csv(filepath, encoding='utf-8')
        except UnicodeDecodeError:
            return pd.read_csv(filepath, encoding='gbk')
    else:
        return pd.read_excel(filepath, engine='openpyxl' if ext == 'xlsx' else 'xlrd')


def process_and_respond(df, safe_filename, original_name):
    """
    提取出的通用响应函数，防止解析逻辑在多个上传接口中冗余。
    负责识别字段类型，并返回给前端渲染控制台。
    """
    columns = df.columns.tolist()

    # 智能识别数值列（排除像学号、ID这种没有分析意义的数字）
    numeric_cols = [c for c in columns if pd.api.types.is_numeric_dtype(df[c]) and not any(
        kw in str(c).lower() for kw in ['号', 'id', '编号', '代码', '索引'])]

    # 识别二分类变量（主要用于提供给 t 检验的分组依赖）
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
    """处理用户上传的实体文件 (csv/xls/xlsx)"""
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "请求中未包含文件对象"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "未选择任何文件"}), 400

    if file and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        safe_filename = f"upload_{int(time.time())}.{ext}"
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
    """处理用户在前端面板纯手工输入的表格数据，并虚拟化为 CSV 文件"""
    data = request.json.get('grid')
    if not data or len(data) < 2:
        return jsonify({"status": "error", "message": "表格内容不足，请至少输入一行数据"}), 400

    try:
        # 1. 纯 Python 处理表头重名校验
        raw_headers = data[0]
        headers = []
        for i, h in enumerate(raw_headers):
            h_str = str(h).strip() if h else f"指标_{i + 1}"
            while h_str in headers:
                h_str = f"{h_str}_副本"
            headers.append(h_str)

        # 2. 纯 Python 清洗数据行 (彻底抛弃 Pandas 的 replace 逻辑，避开版本兼容 bug)
        cleaned_rows = []
        for row in data[1:]:
            cleaned_row = [np.nan if str(val).strip() == "" else str(val).strip() for val in row]
            # 仅保留含有有效数据的行
            if any(pd.notna(val) for val in cleaned_row):
                cleaned_rows.append(cleaned_row)

        if not cleaned_rows:
            return jsonify({"status": "error", "message": "提交的表格没有任何有效数据，请先填写内容"}), 400

        # 3. 数据载入 DataFrame
        df = pd.DataFrame(cleaned_rows, columns=headers)

        # 4. 安全的数字类型推断 (保留分类文字，只转换纯数字)
        for col in df.columns:
            try:
                df[col] = pd.to_numeric(df[col])
            except (ValueError, TypeError):
                pass

        # 5. 保存生成的虚拟文件至缓冲区
        safe_filename = f"manual_{int(time.time())}.csv"
        df.to_csv(os.path.join(UPLOAD_FOLDER, safe_filename), index=False, encoding='utf-8-sig')

        return process_and_respond(df, safe_filename, "在线创建数据.csv")
    except Exception as e:
        return jsonify({"status": "error", "message": f"手工表格解析失败: {str(e)}"}), 500


@upload_bp.route('/api/cleanup', methods=['POST'])
def cleanup_cache():
    """暴力清理所有服务器端的缓存文件"""
    try:
        shutil.rmtree(UPLOAD_FOLDER)
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        return jsonify({"status": "success", "message": "系统核心缓存已清空"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500