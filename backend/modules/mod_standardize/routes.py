import os
import traceback
import pandas as pd
from flask import Blueprint, request, jsonify, make_response
from core.config import UPLOAD_FOLDER

bp = Blueprint('standardize', __name__)


@bp.route('/api/standardize', methods=['POST', 'OPTIONS'])
def standardize_data():
    """Z-Score 标准化引擎"""
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
                if pd.notna(std_val) and std_val != 0:
                    df[col] = (df[col] - df[col].mean()) / std_val
                else:
                    df[col] = 0.0

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
        traceback.print_exc()
        res = jsonify({"status": "error", "message": f"标准化失败: {str(e)}"})
        res.headers.add("Access-Control-Allow-Origin", "*")
        return res, 500
