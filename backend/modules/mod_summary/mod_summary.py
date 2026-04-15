import os
import pandas as pd
from flask import Blueprint, request, jsonify
from core.config import UPLOAD_FOLDER
from core.utils import read_df

bp = Blueprint('summary', __name__)


@bp.route('/api/analyze/summary', methods=['POST'])
def generate_summary():
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
            quality_desc = f'⚠️ **数据质量评估**：规模极小（仅包含 {row_count} 条记录）。在此数据量下极易出现严重的"过拟合"，建议您使用基础「描述统计」。'
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
                        skew_insights.append(f'【{col}】存在严重的"右偏"断档')
                    elif skew_val < -1.5:
                        skew_insights.append(f'【{col}】存在严重的"左偏"断档')
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
