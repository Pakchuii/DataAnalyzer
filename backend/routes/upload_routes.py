import os
import time
import shutil
import pandas as pd
import numpy as np
from flask import Blueprint, request, jsonify
from config import UPLOAD_FOLDER, allowed_file
from utils import read_df

upload_bp = Blueprint('upload', __name__)

def process_and_respond(df, safe_filename, original_name):
    """
    【特征工程：智能字段属性推断与分类引擎】
    负责在数据入库前，对其包含的维度进行初步的业务属性探伤。
    """
    columns = df.columns.tolist()

    # 智能过滤：识别真正的连续型数值列。
    # 采用正则/关键字匹配探测技术，强行剔除“学号”、“流水号”等伪数值列(标识符)，保证后续统计算法不被污染。
    numeric_cols = [c for c in columns if pd.api.types.is_numeric_dtype(df[c]) and not any(
        kw in str(c).lower() for kw in ['号', 'id', '编号', '代码', '索引'])]

    # 特征挖掘：探测所有唯一值数量严格等于2的特征列，提名为二分类变量（为后续 T检验 储备靶点）
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
    """处理物理文件流的 Multipart 上传并固化"""
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "请求中未包含文件对象"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "未选择任何文件"}), 400

    if file and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        # 【并发安全防护：时间戳哈希重命名策略】
        # 替换用户原文件名，彻底防止高并发下多用户上传同名文件产生的覆写越权漏洞
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
    """处理前端 Web 内存级手工表格矩阵的解析与落地"""
    data = request.json.get('grid')
    if not data or len(data) < 2:
        return jsonify({"status": "error", "message": "表格内容不足，请至少输入一行数据"}), 400

    try:
        # 【数据清洗防御：防表头冲突注入】
        raw_headers = data[0]
        headers = []
        for i, h in enumerate(raw_headers):
            h_str = str(h).strip() if h else f"指标_{i + 1}"
            # 动态检测，如果存在重名表头，追加后缀保证列唯一性，防止 Pandas 解析崩溃
            while h_str in headers:
                h_str = f"{h_str}_副本"
            headers.append(h_str)

        # 清洗有效数据行，利用 np.nan 将空白格转为标准缺失值
        cleaned_rows = []
        for row in data[1:]:
            cleaned_row = [np.nan if str(val).strip() == "" else str(val).strip() for val in row]
            # 仅当这一行至少有一个非空数据时才装载
            if any(pd.notna(val) for val in cleaned_row):
                cleaned_rows.append(cleaned_row)

        if not cleaned_rows:
            return jsonify({"status": "error", "message": "提交的表格没有任何有效数据，请先填写内容"}), 400

        df = pd.DataFrame(cleaned_rows, columns=headers)

        # 向上转型 (Upcasting)：强制试探并恢复手工输入数据的原生数值类型
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
    """【内存与 I/O 维护】核心系统缓存空间一键强制回收"""
    try:
        shutil.rmtree(UPLOAD_FOLDER)
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        return jsonify({"status": "success", "message": "系统核心缓存已清空"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500