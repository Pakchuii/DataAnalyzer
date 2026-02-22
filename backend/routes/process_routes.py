import os
import pandas as pd
from flask import Blueprint, request, jsonify
from config import UPLOAD_FOLDER

process_bp = Blueprint('process', __name__)


def read_df(filepath):
    """文件读取帮助函数"""
    ext = filepath.rsplit('.', 1)[1].lower()
    if ext == 'csv':
        try:
            return pd.read_csv(filepath, encoding='utf-8')
        except UnicodeDecodeError:
            return pd.read_csv(filepath, encoding='gbk')
    else:
        return pd.read_excel(filepath, engine='openpyxl' if ext == 'xlsx' else 'xlrd')


@process_bp.route('/api/preview', methods=['POST'])
def preview_data():
    """返回前 15 行数据用于前端预览"""
    try:
        filename = request.json.get('filename')
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))

        # 限制返回行数并转换为字符串避免 JSON 序列化报错
        preview_df = df.head(15).fillna("").astype(str)

        return jsonify({
            "status": "success",
            "data": {
                "columns": preview_df.columns.tolist(),
                "rows": preview_df.to_dict(orient='records')
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@process_bp.route('/api/clean', methods=['POST'])
def clean_data():
    """自动数据清洗：缺失值填充 + 极值裁剪 (3-Sigma)"""
    try:
        filename = request.json.get('filename')
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))

        numeric_cols = df.select_dtypes(include=['number']).columns

        # 1. 均值填充缺失值
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())

        # 2. 3-Sigma 原则处理异常极值
        outliers_handled = 0
        for col in numeric_cols:
            mean = df[col].mean()
            std = df[col].std()
            lower_bound = mean - 3 * std
            upper_bound = mean + 3 * std

            # 统计处理了多少个异常值
            outliers_handled += ((df[col] < lower_bound) | (df[col] > upper_bound)).sum()
            # 强行把极值拉回到边界上
            df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)

        cleaned_filename = f"cleaned_{filename.split('.')[0]}.csv"
        df.to_csv(os.path.join(UPLOAD_FOLDER, cleaned_filename), index=False, encoding='utf-8-sig')

        return jsonify({
            "status": "success",
            "message": "清洗完成",
            "data": {
                "cleaned_filename": cleaned_filename,
                "outliers_handled": int(outliers_handled)
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@process_bp.route('/api/standardize', methods=['POST'])
def standardize_data():
    """执行 Z-Score 标准化，消除量纲影响"""
    try:
        filename = request.json.get('filename')
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        numeric_cols = df.select_dtypes(include=['number']).columns

        for col in numeric_cols:
            std_val = df[col].std()
            # 防止除以 0 的情况导致数据崩溃
            df[col] = (df[col] - df[col].mean()) / std_val if std_val != 0 else 0

        std_filename = f"std_{filename}"
        df.to_csv(os.path.join(UPLOAD_FOLDER, std_filename), index=False, encoding='utf-8-sig')

        return jsonify({
            "status": "success",
            "message": "Z-score 标准化完成！",
            "data": {
                "std_filename": std_filename
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500