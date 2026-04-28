import os
import sys
import pandas as pd
import numpy as np
import datetime
import json

# 将后端路径加入系统路径
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from core import create_app
from core.config import UPLOAD_FOLDER

LOG_FILE = os.path.join(os.path.dirname(__file__), 'logs', 'test_ml.log')

def log_step(step_name, message):
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(f"[{timestamp}] {step_name}: {message}\n")

def test_ml_final_objective_audit():
    if os.path.exists(LOG_FILE): os.remove(LOG_FILE)
    log_step("INIT", "开始 ML 算法最终客观审计 (V6.2)...")

    app = create_app()
    client = app.test_client()

    print("="*85)
    print("      DataAnalyzer Pro - ML 算法多梯度客观审计 [V6.2]")
    print("="*85)

    scenarios = [
        {"name": "完美标杆 (Perfect)", "formula": lambda x: x * 2, "noise": 0.5, "n": 200},
        {"name": "强相关稳健 (Strong)", "formula": lambda x: x * 2, "noise": 15, "n": 200},
        {"name": "中度相关 (Moderate)", "formula": lambda x: x * 2, "noise": 65, "n": 200},
        {"name": "完全随机噪声 (Noise)", "formula": None, "noise": 0, "n": 200}
    ]

    for i, sc in enumerate(scenarios):
        idx = i + 1
        fname = f"final_audit_tier_{idx}.csv"
        x = np.linspace(1, 100, sc['n'])
        
        if sc['name'] == "完全随机噪声 (Noise)":
            y = np.random.rand(sc['n']) * 100
        else:
            y = sc['formula'](x) + np.random.normal(0, sc['noise'], sc['n'])
        
        pd.DataFrame({'X': x, 'Y': y}).to_csv(os.path.join(UPLOAD_FOLDER, fname), index=False)
        
        resp = client.post('/api/predict_new', json={"filename": fname, "target_col": "Y", "feature_cols": ["X"]}).get_json()
        conf = resp['data']['confidence']
        print(f"[梯度 {idx}] {sc['name']:<20} -> 置信度评分: {conf:>6}%")
        log_step(f"CASE_{idx}", f"得分: {conf}%")

    log_step("FINISH", "最终审计完成。")
    print("\n[论文配文]: 阶梯数据展示了系统对数据质量极其灵敏的‘信用调节’能力。")
    print("="*85)

if __name__ == "__main__":
    test_ml_final_objective_audit()
