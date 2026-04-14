import os
import traceback
import pandas as pd
from flask import Blueprint, request, jsonify, make_response
from core.config import UPLOAD_FOLDER

bp = Blueprint('data_io', __name__)


@bp.route('/api/data/save', methods=['POST', 'OPTIONS'])
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


@bp.route('/api/data/get_full', methods=['POST', 'OPTIONS'])
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
