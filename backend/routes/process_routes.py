import os
import traceback
import pandas as pd
import numpy as np
from flask import Blueprint, request, jsonify, make_response
from config import UPLOAD_FOLDER
from utils import read_df

process_bp = Blueprint('process', __name__)


@process_bp.route('/api/preview', methods=['POST'])
def preview_data():
    """仅向前端下发前 15 行数据作为预览"""
    try:
        filename = request.json.get('filename')
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        preview_df = df.head(15).fillna("").astype(str)
        return jsonify({"status": "success",
                        "data": {"columns": preview_df.columns.tolist(), "rows": preview_df.to_dict(orient='records')}})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


def smart_clean_series(s):
    """
    【智能清洗引擎】: 自动路由 IQR 与 Dixon's Q
    """
    s_valid = s.dropna()
    n = len(s_valid)

    if n < 3:
        return s, "样本极小(跳过)", 0

    if n >= 30:
        # 大样本：非参数 IQR 箱线图法
        Q1 = s_valid.quantile(0.25)
        Q3 = s_valid.quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR

        outliers_count = int(((s_valid < lower_bound) | (s_valid > upper_bound)).sum())
        s_clean = s.clip(lower=lower_bound, upper=upper_bound)
        return s_clean, "IQR箱线图法 (N>=30)", outliers_count

    else:
        # 小样本：Dixon's Q 检验
        q95 = {3: 0.941, 4: 0.765, 5: 0.642, 6: 0.560, 7: 0.507, 8: 0.468,
               9: 0.437, 10: 0.412, 11: 0.392, 12: 0.376, 13: 0.361, 14: 0.349,
               15: 0.338, 16: 0.329, 17: 0.320, 18: 0.313, 19: 0.306, 20: 0.300,
               21: 0.295, 22: 0.290, 23: 0.285, 24: 0.281, 25: 0.277, 26: 0.273,
               27: 0.269, 28: 0.266, 29: 0.263, 30: 0.260}
        q_crit = q95.get(n, 0.260)
        s_sorted = s_valid.sort_values().values
        s_clean = s.copy()
        outliers_count = 0

        range_all = s_sorted[-1] - s_sorted[0]
        if range_all > 0:
            if (s_sorted[1] - s_sorted[0]) / range_all > q_crit:
                s_clean = s_clean.replace(s_sorted[0], s_sorted[1])
                outliers_count += 1
            s_sorted_new = s_clean.dropna().sort_values().values
            range_new = s_sorted_new[-1] - s_sorted_new[0]
            if range_new > 0 and (s_sorted_new[-1] - s_sorted_new[-2]) / range_new > q_crit:
                s_clean = s_clean.replace(s_sorted_new[-1], s_sorted_new[-2])
                outliers_count += 1

        return s_clean, "Dixon's Q检验 (N<30)", outliers_count


@process_bp.route('/api/clean', methods=['POST'])
def clean_data():
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
            df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())

            for col in numeric_cols:
                s_clean, method_name, out_count = smart_clean_series(df[col])
                df[col] = s_clean
                cleaning_methods[col] = method_name

                if out_count > 0:
                    outliers_info[col] = out_count
                    total_outliers += out_count

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
                "cleaning_methods": cleaning_methods
            }
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@process_bp.route('/api/data/save', methods=['POST', 'OPTIONS'])
def save_data():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response

    try:
        data = request.json
        filename = data.get('filename')
        rows = data.get('rows')
        save_mode = data.get('save_mode', 'overwrite')
        old_filename = data.get('old_filename', '')
        is_new_table = data.get('is_new_table', False)
        overwrite_confirmed = data.get('overwrite_confirmed', False)

        if not filename or rows is None: return jsonify({"status": "error", "message": "参数缺失，无法保存"}), 400

        BASE_DIR = os.path.dirname(UPLOAD_FOLDER)
        OUTPUT_FOLDER = os.path.join(BASE_DIR, 'outputs')
        os.makedirs(OUTPUT_FOLDER, exist_ok=True)
        df = pd.DataFrame(rows)

        if save_mode == 'new_output':
            file_path = os.path.join(OUTPUT_FOLDER, filename)
            msg = f"已作为新表安全隔离至 outputs 目录！"
        elif save_mode == 'rename_source':
            old_in_up = os.path.join(UPLOAD_FOLDER, old_filename)
            old_in_out = os.path.join(OUTPUT_FOLDER, old_filename)
            target_folder = OUTPUT_FOLDER
            if os.path.exists(old_in_up):
                target_folder = UPLOAD_FOLDER
            elif os.path.exists(old_in_out):
                target_folder = OUTPUT_FOLDER
            file_path = os.path.join(target_folder, filename)
            msg = f"源文件已被覆盖并重命名！"
        else:
            if is_new_table or os.path.exists(os.path.join(OUTPUT_FOLDER, filename)):
                file_path = os.path.join(OUTPUT_FOLDER, filename)
            else:
                file_path = os.path.join(UPLOAD_FOLDER, filename)
            msg = f"覆盖保存成功！"

        if not overwrite_confirmed and os.path.exists(file_path):
            if save_mode in ['new_output', 'rename_source'] or is_new_table:
                return jsonify({"status": "exists",
                                "message": f"目标路径下已存在名为 <b style='color:#fa8c16;'>{filename}</b> 的文件！<br>继续操作将永久抹除原文件数据，是否确认覆盖？"})

        if save_mode == 'rename_source':
            old_in_up = os.path.join(UPLOAD_FOLDER, old_filename)
            old_in_out = os.path.join(OUTPUT_FOLDER, old_filename)
            if os.path.exists(old_in_up): os.remove(old_in_up)
            if os.path.exists(old_in_out): os.remove(old_in_out)

        df.to_csv(file_path, index=False, encoding='utf-8-sig')
        res = jsonify({"status": "success", "message": msg})
        res.headers.add("Access-Control-Allow-Origin", "*")
        return res
    except Exception as e:
        traceback.print_exc()
        res = jsonify({"status": "error", "message": f"保存失败: {str(e)}"})
        res.headers.add("Access-Control-Allow-Origin", "*")
        return res, 500


@process_bp.route('/api/data/get_full', methods=['POST', 'OPTIONS'])
def get_full_data():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response

    try:
        filename = request.json.get('filename')
        if not filename: return jsonify({"status": "error", "message": "缺少文件名"}), 400

        BASE_DIR = os.path.dirname(UPLOAD_FOLDER)
        OUTPUT_FOLDER = os.path.join(BASE_DIR, 'outputs')
        file_path = os.path.join(OUTPUT_FOLDER, filename)
        if not os.path.exists(file_path): file_path = os.path.join(UPLOAD_FOLDER, filename)

        df = pd.read_csv(file_path, encoding='utf-8-sig')
        df = df.fillna("")

        res = jsonify({"status": "success", "headers": df.columns.tolist(), "rows": df.to_dict(orient='records')})
        res.headers.add("Access-Control-Allow-Origin", "*")
        return res
    except Exception as e:
        traceback.print_exc()
        res = jsonify({"status": "error", "message": f"拉取数据失败: {str(e)}"})
        res.headers.add("Access-Control-Allow-Origin", "*")
        return res, 500


@process_bp.route('/api/standardize', methods=['POST', 'OPTIONS'])
def standardize_data():
    """
    【数据中心化预处理】：Z-Score 标准化引擎
    """
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response

    try:
        filename = request.json.get('filename')
        if not filename: return jsonify({"status": "error", "message": "缺少文件名"}), 400

        file_path = os.path.join(UPLOAD_FOLDER, filename)
        df = pd.read_csv(file_path, encoding='utf-8-sig')
        numeric_cols = df.select_dtypes(include=['number']).columns

        if len(numeric_cols) > 0:
            for col in numeric_cols:
                std_val = df[col].std()
                # Z-Score 核心算法：(当前值 - 均值) / 标准差
                if pd.notna(std_val) and std_val != 0:
                    df[col] = (df[col] - df[col].mean()) / std_val
                else:
                    df[col] = 0.0  # 防止除以 0 导致无限大崩溃

        standardized_filename = f"standard_{filename.split('.')[0]}.csv"
        df.to_csv(os.path.join(UPLOAD_FOLDER, standardized_filename), index=False, encoding='utf-8-sig')

        res = jsonify({
            "status": "success",
            "message": "Z-Score 标准化完成",
            "data": {
                "standardized_filename": standardized_filename
            }
        })
        res.headers.add("Access-Control-Allow-Origin", "*")
        return res

    except Exception as e:
        import traceback
        traceback.print_exc()
        res = jsonify({"status": "error", "message": f"标准化失败: {str(e)}"})
        res.headers.add("Access-Control-Allow-Origin", "*")
        return res, 500