import os
import pandas as pd
import numpy as np
from flask import request, jsonify
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
from config import UPLOAD_FOLDER
from utils import read_df


def do_summary():
    try:
        filename = request.json.get('filename')
        if not filename: return jsonify({"status": "error", "message": "系统未找到当前处理的文件"}), 400
        df = read_df(os.path.join(UPLOAD_FOLDER, filename))

        # 尝试将能转数值的列都转成数值
        for col in df.columns:
            try:
                df[col] = pd.to_numeric(df[col])
            except Exception:
                pass

        # 核心分类：识别量化指标与类别指标
        all_cols = df.columns.tolist()
        numeric_cols = [c for c in all_cols if pd.api.types.is_numeric_dtype(df[c]) and not any(
            kw in str(c).lower() for kw in ['号', 'id', '编号', '代码'])]
        categorical_cols = [c for c in all_cols if c not in numeric_cols]

        # 提取特殊特征用于指导
        binary_cols = [c for c in all_cols if df[c].nunique() == 2]

        row_count = len(df)
        col_count = len(df.columns)
        insights = []

        # ==========================================
        # 🚀 1. 新增：数据质量与可用性权威评估
        # ==========================================
        total_cells = row_count * col_count
        missing_cells = df.isnull().sum().sum()
        missing_rate = missing_cells / total_cells if total_cells > 0 else 0
        quality_score = 100 - (missing_rate * 100)

        if row_count < 30:
            quality_desc = f"⚠️ **数据质量评估**：当前数据集规模极小（仅 {row_count} 条）。虽然数据完整度为 {quality_score:.1f}%，但在进行复杂机器学习时极易出现“过拟合”。建议优先使用基础的「描述统计」和「t 检验」。"
        elif missing_rate > 0.15:
            quality_desc = f"⚠️ **数据质量评估**：当前数据缺失率较高（空值占比 {missing_rate * 100:.1f}%）。建议您先在左侧控制台点击【✨ 智能清洗】进行缺失值插补，否则将严重影响后续机器学习预测的准确性！"
        else:
            quality_desc = f"🛡️ **数据质量评估**：极佳！当前数据集包含 {row_count} 条样本，数据完整度高达 {quality_score:.1f}%。特征矩阵十分健康，完全具备进入深层机器学习与关联挖掘的分析标准。"
        insights.append(quality_desc)

        insights.append(
            f"📦 **全局结构剖析**：系统成功解析出 **{len(numeric_cols)}** 个「量化数值指标」与 **{len(categorical_cols)}** 个「定性类别指标」。")

        # ==========================================
        # 🚀 2. 新增：极端偏态(断档)分布与异常值侦测
        # ==========================================
        if len(numeric_cols) > 0:
            skew_insights = []
            for col in numeric_cols:
                skew_val = df[col].skew()
                if pd.notna(skew_val):
                    # 偏度绝对值大于 1.5 视为存在严重的长尾断档
                    if skew_val > 1.5:
                        skew_insights.append(f"【{col}】存在严重的“右偏”断档（即极少数个体数值异常偏高，拉高了平均水位）")
                    elif skew_val < -1.5:
                        skew_insights.append(f"【{col}】存在严重的“左偏”断档（即极少数个体数值异常偏低，严重拖了整体后腿）")

            if skew_insights:
                insights.append("📉 **极端分布预警**：系统侦测到部分指标存在断档式分布。其中：" + "；".join(
                    skew_insights) + "。建议在建模前使用【✨ 智能清洗】处理极端异常值（基于 3σ 原则），或通过「可视化」查看其直方图表现。")
            else:
                insights.append(
                    "📊 **数据分布健康度**：各数值型指标分布较为均匀，未检测到极其严重的单边“断档”或极端异常偏态分布。")

        # ==========================================
        # 3. t检验靶向推荐
        # ==========================================
        if binary_cols:
            insights.append(
                f"⚖️ **群体差异性检验推荐**：系统侦测到完美的二分类变量【{binary_cols[0]}】。强烈建议您将其设为**「t 检验分组变量」**，去验证不同群体在该维度下是否存在统计学意义上的显著差异！")

        # ==========================================
        # 4. 机器学习靶点推荐 (带条件判定)
        # ==========================================
        has_ai_recommendation = False
        if len(numeric_cols) >= 3:
            corr_df = df[numeric_cols].corr().abs()
            target_candidate = corr_df.sum().idxmax()
            feature_candidates = [c for c in numeric_cols if c != target_candidate]

            insights.append(
                f"🤖 **AI 预测引擎最佳组合**：经过特征矩阵扫描，【{target_candidate}】与其他变量存在最广泛的联动效应。强烈建议将【{target_candidate}】设为 **目标变量 (Y)**，将【{', '.join(feature_candidates[:3])} 等】设为 **特征变量 (X)**，一键训练预测模型！")
            has_ai_recommendation = True

        # ==========================================
        # 🚀 5. 保姆级 SOP 导航 (修复逻辑 Bug)
        # ==========================================
        sop_text = "🗺️ **零基础专属·极简分析导航 (SOP)**：<br>👉 **Step 1 探底**：点击「描述统计」与「可视化」，看一眼数据的均值表现与图表分布规律。<br>👉 **Step 2 寻因**：点击「关联分析」，看一眼热力图，颜色越深说明两个指标“捆绑”得越紧。"

        # 动态组装 Step 3：如果有推荐组合就引流，没有就通用引导
        if has_ai_recommendation:
            sop_text += "<br>👉 **Step 3 预测**：严格照抄上方【AI 预测引擎最佳组合】，进入「机器学习引擎」点击训练，享受 AI 自动推理！"
        else:
            sop_text += "<br>👉 **Step 3 探索**：进入左侧「机器学习引擎」，自由勾选您感兴趣的目标变量与特征变量，尝试挖掘潜在的数据规律。"

        insights.append(sop_text)

        return jsonify({"status": "success", "data": insights})
    except Exception as e:
        return jsonify({"status": "error", "message": f"算法运算异常: {str(e)}"}), 500





def do_predict():
    try:
        data = request.json
        filename, target_col, feature_cols = data.get('filename'), data.get('target_col'), data.get('feature_cols', [])
        if not filename or not target_col or len(feature_cols) == 0: return jsonify(
            {"status": "error", "message": "参数不完整"}), 400

        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        df_clean = df[[target_col] + feature_cols].dropna()
        if len(df_clean) < 10: return jsonify({"status": "error", "message": "有效数据量太少，无法训练模型"}), 400

        X, y = df_clean[feature_cols], df_clean[target_col]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        r2, mse = r2_score(y_test, y_pred), mean_squared_error(y_test, y_pred)
        scatter_data = [[float(actual), float(pred)] for actual, pred in
                        zip(y_test.tolist()[:100], y_pred.tolist()[:100])]

        return jsonify({"status": "success",
                        "data": {"r2": round(r2, 4), "mse": round(mse, 4), "features": feature_cols,
                                 "importances": [round(i * 100, 2) for i in model.feature_importances_.tolist()],
                                 "scatter": scatter_data}})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def do_predict_new():
    """V1.2 算法进化版：引入 R2 与趋势惩罚的智能推理接口"""
    try:
        data = request.json
        filename, target_col, feature_cols = data.get('filename'), data.get('target_col'), data.get('feature_cols', [])
        if not filename or not target_col or len(feature_cols) == 0:
            return jsonify({"status": "error", "message": "参数不完整"}), 400

        df = read_df(os.path.join(UPLOAD_FOLDER, filename))
        df_clean = df[[target_col] + feature_cols].dropna()
        if len(df_clean) < 10:
            return jsonify({"status": "error", "message": "有效数据量太少"}), 400

        X, y = df_clean[feature_cols], df_clean[target_col]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)

        sample_size = min(50, len(X_test))
        X_show = X_test.iloc[:sample_size]
        y_show_real = y_test.iloc[:sample_size].values
        y_show_pred = model.predict(X_show)

        # ====== 🚀 核心算法优化：引入多维评估与惩罚机制 ======
        sample_r2 = r2_score(y_show_real, y_show_pred)
        std_pred = np.std(y_show_pred)
        std_real = np.std(y_show_real)

        # 1. 计算 Pearson 趋势相关系数 (看两条线的波动是否一致)
        if std_pred == 0 or std_real == 0:
            corr = 0
        else:
            corr = np.corrcoef(y_show_real, y_show_pred)[0, 1]

        # 2. 计算基础数值准确度
        mape = np.mean(np.abs((y_show_real - y_show_pred) / (y_show_real + 1e-9)))
        acc = max(0, 1 - mape)

        # 3. 终极审判逻辑：如果模型退化成直线(R2极低或无相关性)，进行残酷惩罚！
        if sample_r2 < 0.15 or corr < 0.3:
            # 触发惩罚：不管数值多接近，最高不能超过 45% 的置信度
            confidence = round(acc * 45, 2)
        else:
            # 正常表现：综合考虑准确率(40%)和波动趋势(60%)
            confidence = round((acc * 0.4 + corr * 0.6) * 100, 2)

        if confidence > 99: confidence = 98.75

        return jsonify({
            "status": "success",
            "data": {
                "confidence": confidence,
                "sampleSize": sample_size,
                "labels": [f"测试点 {i+1}" for i in range(sample_size)],
                "realValues": np.round(y_show_real, 2).tolist(),
                "predictedValues": np.round(y_show_pred, 2).tolist()
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500