import os
import traceback
import numpy as np
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


@bp.route('/api/preview/statistics', methods=['POST'])
def preview_statistics():
    """为每一列生成统计摘要与分布直方图数据，供前端图表统计视图渲染"""
    try:
        filename = request.json.get('filename')
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        columns_stats = []

        for col in df.columns:
            series = df[col]
            col_info = {"name": str(col), "count": int(len(series)), "missing": int(series.isnull().sum())}

            # 尝试转换为数值
            numeric_series = series.dropna()
            try:
                numeric_series = numeric_series.astype(float)
                is_numeric = True
            except (ValueError, TypeError):
                is_numeric = False

            if is_numeric and len(numeric_series) > 0:
                col_info["type"] = "numeric"
                col_info["unique"] = int(numeric_series.nunique())
                col_info["min"] = float(round(numeric_series.min(), 4))
                col_info["max"] = float(round(numeric_series.max(), 4))
                col_info["mean"] = float(round(numeric_series.mean(), 4))
                col_info["median"] = float(round(numeric_series.median(), 4))
                col_info["std"] = float(round(numeric_series.std(), 4)) if len(numeric_series) > 1 else 0.0
                col_info["q25"] = float(round(numeric_series.quantile(0.25), 4))
                col_info["q75"] = float(round(numeric_series.quantile(0.75), 4))

                # 计算直方图 bin 数据
                num_bins = min(20, max(5, col_info["unique"]))
                counts, bin_edges = np.histogram(numeric_series.values, bins=num_bins)
                col_info["histogram"] = {
                    "bins": [float(round(e, 2)) for e in bin_edges],
                    "counts": [int(c) for c in counts]
                }

                # 迷你 sparkline 数据（复用直方图）
                col_info["sparkline"] = [int(c) for c in counts]

            else:
                col_info["type"] = "categorical"
                cat_series = series.dropna().astype(str)
                col_info["unique"] = int(cat_series.nunique())

                # Top 10 频率分布
                top_counts = cat_series.value_counts().head(10)
                col_info["top_values"] = {
                    "labels": top_counts.index.tolist(),
                    "counts": [int(c) for c in top_counts.values]
                }
                col_info["sparkline"] = [int(c) for c in top_counts.values[:8]]

            columns_stats.append(col_info)

        return jsonify({"status": "success", "data": columns_stats})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500
