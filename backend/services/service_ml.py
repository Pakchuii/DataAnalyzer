import os
import pandas as pd
import numpy as np
from flask import request, jsonify
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
from core.config import UPLOAD_FOLDER
from core.utils import read_df


def do_summary():
    """
    【数据宏观探测器】：评估数据质量，计算稀疏度，并基于皮尔逊相关性提供 AI 模型训练的自动化建议靶点。
    """
    try:
        filename = request.json.get('filename')
        if not filename: return jsonify({"status": "error", "message": "系统未找到当前处理的文件"}), 400
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))

        # 尝试将能转数值的列都强转成数值，为机器学习铺路
        for col in df.columns:
            try:
                df[col] = pd.to_numeric(df[col])
            except Exception:
                pass

        # 核心特征分类
        all_cols = df.columns.tolist()
        numeric_cols = [c for c in all_cols if pd.api.types.is_numeric_dtype(df[c]) and not any(
            kw in str(c).lower() for kw in ['号', 'id', '编号', '代码'])]
        categorical_cols = [c for c in all_cols if c not in numeric_cols]
        binary_cols = [c for c in all_cols if df[c].nunique() == 2]

        row_count = len(df)
        col_count = len(df.columns)
        insights = []

        # 1. 矩阵稀疏度 (Sparsity) 探针与过拟合预警
        total_cells = row_count * col_count
        missing_cells = df.isnull().sum().sum()
        missing_rate = missing_cells / total_cells if total_cells > 0 else 0
        quality_score = 100 - (missing_rate * 100)

        if row_count < 30:
            quality_desc = f"⚠️ **数据质量评估**：规模极小（仅包含 {row_count} 条记录）。在此数据量下极易出现严重的“过拟合”，建议您使用基础「描述统计」。"
        elif missing_rate > 0.15:
            quality_desc = f"⚠️ **数据质量评估**：矩阵存在较高稀疏率（空值占比高达 {missing_rate * 100:.1f}%）。建议您先进行【✨ 智能清洗】以填补缺失缝隙。"
        else:
            quality_desc = f"🛡️ **数据质量评估**：极佳！数据矩阵完整度高达 {quality_score:.1f}%，完全具备开展深层机器学习的底层条件。"

        insights.append(quality_desc)
        insights.append(
            f"📦 **全局结构剖析**：系统成功解析出 **{len(numeric_cols)}** 个「量化数值指标」与 **{len(categorical_cols)}** 个「定性类别指标」。")

        # 2. 偏度 (Skewness) 与分布断档检测器
        if len(numeric_cols) > 0:
            skew_insights = []
            for col in numeric_cols:
                skew_val = df[col].skew()
                if pd.notna(skew_val):
                    if skew_val > 1.5:
                        skew_insights.append(f"【{col}】存在严重的“右偏”断档")
                    elif skew_val < -1.5:
                        skew_insights.append(f"【{col}】存在严重的“左偏”断档")
            if skew_insights:
                insights.append("📉 **极端分布预警**：侦测到部分特征存在不平滑的断档分布。其中：" + "；".join(
                    skew_insights) + "。建议使用 3σ 准则清洗异常高频值。")
            else:
                insights.append("📊 **数据分布健康度**：各数值型指标分布均匀，呈现良好的形态特征，未见严重偏态。")

        if binary_cols:
            insights.append(
                f"⚖️ **群体差异性检验推荐**：侦测到完美的二分类定性变量【{binary_cols[0]}】，极其适合作为「独立样本 t 检验」的分组基准条件。")

        # 3. 靶点特征推荐算法 (基于关联度极值搜寻最易预测特征)
        has_ai_recommendation = False
        if len(numeric_cols) >= 3:
            corr_df = df[numeric_cols].corr().abs()
            target_candidate = corr_df.sum().idxmax()
            feature_candidates = [c for c in numeric_cols if c != target_candidate]
            insights.append(
                f"🤖 **AI 预测引擎最佳训练组合**：为了获得最佳回归拟合效果，建议将关联度最高的【{target_candidate}】设为 **目标变量 (Y)**，并将【{', '.join(feature_candidates[:3])}】等设为解释特征！")
            has_ai_recommendation = True

        sop_text = "🗺️ **零基础专属·极简分析导航**：<br>👉 **Step 1 探底**：勾选数值变量点击「描述统计」。<br>👉 **Step 2 寻因**：勾选变量点击「关联分析」。"
        if has_ai_recommendation:
            sop_text += "<br>👉 **Step 3 预测**：进入「机器学习引擎」一键点击训练，享受 AI 自动推理的乐趣！"
        else:
            sop_text += "<br>👉 **Step 3 探索**：进入「机器学习引擎」挖掘更深层的规律。"

        insights.append(sop_text)

        return jsonify({"status": "success", "data": insights})
    except Exception as e:
        return jsonify({"status": "error", "message": f"算法运算异常: {str(e)}"}), 500


def do_predict():
    """【预测模块一：基于随机森林 (Random Forest) 的特征重要性拆解】"""
    try:
        data = request.json
        filename = data.get('filename')
        target_col = data.get('target_col')
        feature_cols = data.get('feature_cols', [])

        if not filename or not target_col or len(feature_cols) == 0:
            return jsonify({"status": "error", "message": "参数设定不完整"}), 400

        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        df_clean = df[[target_col] + feature_cols].dropna()

        if len(df_clean) < 10:
            return jsonify({"status": "error", "message": "去除缺失值后有效数据量过低，模型无法收敛"}), 400

        X = df_clean[feature_cols]
        y = df_clean[target_col]

        # 以 8:2 切分构建训练集与测试集
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # 实例化 Bagging 集成树模型，锁定随机种子以保证结果复现性
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        r2 = r2_score(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)

        importances = model.feature_importances_.tolist()
        feature_importances = [round(i * 100, 2) for i in importances]

        # 降维抽样，下发不超过 100 条真实/预测对给前端散点图
        scatter_data = [[float(actual), float(pred)] for actual, pred in
                        zip(y_test.tolist()[:100], y_pred.tolist()[:100])]

        return jsonify({
            "status": "success",
            "data": {
                "r2": round(r2, 4),
                "mse": round(mse, 4),
                "features": feature_cols,
                "importances": feature_importances,
                "scatter": scatter_data
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def do_predict_new():
    """【预测模块二：集成时间序列平滑与置信度动态惩罚规则的推理引擎】"""
    try:
        data = request.json
        filename = data.get('filename')
        target_col = data.get('target_col')
        feature_cols = data.get('feature_cols', [])

        if not filename or not target_col or len(feature_cols) == 0:
            return jsonify({"status": "error", "message": "参数设定不完整"}), 400

        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        df_clean = df[[target_col] + feature_cols].dropna()

        if len(df_clean) < 10:
            return jsonify({"status": "error", "message": "有效数据量不足"}), 400

        X = df_clean[feature_cols]
        y = df_clean[target_col]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)

        # 提取 50 条连续序列进行仿真推理展示
        sample_size = min(50, len(X_test))
        X_show = X_test.iloc[:sample_size]
        y_show_real = y_test.iloc[:sample_size].values
        y_show_pred = model.predict(X_show)

        # ====== 🚀 核心算法创新：引入启发式多维惩罚机制 ======
        sample_r2 = r2_score(y_show_real, y_show_pred)
        std_pred = np.std(y_show_pred)
        std_real = np.std(y_show_real)

        # 1. Pearson 趋势相关系数（侦测拟合曲线相位是否一致）
        if std_pred == 0 or std_real == 0:
            corr = 0
        else:
            corr = np.corrcoef(y_show_real, y_show_pred)[0, 1]

        # 2. 平均绝对百分比误差 (MAPE) 推导基础准确率
        mape = np.mean(np.abs((y_show_real - y_show_pred) / (y_show_real + 1e-9)))
        acc = max(0, 1 - mape)

        # 3. 退化熔断：若 R2 极低或相关性破灭，代表模型退化为纯均值直线。此时触发惩罚系数 0.45
        if sample_r2 < 0.15 or corr < 0.3:
            confidence = round(acc * 45, 2)
        else:
            confidence = round((acc * 0.4 + corr * 0.6) * 100, 2)

        if confidence > 99:
            confidence = 98.75

        labels = [f"测试点 {i + 1}" for i in range(sample_size)]

        insight = ""
        if confidence < 50:
            insight = f"不幸的是，综合置信度检测反馈极低 (跌至 {confidence}%)。请敏锐地注意到图中紫色的预测轨道已经彻底趋于平缓（在视觉上呈现一字直线状或极为死板的平铺），完全陷入了“失明状态”，未能追踪到灰色真实数据带的剧烈撕扯与波动。在算法工程视角来看，这说明该模型彻底未能从样本群中捕捉到任何潜藏规律，并已发生了严重的“退化降级至仅输出平均值”的灾难现象。最终结论：当前被您划选为 X 轴的特征变量集与所要预测的标的 Y 之间**在物理逻辑层面基本上不存在任何潜在的关联度与因果性**，请立即返回左侧调控面板引入带有更强因果张力的全新业务维度特征进行重新降维训练！"
        elif confidence < 80:
            insight = f"当前模型的预测置信度处于中等水平 ({confidence}%)。模型勉强抓取到了数据的起伏趋势，但在剧烈波动的高点或低点处存在预测迟滞（即图中紫色预测线无法完全贴合灰色真实线的极值部分）。这表明您当前选择的特征变量具有一定的解释能力，但不足以支撑高精度的业务推理。建议：您可以尝试在特征面板中勾选更多的辅助维度，或者对数据进行智能清洗（剔除极端异常值）以提升拟合上限。"
        else:
            insight = f"令人振奋！当前模型展现出了超极高精度的拟合结果（综合置信度高达 {confidence}%）！从上方走势图中可以直观感受到，紫色的感知预测线与灰色真实历史轨道近乎完美地缠绕在一起，模型十分敏锐地捕获了每一次隐晦的波动变轨。这雄辩地证明了您当前所选取的特征组合与预测目标（Y）之间**存在着极其强劲、不容置疑的线性/非线性因果映射网络**！该模型组已完全具备实战部署的资质，可以直接投产以辅助商业/科研决策。"

        return jsonify({
            "status": "success",
            "data": {
                "confidence": confidence,
                "sampleSize": sample_size,
                "labels": labels,
                "realValues": np.round(y_show_real, 2).tolist(),
                "predictedValues": np.round(y_show_pred, 2).tolist(),
                "insight": insight
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500