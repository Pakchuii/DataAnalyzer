import os
import pandas as pd
from flask import Blueprint, request, jsonify
from core.config import UPLOAD_FOLDER
from core.utils import read_df

bp = Blueprint('test_module', __name__)

@bp.route('/api/test/probe', methods=['POST'])
def probe_data():
    """
    【全栈样板：数据探测器】
    演示接收前端文件名 -> 读取物理文件 -> 执行算法逻辑 -> 返回格式化结果
    """
    try:
        data = request.json
        filename = data.get('filename')
        
        if not filename:
            return jsonify({"status": "error", "message": "缺失文件名"}), 400
            
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(file_path):
            return jsonify({"status": "error", "message": "后端找不到指定物理文件"}), 404
            
        # 使用系统内置工具读取数据
        df = read_df(file_path)
        
        # 执行简单的分析逻辑：探测各列的统计学属性
        summary = []
        for col in df.columns:
            dtype = str(df[col].dtype)
            summary.append({
                "name": col,
                "type": "数值型" if "int" in dtype or "float" in dtype else "文本/类别型",
                "null_count": int(df[col].isnull().sum()),
                "unique_values": int(df[col].nunique())
            })
            
        return jsonify({
            "status": "success",
            "data": {
                "columns_summary": summary,
                "total_rows": len(df),
                "total_cols": len(df.columns)
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": f"后端透视失败: {str(e)}"}), 500
