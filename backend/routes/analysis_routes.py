import os
import pandas as pd
import numpy as np
import scipy.stats as stats
from flask import Blueprint, request, jsonify
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

from config import UPLOAD_FOLDER

analysis_bp = Blueprint('analysis', __name__)


def read_df(filepath):
    """
    通用数据读取工具函数
    支持自动识别 csv 与 excel 格式，并处理常见编码问题
    """
    ext = filepath.rsplit('.', 1)[1].lower()
    if ext == 'csv':
        try:
            return pd.read_csv(filepath, encoding='utf-8')
        except UnicodeDecodeError:
            return pd.read_csv(filepath, encoding='gbk')
    else:
        return pd.read_excel(filepath, engine='openpyxl' if ext == 'xlsx' else 'xlrd')


# ==========================================
# 模块一：基础统计与分布可视化
# ==========================================

@analysis_bp.route('/api/analyze/descriptive', methods=['POST'])
def descriptive_analysis():
    """执行描述性统计分析（均值、中位数、标准差等）"""
    try:
        df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
        selected = [c for c in request.json.get('columns', []) if c in df.columns]

        stats_data = []
        for col in selected:
            d = df[col].dropna()
            stats_data.append({
                "variable": str(col),
                "count": int(d.count()),
                "mean": float(round(d.mean(), 4)),
                "median": float(round(d.median(), 4)),
                "std": float(round(d.std(), 4)),
                "min": float(round(d.min(), 4)),
                "max": float(round(d.max(), 4))
            })

        return jsonify({"status": "success", "data": stats_data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@analysis_bp.route('/api/visualize/distribution', methods=['POST'])
def visualize_distribution():
    """生成数值型变量的直方图与箱线图数据"""
    try:
        df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
        selected = request.json.get('columns', [])

        charts_data = []
        for col in selected:
            if col not in df.columns:
                continue

            d = df[col].dropna()
            if len(d) == 0:
                continue

            counts, bin_edges = np.histogram(d, bins='auto')

            charts_data.append({
                "variable": col,
                "boxplot": [
                    float(d.min()), float(d.quantile(0.25)), float(d.median()),
                    float(d.quantile(0.75)), float(d.max())
                ],
                "histogram": {
                    "categories": [f"{round(bin_edges[i], 1)}~{round(bin_edges[i + 1], 1)}" for i in
                                   range(len(counts))],
                    "series": [int(c) for c in counts]
                }
            })

        return jsonify({"status": "success", "data": charts_data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@analysis_bp.route('/api/visualize/categorical', methods=['POST'])
def visualize_categorical():
    """生成分类变量的饼图数据"""
    try:
        df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
        cat_cols = df.select_dtypes(include=['object']).columns.tolist()

        charts_data = []
        for col in cat_cols:
            # 严格过滤：绝对不让唯一标识符（如姓名、学号）去画饼图
            if any(kw in str(col).lower() for kw in ['姓名', 'name', '号', 'id']) or df[col].nunique() > 15:
                continue

            counts = df[col].value_counts()
            charts_data.append({
                "variable": col,
                "categories": counts.index.tolist(),
                "values": counts.values.tolist(),
                "pie_data": [{"name": str(k), "value": int(v)} for k, v in counts.items()]
            })

        return jsonify({"status": "success", "data": charts_data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ==========================================
# 模块二：高阶分析（相关性、t检验、雷达图）
# ==========================================

@analysis_bp.route('/api/get_options', methods=['POST'])
def get_options():
    """获取指定列的所有唯一选项（用于雷达图下拉框）"""
    try:
        df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
        col = request.json.get('column')

        if col not in df.columns:
            return jsonify({"status": "error", "message": "列不存在"}), 400

        # 强制将该列转为字符串并去重，最多取 1000 个防止浏览器卡死
        options = df[col].dropna().astype(str).unique().tolist()[:1000]
        return jsonify({"status": "success", "data": options})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@analysis_bp.route('/api/analyze/advanced', methods=['POST'])
def advanced_analysis():
    """高阶关联分析：正态性检验、皮尔逊相关系数矩阵、散点图"""
    try:
        df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
        selected = [c for c in request.json.get('columns', []) if c in df.columns]

        if len(selected) < 2:
            return jsonify({"status": "error", "message": "变量过少，无法进行关联分析"}), 400

        # 1. 正态性检验 (Shapiro-Wilk)
        normality_results = []
        for col in selected:
            d = df[col].dropna()
            if len(d) >= 3:
                stat, p = stats.shapiro(d)
                normality_results.append({
                    "variable": col,
                    "statistic": float(round(stat, 4)),
                    "p_value": float(round(p, 4)),
                    "is_normal": bool(p > 0.05)
                })

        # 2. 相关性矩阵构建
        corr_matrix = []
        corr_df = df[selected].corr(method='pearson').fillna(0).round(3)
        for i in range(len(selected)):
            for j in range(len(selected)):
                corr_matrix.append([i, j, float(corr_df.iloc[i, j])])

        # 3. 散点图数据抽取 (取前两个变量)
        var1, var2 = selected[0], selected[1]
        scatter_vars = [var1, var2]
        temp_df = df[[var1, var2]].copy().dropna()
        scatter_data = temp_df.values.tolist()

        return jsonify({
            "status": "success",
            "data": {
                "variables": selected,
                "normality": normality_results,
                "correlation_matrix": corr_matrix,
                "scatter_data": scatter_data,
                "scatter_vars": scatter_vars
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@analysis_bp.route('/api/analyze/ttest', methods=['POST'])
def ttest_analysis():
    """独立样本 t 检验"""
    try:
        df = read_df(os.path.join(UPLOAD_FOLDER, request.json.get('filename')))
        group_col = request.json.get('group_col')
        target_cols = request.json.get('columns', [])

        if not group_col or group_col not in df.columns:
            return jsonify({"status": "error", "message": "未选择有效分组变量"}), 400

        groups = df[group_col].dropna().unique()
        if len(groups) != 2:
            return jsonify({"status": "error", "message": "非二分类变量，无法进行 t 检验"}), 400

        group1_data = df[df[group_col] == groups[0]]
        group2_data = df[df[group_col] == groups[1]]
        results = []

        for col in target_cols:
            if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                d1 = group1_data[col].dropna()
                d2 = group2_data[col].dropna()

                if len(d1) > 1 and len(d2) > 1:
                    stat, p = stats.ttest_ind(d1, d2, equal_var=False)
                    results.append({
                        "variable": col,
                        "group1_name": str(groups[0]),
                        "group1_mean": float(round(d1.mean(), 4)),
                        "group2_name": str(groups[1]),
                        "group2_mean": float(round(d2.mean(), 4)),
                        "t_value": float(round(stat, 4)),
                        "p_value": float(round(p, 4)),
                        "significant": bool(p < 0.05)
                    })

        return jsonify({"status": "success", "data": results})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@analysis_bp.route('/api/visualize/radar', methods=['POST'])
def visualize_radar():
    """个体雷达图能力诊断"""
    try:
        filename = request.json.get('filename')
        id_col = request.json.get('id_col')
        target_val = request.json.get('target_val')

        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        numeric_df = df.select_dtypes(include=['number'])

        # 过滤无效指标
        valid_numeric_cols = [c for c in numeric_df.columns if
                              not any(kw in str(c).lower() for kw in ['号', 'id', '编号', '代码'])]
        if not valid_numeric_cols:
            return jsonify({"status": "error", "message": "未找到可用于雷达图的数值指标"}), 400

        avg_data = numeric_df[valid_numeric_cols].mean().round(2).tolist()

        # 强制类型转换比对，解决学号等字符串数字匹配问题
        target_row = df[df[id_col].astype(str) == str(target_val)]
        if target_row.empty:
            return jsonify({"status": "error", "message": "未找到指定个体"}), 400

        target_data = target_row[valid_numeric_cols].iloc[0].fillna(0).round(2).tolist()
        indicators = [{"name": col, "max": float(numeric_df[col].max()) * 1.1} for col in valid_numeric_cols]

        return jsonify({
            "status": "success",
            "data": {
                "indicators": indicators,
                "avg_data": avg_data,
                "target_data": target_data,
                "target_name": str(target_val)
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ==========================================
# 模块三：智能化与机器学习算法
# ==========================================

@analysis_bp.route('/api/analyze/summary', methods=['POST'])
def generate_summary():
    """AI 智能文字数据解读报告生成"""
    try:
        filename = request.json.get('filename')
        if not filename:
            return jsonify({"status": "error", "message": "系统未找到当前处理的文件"}), 400

        df = read_df(os.path.join(UPLOAD_FOLDER, filename))

        # 尝试将所有列转为数值型，便于后续提取
        for col in df.columns:
            try:
                df[col] = pd.to_numeric(df[col])
            except Exception:
                pass

        numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c]) and not any(
            kw in str(c).lower() for kw in ['号', 'id', '编号', '代码'])]
        insights = []

        # 1. 概览洞察
        insights.append(
            f"✨ **数据概览**：当前数据集共包含 {len(df)} 条记录，成功识别出 {len(numeric_cols)} 个关键数值指标。")

        if len(numeric_cols) > 0:
            std_series = df[numeric_cols].std()
            if not std_series.isna().all():
                max_std_col = std_series.idxmax()
                min_std_col = std_series.idxmin()
                if pd.notna(max_std_col) and pd.notna(min_std_col):
                    insights.append(
                        f"📊 **波动洞察**：数据中【{max_std_col}】的离散程度最大，说明个体差异最显著；而【{min_std_col}】分布最为集中稳定。")

            # 2. 关联洞察
            if len(numeric_cols) >= 2:
                corr_df = df[numeric_cols].corr().abs()
                for i in range(len(corr_df.columns)):
                    corr_df.iloc[i, i] = 0.0

                if not corr_df.isna().all().all():
                    max_corr = corr_df.max().max()
                    if pd.notna(max_corr) and max_corr > 0.5:
                        safe_matrix = corr_df.to_numpy()
                        row_idx, col_idx = np.unravel_index(np.nanargmax(safe_matrix), safe_matrix.shape)
                        var1, var2 = corr_df.index[row_idx], corr_df.columns[col_idx]
                        insights.append(
                            f"🔗 **强关联发现**：系统检测到【{var1}】与【{var2}】存在较强的线性相关性（r={round(max_corr, 2)}）。这表明当其中一个指标变化时，另一个往往也会随之呈现规律性波动。")

        insights.append("💡 **分析建议**：建议结合右侧的雷达图进行个体优势诊断，并利用 t 检验进一步探索不同群体间的差异。")
        return jsonify({"status": "success", "data": insights})
    except Exception as e:
        return jsonify({"status": "error", "message": f"算法运算异常: {str(e)}"}), 500


@analysis_bp.route('/api/predict', methods=['POST'])
def predict_data():
    """机器学习预测引擎 (Random Forest Regressor)"""
    try:
        data = request.json
        filename = data.get('filename')
        target_col = data.get('target_col')
        feature_cols = data.get('feature_cols', [])

        if not filename or not target_col or len(feature_cols) == 0:
            return jsonify({"status": "error", "message": "参数不完整"}), 400

        df = read_df(os.path.join(UPLOAD_FOLDER, filename))

        # 提取有效数据并清理空值
        df_clean = df[[target_col] + feature_cols].dropna()
        if len(df_clean) < 10:
            return jsonify({"status": "error", "message": "有效数据量太少，无法训练模型"}), 400

        X = df_clean[feature_cols]
        y = df_clean[target_col]

        # 划分训练集和测试集
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # 训练随机森林回归模型
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        # 计算模型评估指标
        r2 = r2_score(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)
        importances = model.feature_importances_.tolist()

        # 组装散点图数据
        scatter_data = [[float(actual), float(pred)] for actual, pred in
                        zip(y_test.tolist()[:100], y_pred.tolist()[:100])]

        return jsonify({
            "status": "success",
            "data": {
                "r2": round(r2, 4),
                "mse": round(mse, 4),
                "features": feature_cols,
                "importances": [round(i * 100, 2) for i in importances],
                "scatter": scatter_data
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ==========================================
# 模块四：企业级安全协议
# ==========================================

@analysis_bp.route('/api/mask', methods=['POST'])
def mask_data():
    """企业级隐私数据脱敏加密"""
    try:
        filename = request.json.get('filename')
        if not filename:
            return jsonify({"status": "error", "message": "未找到文件"}), 400

        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        masked_cols = []

        # 核心加密算法函数
        def mask_val(x):
            x = str(x).strip()
            if x in ['nan', 'None', '']:
                return x
            if len(x) <= 2:
                return x[0] + '*'
            elif len(x) == 3:
                return x[0] + '*' + x[-1]
            else:
                return x[:4] + '****'

        # 智能扫描敏感列
        for col in df.columns:
            col_name = str(col).lower()
            if any(kw in col_name for kw in ['名', 'name', '号', 'id', '手机', '电话', '身份']):
                masked_cols.append(col)
                df[col] = df[col].apply(mask_val)

        # 另存脱敏文件
        masked_filename = "masked_" + filename
        df.to_csv(os.path.join(UPLOAD_FOLDER, masked_filename), index=False, encoding='utf-8-sig')

        return jsonify({
            "status": "success",
            "data": {
                "masked_filename": masked_filename,
                "masked_cols": masked_cols
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500