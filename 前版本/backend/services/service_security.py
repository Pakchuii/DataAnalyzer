import os
import pandas as pd
from flask import request, jsonify
from config import UPLOAD_FOLDER
from utils import read_df

def do_mask():
    """
    【数据安全合规：智能 PII (个人隐私标识) 探针与不可逆模糊脱敏引擎】
    """
    try:
        filename = request.json.get('filename')
        if not filename: return jsonify({"status": "error", "message": "未找到指定数据资产"}), 400

        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        masked_cols = []

        def mask_val(x):
            """长度感知型不可逆混淆算法"""
            x = str(x).strip()
            if x in ['nan', 'None', '']: return x
            # 短名保首字，常规保首尾，长串阻断式遮蔽
            if len(x) <= 2: return x[0] + '*'
            elif len(x) == 3: return x[0] + '*' + x[-1]
            else: return x[:4] + '****'

        # 利用文本语义检索，精准定位高敏感维度集合
        for col in df.columns:
            if any(kw in str(col).lower() for kw in ['名', 'name', '号', 'id', '手机', '电话', '身份']):
                masked_cols.append(col)
                df[col] = df[col].apply(mask_val)

        masked_filename = "masked_" + filename
        df.to_csv(os.path.join(UPLOAD_FOLDER, masked_filename), index=False, encoding='utf-8-sig')

        return jsonify({"status": "success", "data": {"masked_filename": masked_filename, "masked_cols": masked_cols}})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500