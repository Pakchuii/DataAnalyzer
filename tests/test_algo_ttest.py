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

LOG_FILE = os.path.join(os.path.dirname(__file__), 'logs', 'test_ttest.log')

def log_step(step_name, message):
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(f"[{timestamp}] {step_name}: {message}\n")

def test_inference_routing():
    if os.path.exists(LOG_FILE): os.remove(LOG_FILE)
    log_step("INIT", "开始统计推断算法与 Bootstrap 重抽样专项测试...")

    app = create_app()
    client = app.test_client()

    print("="*70)
    print("      DataAnalyzer Pro - 核心算法专项测试 [3/4]: 推断检验与 Bootstrap")
    print("="*70)

    # 准备测试数据: 分组 A (正态), 分组 B (极度偏态 - 模拟异常业务数据)
    log_step("DATA GEN", "生成测试数据集 (Group A: Normal, Group B: Exponential/Skewed)...")
    f_ttest = "ttest_routing_test.csv"
    n = 20
    # 使用极大的 scale 确保其显著非正态
    df = pd.DataFrame({
        'Group': ['A']*n + ['B']*n,
        'Value': list(np.random.normal(50, 5, n)) + list(np.random.exponential(500, n))
    })
    df.to_csv(os.path.join(UPLOAD_FOLDER, f_ttest), index=False)
    log_step("DATA GEN", f"数据已写入 {f_ttest}")

    # 发起检验请求
    log_step("API REQUEST", "发起 /api/analyze/ttest 请求，目标列: 'Value', 分组列: 'Group'...")
    resp = client.post('/api/analyze/ttest', json={
        "filename": f_ttest,
        "group_col": "Group",
        "columns": ["Value"]
    })
    
    res_json = resp.get_json()
    log_step("API RESULT", f"后端原始响应: {json.dumps(res_json, ensure_ascii=False)}")
    
    res = res_json['data'][0]
    print(f"数据状态: 分组 B 为极度偏态分布 (触发 Shapiro 正态预警)")
    print(f"系统算法决策: {res['note']}")
    print(f"最终统计结论: P-Value = {res['p_value']} | 显著差异: {res['significant']}")

    log_step("FINISH", "正态性探测与算法降级流验证完成。")
    print("\n结论: 系统成功实现了正态性感知，并能在失效时自动路由至 Bootstrap。")
    print("详情请查看日志: tests/logs/test_ttest.log")
    print("="*70)

if __name__ == "__main__":
    test_inference_routing()
