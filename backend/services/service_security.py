import os
import pandas as pd
from flask import request, jsonify
from config import UPLOAD_FOLDER
from utils import read_df

def do_mask():
    try:
        filename = request.json.get('filename')
        if not filename: return jsonify({"status": "error", "message": "未找到文件"}), 400

        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        masked_cols = []

        def mask_val(x):
            x = str(x).strip()
            if x in ['nan', 'None', '']: return x
            if len(x) <= 2: return x[0] + '*'
            elif len(x) == 3: return x[0] + '*' + x[-1]
            else: return x[:4] + '****'

        for col in df.columns:
            if any(kw in str(col).lower() for kw in ['名', 'name', '号', 'id', '手机', '电话', '身份']):
                masked_cols.append(col)
                df[col] = df[col].apply(mask_val)

        masked_filename = "masked_" + filename
        df.to_csv(os.path.join(UPLOAD_FOLDER, masked_filename), index=False, encoding='utf-8-sig')

        return jsonify({"status": "success", "data": {"masked_filename": masked_filename, "masked_cols": masked_cols}})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500