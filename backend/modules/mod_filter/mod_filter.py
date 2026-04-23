import os
import traceback
from flask import Blueprint, request, jsonify
from core.config import UPLOAD_FOLDER
from core.utils import read_df

bp = Blueprint('filter', __name__)


@bp.route('/api/filter/range', methods=['POST'])
def filter_by_range():
    """按变量范围筛选数据集，生成新的过滤后文件"""
    try:
        filename = request.json.get('filename')
        filters = request.json.get('filters', [])
        # filters 格式: [{ column, type, min, max, values }]

        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        original_count = len(df)

        for f in filters:
            col = f.get('column')
            if col not in df.columns:
                continue

            filter_type = f.get('type', 'range')

            if filter_type == 'range':
                col_min = f.get('min')
                col_max = f.get('max')
                numeric_col = df[col].apply(lambda x: float(x) if str(x).replace('.', '', 1).replace('-', '', 1).isdigit() else None)
                if col_min is not None:
                    df = df[numeric_col >= float(col_min)]
                    numeric_col = numeric_col[numeric_col.index.isin(df.index)]
                if col_max is not None:
                    df = df[numeric_col <= float(col_max)]

            elif filter_type == 'values':
                selected_values = f.get('values', [])
                if selected_values:
                    df = df[df[col].astype(str).isin([str(v) for v in selected_values])]

        filtered_count = len(df)
        filtered_filename = f"filtered_{filename.split('.')[0]}.csv"
        df.to_csv(os.path.join(UPLOAD_FOLDER, filtered_filename), index=False, encoding='utf-8-sig')

        return jsonify({
            "status": "success",
            "data": {
                "filtered_filename": filtered_filename,
                "original_count": original_count,
                "filtered_count": filtered_count,
                "removed_count": original_count - filtered_count
            }
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@bp.route('/api/filter/column_info', methods=['POST'])
def get_column_info():
    """获取指定列的范围信息（数值列返回 min/max，分类列返回唯一值列表）"""
    try:
        filename = request.json.get('filename')
        column = request.json.get('column')

        df = read_df(os.path.join(UPLOAD_FOLDER, filename))

        if column not in df.columns:
            return jsonify({"status": "error", "message": f"列 {column} 不存在"}), 400

        series = df[column].dropna()

        # 尝试判断数值类型
        try:
            numeric = series.astype(float)
            return jsonify({
                "status": "success",
                "data": {
                    "column": column,
                    "type": "numeric",
                    "min": float(round(numeric.min(), 4)),
                    "max": float(round(numeric.max(), 4)),
                    "count": int(len(numeric))
                }
            })
        except (ValueError, TypeError):
            unique_values = series.astype(str).unique().tolist()
            return jsonify({
                "status": "success",
                "data": {
                    "column": column,
                    "type": "categorical",
                    "values": sorted(unique_values),
                    "count": len(unique_values)
                }
            })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500
