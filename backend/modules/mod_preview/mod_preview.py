import os
import traceback
from flask import Blueprint, request, jsonify
from core.config import UPLOAD_FOLDER
from core.utils import read_df

bp = Blueprint('preview', __name__)


@bp.route('/api/preview', methods=['POST'])
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
