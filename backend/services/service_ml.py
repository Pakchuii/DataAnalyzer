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

        for col in df.columns:
            try:
                df[col] = pd.to_numeric(df[col])
            except Exception:
                pass

        numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c]) and not any(
            kw in str(c).lower() for kw in ['号', 'id', '编号', '代码'])]
        insights = [f"✨ **数据概览**：当前数据集共包含 {len(df)} 条记录，成功识别出 {len(numeric_cols)} 个关键数值指标。"]

        if len(numeric_cols) > 0:
            std_series = df[numeric_cols].std()
            if not std_series.isna().all():
                insights.append(
                    f"📊 **波动洞察**：数据中【{std_series.idxmax()}】的离散程度最大，说明个体差异最显著；而【{std_series.idxmin()}】分布最为集中稳定。")

            if len(numeric_cols) >= 2:
                corr_df = df[numeric_cols].corr().abs()
                for i in range(len(corr_df.columns)): corr_df.iloc[i, i] = 0.0
                if not corr_df.isna().all().all():
                    max_corr = corr_df.max().max()
                    if pd.notna(max_corr) and max_corr > 0.5:
                        row_idx, col_idx = np.unravel_index(np.nanargmax(corr_df.to_numpy()), corr_df.shape)
                        insights.append(
                            f"🔗 **强关联发现**：系统检测到【{corr_df.index[row_idx]}】与【{corr_df.columns[col_idx]}】存在较强的线性相关性（r={round(max_corr, 2)}）。")

        insights.append("💡 **分析建议**：建议结合右侧的雷达图进行个体优势诊断，并利用 t 检验进一步探索不同群体间的差异。")
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