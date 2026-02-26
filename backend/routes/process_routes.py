import os
import traceback
import pandas as pd
from flask import Blueprint, request, jsonify, make_response
from config import UPLOAD_FOLDER
from utils import read_df

process_bp = Blueprint('process', __name__)


@process_bp.route('/api/preview', methods=['POST'])
def preview_data():
    """
    【性能优化：前端数据分页与快照机制】
    仅向前端下发前 15 行数据作为预览，极大降低网络 I/O 开销与浏览器渲染压力。
    """
    try:
        filename = request.json.get('filename')
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        # 提取快照并将空值转换为空字符串，确保 JSON 序列化安全
        preview_df = df.head(15).fillna("").astype(str)
        return jsonify({"status": "success",
                        "data": {"columns": preview_df.columns.tolist(), "rows": preview_df.to_dict(orient='records')}})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@process_bp.route('/api/clean', methods=['POST'])
def clean_data():
    """
    【核心预处理算法：智能缺失值插补与异常值裁剪引擎】
    利用统计学规律全自动洗除噪声数据，并生成清洗战报。
    """
    try:
        filename = request.json.get('filename')
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        numeric_cols = df.select_dtypes(include=['number']).columns

        # 初始化战报探针容器
        total_rows = len(df)
        missing_info = {}
        outliers_info = {}
        total_missing = 0
        total_outliers = 0

        if len(numeric_cols) > 0:
            # 1. 缺失值插补 (Mean Imputation 均值填充法)
            for col in numeric_cols:
                null_count = int(df[col].isnull().sum())
                if null_count > 0:
                    missing_info[col] = null_count
                    total_missing += null_count
            df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())

            # 2. 异常值裁剪 (基于 3σ 拉依达准则 Pauta Criterion)
            for col in numeric_cols:
                mean = df[col].mean()
                std = df[col].std()
                if pd.isna(std):
                    std = 0
                lower_bound = mean - 3 * std
                upper_bound = mean + 3 * std

                # 统计越界记录数
                outlier_count = int(((df[col] < lower_bound) | (df[col] > upper_bound)).sum())
                if outlier_count > 0:
                    outliers_info[col] = outlier_count
                    total_outliers += outlier_count

                # 裁剪：将超出 3σ 范围的极值拉回至边界，避免过度破坏数据分布
                df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)

        # 固化清洗后的数据模型
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
                "outliers_details": outliers_info
            }
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@process_bp.route('/api/data/save', methods=['POST', 'OPTIONS'])
def save_data():
    """
    【架构亮点：智能物理隔离与状态机路由系统】
    具备跨域嗅探(CORS)、重命名跟踪机制与同名冲突预警防线。
    """
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

        if not filename or rows is None:
            return jsonify({"status": "error", "message": "参数缺失，无法保存"}), 400

        # 【沙盒隔离机制】：为派生数据建立独立的 outputs 物理存储空间
        BASE_DIR = os.path.dirname(UPLOAD_FOLDER)
        OUTPUT_FOLDER = os.path.join(BASE_DIR, 'outputs')
        os.makedirs(OUTPUT_FOLDER, exist_ok=True)

        df = pd.DataFrame(rows)

        # 1. 状态机：路径决策与智能寻址
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

        # 2. 【防灾机制：同名文件冲突雷达】
        if not overwrite_confirmed and os.path.exists(file_path):
            if save_mode in ['new_output', 'rename_source'] or is_new_table:
                return jsonify({
                    "status": "exists",
                    "message": f"目标路径下已存在名为 <b style='color:#fa8c16;'>{filename}</b> 的文件！<br>继续操作将永久抹除原文件数据，是否确认覆盖？"
                })

        # 3. 垃圾回收：重命名后彻底销毁历史文件实体
        if save_mode == 'rename_source':
            old_in_up = os.path.join(UPLOAD_FOLDER, old_filename)
            old_in_out = os.path.join(OUTPUT_FOLDER, old_filename)
            if os.path.exists(old_in_up): os.remove(old_in_up)
            if os.path.exists(old_in_out): os.remove(old_in_out)

        # 4. 执行磁盘持久化写入 (UTF-8-SIG 解决 Excel 解析中文乱码)
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


@process_bp.route('/api/data/get_full', methods=['POST', 'OPTIONS'])
def get_full_data():
    """
    【I/O引擎】：全量数据下发通道 (供工作区大屏渲染使用)
    支持 CORS 预检宽容策略，防止前端拉取时请求被熔断。
    """
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

        # 智能寻址降级机制：优先读隔离区 outputs，找不到则回退至源区 uploads
        file_path = os.path.join(OUTPUT_FOLDER, filename)
        if not os.path.exists(file_path):
            file_path = os.path.join(UPLOAD_FOLDER, filename)

        # 加载全量数据并将缺失值NaN转为空字符串，防止前端 JSON 序列化崩溃
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