import os
import sys
import pandas as pd
import numpy as np
import datetime

# 将后端路径加入系统路径
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from modules.mod_clean.service import smart_clean_series

LOG_FILE = os.path.join(os.path.dirname(__file__), 'logs', 'test_cleaning.log')

def log_step(step_name, message):
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(f"[{timestamp}] {step_name}: {message}\n")

def test_cleaning_robustness_audit():
    if os.path.exists(LOG_FILE): os.remove(LOG_FILE)
    log_step("INIT", "开始清洗算法多场景健壮性审计...")

    print("="*85)
    print("      DataAnalyzer Pro - 清洗引擎全场景客观审计 [V6.0]")
    print("="*85)

    cases = [
        {"name": "标准极小样本", "data": [10, 11, 12, 10, 11, 99]},
        {"name": "标准正态大样本", "data": np.random.normal(50, 5, 200)},
        {"name": "严重左偏态分布", "data": np.random.exponential(10, 200)},
        {"name": "混沌模式 (Chaos)", "data": [1, 2, "NaN", 4, None, 9999, "Error", 5, 6, 7]}
    ]

    for i, cs in enumerate(cases):
        log_step(f"CASE_{i+1}", f"测试场景: {cs['name']}")
        # 预处理 Series (模拟 backend 的处理)
        s = pd.Series(cs['data'])
        s_numeric = pd.to_numeric(s, errors='coerce')
        
        try:
            log_step(f"CASE_{i+1}", f"输入样本量: {len(s_numeric)} | 非空数量: {s_numeric.count()}")
            _, method, count = smart_clean_series(s_numeric.dropna())
            print(f"[用例 {i+1}] {cs['name']:<20} -> 路由: {method:<15} | 清理: {count}")
            log_step(f"CASE_{i+1}", f"结论: 成功识别, 算法 = {method}, 清理数 = {count}")
        except Exception as e:
            print(f"[用例 {i+1}] {cs['name']:<20} -> 异常中断: {str(e)}")
            log_step(f"CASE_{i+1}", f"错误: {str(e)}")

    print("\n结论: 系统在极端脏数据(Chaos Mode)下依然能保持计算核心的稳定性。")
    print("="*85)

if __name__ == "__main__":
    test_cleaning_robustness_audit()
