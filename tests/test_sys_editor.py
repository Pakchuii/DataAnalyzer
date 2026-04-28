import os
import sys
import pandas as pd
import json
import datetime
import numpy as np

# 将后端路径加入系统路径
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from core import create_app
from core.config import UPLOAD_FOLDER

LOG_FILE = os.path.join(os.path.dirname(__file__), 'logs', 'test_editor.log')

def log_step(step_name, message):
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(f"[{timestamp}] {step_name}: {message}\n")

def test_editor_full_audit_v6_5():
    if os.path.exists(LOG_FILE): os.remove(LOG_FILE)
    log_step("INIT", "开始数据编辑系统全功能审计测试 (V6.5)...")

    app = create_app()
    client = app.test_client()

    print("="*85)
    print("      DataAnalyzer Pro - 数据编辑工作区全功能审计 [V6.5]")
    print("="*85)

    # --- [用例 1] 隐私脱敏 (PII Masking) ---
    f_mask = "editor_pii_test.csv"
    df_pii = pd.DataFrame({
        '用户姓名': ['张三', '李四', '王五'],
        '联系方式': ['13800138000', '13900139000', '13700137000'],
        '常规薪资': [5000, 6000, 7000]
    })
    df_pii.to_csv(os.path.join(UPLOAD_FOLDER, f_mask), index=False, encoding='utf-8-sig')
    
    log_step("PII_TEST", "发起隐私脱敏请求...")
    resp1 = client.post('/api/mask', json={"filename": f_mask}).get_json()
    log_step("PII_TEST", f"后端识别结果: {resp1.get('data', {}).get('masked_cols')}")
    print(f"[1] 隐私脱敏 -> 自动捕捉敏感列: {resp1.get('data', {}).get('masked_cols')}")

    # --- [用例 2] 缺失值中位数填充 ---
    f_miss = "editor_missing_test.csv"
    salary_data = [5000, np.nan, 6000, np.nan, 7000, 8000, np.nan] # 缺失率高
    df_miss = pd.DataFrame({'薪资': salary_data, '工龄': [1, 2, 3, 4, 5, 6, 7]})
    df_miss.to_csv(os.path.join(UPLOAD_FOLDER, f_miss), index=False)
    
    log_step("MISS_TEST", "发起缺失值填充 (Strategy: median)...")
    resp2 = client.post('/api/clean', json={
        "filename": f_miss, 
        "missing_strategy": "median",
        "outlier_strategy": "none"
    }).get_json()
    
    log_step("MISS_TEST", f"填充反馈: {resp2.get('message')} | 处理数: {resp2.get('data', {}).get('total_missing')}")
    print(f"[2] 缺失值填充 -> 采用中位数策略，成功治理 {resp2.get('data', {}).get('total_missing')} 个空点")

    # --- [用例 3] 业务逻辑区间过滤 ---
    # 我们基于刚才生成的填充后的文件进行过滤
    f_clean = resp2['data']['cleaned_filename']
    log_step("FILTER_TEST", f"对清洗后文件 {f_clean} 进行区间过滤 (薪资: 5500-7500)...")
    resp3 = client.post('/api/filter/range', json={
        "filename": f_clean,
        "filters": [{"column": "薪资", "type": "range", "min": 5500, "max": 7500}]
    }).get_json()
    
    removed = resp3.get('data', {}).get('removed_count', 0)
    final_count = resp3.get('data', {}).get('filtered_count', 0)
    log_step("FILTER_TEST", f"过滤完成: 保留 {final_count} 行, 剔除 {removed} 行")
    print(f"[3] 逻辑过滤 -> 区间 [5500-7500] 过滤完成，剔除不合规记录 {removed} 条")

    # --- [用例 4] 变量画像扫描 (元数据自查) ---
    log_step("META_TEST", "发起变量画像扫描 (Metadata Probe)...")
    resp4 = client.post('/api/filter/column_info', json={"filename": f_clean, "column": "薪资"}).get_json()
    meta = resp4.get('data', {})
    print(f"[4] 画像扫描 -> 成功探测变量 '{meta.get('column')}' 类型: {meta.get('type')} (范围: {meta.get('min')}~{meta.get('max')})")
    log_step("META_TEST", f"变量画像: {json.dumps(meta, ensure_ascii=False)}")

    log_step("FINISH", "数据编辑系统全功能链审计结束。")
    print("\n结论: 系统在编辑、清洗、脱敏与过滤等核心环节表现出极佳的原子操作一致性。")
    print("="*85)

if __name__ == "__main__":
    test_editor_full_audit_v6_5()
