import os
import traceback
import pandas as pd
from flask import Blueprint, request, jsonify
from config import UPLOAD_FOLDER
# 【核心修复1】：确保引入全局读取工具
from utils import read_df

process_bp = Blueprint('process', __name__)

@process_bp.route('/api/preview', methods=['POST'])
def preview_data():
    try:
        filename = request.json.get('filename')
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        preview_df = df.head(15).fillna("").astype(str)
        return jsonify({"status": "success", "data": {"columns": preview_df.columns.tolist(), "rows": preview_df.to_dict(orient='records')}})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@process_bp.route('/api/clean', methods=['POST'])
def clean_data():
    try:
        filename = request.json.get('filename')
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        numeric_cols = df.select_dtypes(include=['number']).columns

        # 🚀 新增：战报数据收集器
        total_rows = len(df)
        missing_info = {}
        outliers_info = {}
        total_missing = 0
        total_outliers = 0

        if len(numeric_cols) > 0:
            # 1. 扫描缺失值 (空项)
            for col in numeric_cols:
                null_count = int(df[col].isnull().sum())
                if null_count > 0:
                    missing_info[col] = null_count
                    total_missing += null_count

            # 执行填补
            df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())

            # 2. 扫描异常值 (断档/离谱项)
            for col in numeric_cols:
                mean = df[col].mean()
                std = df[col].std()
                if pd.isna(std): std = 0
                lower_bound = mean - 3 * std
                upper_bound = mean + 3 * std

                # 计算超出 3σ 边界的数量
                outlier_count = int(((df[col] < lower_bound) | (df[col] > upper_bound)).sum())
                if outlier_count > 0:
                    outliers_info[col] = outlier_count
                    total_outliers += outlier_count

                # 执行裁剪
                df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)

        cleaned_filename = f"cleaned_{filename.split('.')[0]}.csv"
        df.to_csv(os.path.join(UPLOAD_FOLDER, cleaned_filename), index=False, encoding='utf-8-sig')

        # 🚀 将详尽的战报传给前端
        return jsonify({
            "status": "success",
            "message": "清洗完成",
            "data": {
                "cleaned_filename": cleaned_filename,
                "total_rows": total_rows,
                "total_missing": total_missing,
                "missing_details": missing_info,
                "total_outliers": total_outliers,
                "outliers_details": outliers_info
            }
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


# ==========================================
# 🚀 V2.0 终极数据引擎：全量持久化与智能物理隔离
# ==========================================
# ==========================================
# 🚀 V2.0 终极数据引擎：全量持久化与智能同名检测
# ==========================================
@process_bp.route('/api/data/save', methods=['POST', 'OPTIONS'])
def save_data():
    from flask import make_response, jsonify
    import os
    import pandas as pd
    from config import UPLOAD_FOLDER

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
        overwrite_confirmed = data.get('overwrite_confirmed', False)  # 🚀 接收前端的强行覆盖指令

        if not filename or rows is None:
            return jsonify({"status": "error", "message": "参数缺失，无法保存"}), 400

        BASE_DIR = os.path.dirname(UPLOAD_FOLDER)
        OUTPUT_FOLDER = os.path.join(BASE_DIR, 'outputs')
        os.makedirs(OUTPUT_FOLDER, exist_ok=True)

        df = pd.DataFrame(rows)

        # 1. 决定目标文件路径
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

        # 2. 🚀 同名检测防御系统 (如果是新建或改名，且目标文件已存在，且未确认强行覆盖)
        if not overwrite_confirmed and os.path.exists(file_path):
            if save_mode in ['new_output', 'rename_source'] or is_new_table:
                return jsonify({
                    "status": "exists",
                    "message": f"目标路径下已存在名为 <b style='color:#fa8c16;'>{filename}</b> 的文件！<br>继续操作将永久抹除原文件数据，是否确认覆盖？"
                })

        # 3. 销毁旧文件 (仅在重命名模式下)
        if save_mode == 'rename_source':
            old_in_up = os.path.join(UPLOAD_FOLDER, old_filename)
            old_in_out = os.path.join(OUTPUT_FOLDER, old_filename)
            if os.path.exists(old_in_up): os.remove(old_in_up)
            if os.path.exists(old_in_out): os.remove(old_in_out)

        # 4. 执行写盘
        df.to_csv(file_path, index=False, encoding='utf-8-sig')

        res = jsonify({"status": "success", "message": msg})
        res.headers.add("Access-Control-Allow-Origin", "*")
        return res

    except Exception as e:
        import traceback
        traceback.print_exc()
        res = jsonify({"status": "error", "message": f"保存失败: {str(e)}"})
        res.headers.add("Access-Control-Allow-Origin", "*")
        return res, 500


# ==========================================
# 🚀 V2.0 数据引擎：全量数据拉取接口 (供工作区渲染)
# ==========================================
@process_bp.route('/api/data/get_full', methods=['POST', 'OPTIONS'])
def get_full_data():
    from flask import make_response, jsonify
    import pandas as pd
    import os
    from config import UPLOAD_FOLDER

    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response

    try:
        filename = request.json.get('filename')
        if not filename:
            return jsonify({"status": "error", "message": "缺少文件名"}), 400

        BASE_DIR = os.path.dirname(UPLOAD_FOLDER)
        OUTPUT_FOLDER = os.path.join(BASE_DIR, 'outputs')

        # 智能寻址：优先读 outputs，找不到再读 uploads
        file_path = os.path.join(OUTPUT_FOLDER, filename)
        if not os.path.exists(file_path):
            file_path = os.path.join(UPLOAD_FOLDER, filename)

        # 读取数据并将 NaN 转换为空字符串，确保传递给前端时不报错
        df = pd.read_csv(file_path, encoding='utf-8-sig')
        df = df.fillna("")

        res = jsonify({
            "status": "success",
            "headers": df.columns.tolist(),
            "rows": df.to_dict(orient='records')
        })
        res.headers.add("Access-Control-Allow-Origin", "*")
        return res

    except Exception as e:
        import traceback
        traceback.print_exc()
        res = jsonify({"status": "error", "message": f"拉取数据失败: {str(e)}"})
        res.headers.add("Access-Control-Allow-Origin", "*")
        return res, 500