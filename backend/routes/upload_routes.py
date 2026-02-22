import os
import time
import shutil
import pandas as pd
import numpy as np
from flask import Blueprint, request, jsonify
from config import UPLOAD_FOLDER, allowed_file

upload_bp = Blueprint('upload', __name__)


def read_df(filepath):
    ext = filepath.rsplit('.', 1)[1].lower()
    if ext == 'csv':
        try:
            return pd.read_csv(filepath, encoding='utf-8')
        except:
            return pd.read_csv(filepath, encoding='gbk')
    else:
        return pd.read_excel(filepath, engine='openpyxl' if ext == 'xlsx' else 'xlrd')


# 提取出的通用响应函数，防止逻辑冗余
def process_and_respond(df, safe_filename, original_name):
    columns = df.columns.tolist()
    # 智能识别数值列（排除像学号、ID这种没有分析意义的数字）
    numeric_cols = [c for c in columns if pd.api.types.is_numeric_dtype(df[c]) and not any(
        kw in str(c).lower() for kw in ['号', 'id', '编号', '代码', '索引'])]
    # 识别分类变量（用于t检验分组）
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
            return process_and_respond(df, safe_filename, file.filename)
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500
    return jsonify({"status": "error", "message": "格式不支持"}), 400


# ======== 终极修复：纯原生 Python 预清洗，彻底杜绝 Pandas 报错 ========
@upload_bp.route('/api/upload_manual', methods=['POST'])
def upload_manual():
    data = request.json.get('grid')
    if not data or len(data) < 2:
        return jsonify({"status": "error", "message": "表格内容不足，请至少输入一行数据"}), 400
    try:
        # 1. 纯 Python 处理表头
        raw_headers = data[0]
        headers = []
        for i, h in enumerate(raw_headers):
            h_str = str(h).strip() if h else f"指标_{i + 1}"
            while h_str in headers: h_str = f"{h_str}_副本"
            headers.append(h_str)

        # 2. 纯 Python 清洗数据行 (彻底抛弃 Pandas 的 replace 逻辑，避开版本兼容 bug)
        cleaned_rows = []
        for row in data[1:]:
            # 将所有单元格转为字符串并去前后空格，如果空空如也，就用 np.nan 占位
            cleaned_row = [np.nan if str(val).strip() == "" else str(val).strip() for val in row]

            # 【关键】只有当这一行里有至少一个非空数据时，才把它放进来
            if any(pd.notna(val) for val in cleaned_row):
                cleaned_rows.append(cleaned_row)

        if not cleaned_rows:
            return jsonify({"status": "error", "message": "提交的表格没有任何有效数据，请先填写内容"}), 400

        # 3. 把洗得干干净净的数据喂给 DataFrame
        df = pd.DataFrame(cleaned_rows, columns=headers)

        # 4. 安全的数字类型推断 (用 Try-Except 绕开 errors='ignore' 的潜在 bug)
        for col in df.columns:
            try:
                # 尝试将这列强制转为数字，如果这列是“张三李四”，就会报错跳过，保留原本的文字
                df[col] = pd.to_numeric(df[col])
            except (ValueError, TypeError):
                pass

        # 5. 保存生成的虚拟文件
        safe_filename = f"manual_{int(time.time())}.csv"
        df.to_csv(os.path.join(UPLOAD_FOLDER, safe_filename), index=False, encoding='utf-8-sig')

        return process_and_respond(df, safe_filename, "在线创建数据.csv")
    except Exception as e:
        return jsonify({"status": "error", "message": f"表格解析失败: {str(e)}"}), 500


@upload_bp.route('/api/cleanup', methods=['POST'])
def cleanup_cache():
    try:
        shutil.rmtree(UPLOAD_FOLDER)
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        return jsonify({"status": "success", "message": "系统缓存清理完毕"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500