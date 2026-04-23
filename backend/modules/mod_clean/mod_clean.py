import os
import traceback
import pandas as pd
from flask import Blueprint, request, jsonify
from core.config import UPLOAD_FOLDER
from core.utils import read_df
from .service import smart_clean_series

bp = Blueprint('clean', __name__)


@bp.route('/api/clean/diagnose', methods=['POST'])
def diagnose_data():
    """只读诊断扫描：检测缺失值与异常值数量，不修改原始数据"""
    try:
        filename = request.json.get('filename')
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        numeric_cols = df.select_dtypes(include=['number']).columns

        total_rows = len(df)
        missing_info = {}
        outliers_info = {}
        cleaning_methods = {}
        total_missing = 0
        total_outliers = 0

        if len(numeric_cols) > 0:
            for col in numeric_cols:
                null_count = int(df[col].isnull().sum())
                if null_count > 0:
                    missing_info[col] = null_count
                    total_missing += null_count

            # 对每列做只读异常检测（使用临时填充后的数据检测异常，不改原数据）
            temp_df = df.copy()
            temp_df[numeric_cols] = temp_df[numeric_cols].fillna(temp_df[numeric_cols].mean())
            for col in numeric_cols:
                _, method_name, out_count = smart_clean_series(temp_df[col])
                cleaning_methods[col] = method_name
                if out_count > 0:
                    outliers_info[col] = out_count
                    total_outliers += out_count

        return jsonify({
            "status": "success",
            "data": {
                "total_rows": total_rows,
                "total_missing": total_missing,
                "missing_details": missing_info,
                "total_outliers": total_outliers,
                "outliers_details": outliers_info,
                "cleaning_methods": cleaning_methods
            }
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@bp.route('/api/clean', methods=['POST'])
def clean_data():
    try:
        filename = request.json.get('filename')
        missing_strategy = request.json.get('missing_strategy', 'mean')
        outlier_strategy = request.json.get('outlier_strategy', 'auto')

        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        numeric_cols = df.select_dtypes(include=['number']).columns

        total_rows = len(df)
        missing_info = {}
        outliers_info = {}
        cleaning_methods = {}
        total_missing = 0
        total_outliers = 0

        if len(numeric_cols) > 0:
            # 统计缺失值
            for col in numeric_cols:
                null_count = int(df[col].isnull().sum())
                if null_count > 0:
                    missing_info[col] = null_count
                    total_missing += null_count

            # 缺失值处理策略
            if missing_strategy == 'mean':
                df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
            elif missing_strategy == 'median':
                df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
            elif missing_strategy == 'zero':
                df[numeric_cols] = df[numeric_cols].fillna(0)
            elif missing_strategy == 'drop':
                df = df.dropna(subset=numeric_cols)
            # 'none' → 不做任何处理

            # 异常值处理策略
            if outlier_strategy == 'auto':
                for col in numeric_cols:
                    if col in df.columns:
                        s_clean, method_name, out_count = smart_clean_series(df[col])
                        df[col] = s_clean
                        cleaning_methods[col] = method_name
                        if out_count > 0:
                            outliers_info[col] = out_count
                            total_outliers += out_count
            else:
                for col in numeric_cols:
                    cleaning_methods[col] = "用户选择跳过异常值处理"

        cleaned_filename = f"cleaned_{filename.split('.')[0]}.csv"
        df.to_csv(os.path.join(UPLOAD_FOLDER, cleaned_filename), index=False, encoding='utf-8-sig')

        return jsonify({
            "status": "success",
            "message": "清洗完成",
            "data": {
                "cleaned_filename": cleaned_filename,
                "total_rows": total_rows,
                "total_missing": total_missing,
                "missing_details": missing_info,
                "total_outliers": total_outliers,
                "outliers_details": outliers_info,
                "cleaning_methods": cleaning_methods,
                "applied_missing_strategy": missing_strategy,
                "applied_outlier_strategy": outlier_strategy
            }
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500
