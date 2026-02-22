import pandas as pd
import numpy as np
import random

# 🎯 在这里修改你要挑战的数据量！默认 10,000 行
NUM_ROWS = 10000

print(f"🚀 正在为您生成 {NUM_ROWS} 行极限测试数据，请稍候...")

# 1. 基础信息生成
genders = np.random.choice(['男', '女'], size=NUM_ROWS, p=[0.55, 0.45])
colleges = np.random.choice(['计算机学院', '商学院', '机电学院', '文法学院', '理学院'], size=NUM_ROWS)

# 2. 模拟真实成绩（正态分布）
# 高等数学：平均70分，标准差15
math_scores = np.random.normal(loc=70, scale=15, size=NUM_ROWS)
# 大学英语：平均75分，标准差12
english_scores = np.random.normal(loc=75, scale=12, size=NUM_ROWS)

# 3. 制造相关性（让你的散点图和热力图有看点！）
# Python成绩与数学成绩强相关 (加点随机噪点)
python_scores = math_scores * 0.8 + np.random.normal(loc=20, scale=5, size=NUM_ROWS)
# 体育成绩与性别相关 (男生平均分略高一些)
sports_scores = np.where(genders == '男',
                         np.random.normal(loc=80, scale=8, size=NUM_ROWS),
                         np.random.normal(loc=72, scale=8, size=NUM_ROWS))

# 4. 组装成 DataFrame
df = pd.DataFrame({
    '学号': [f"STU{20240000 + i}" for i in range(NUM_ROWS)],
    '性别': genders,
    '所属学院': colleges,
    '高等数学': math_scores.round(1),
    '大学英语': english_scores.round(1),
    'Python程序设计': python_scores.round(1),
    '体育测试': sports_scores.round(1)
})

# 5. 极端值控制（把成绩限制在 0-100 之间）
for col in ['高等数学', '大学英语', 'Python程序设计', '体育测试']:
    df[col] = df[col].clip(0, 100)

# 6. 导出为 CSV
file_name = "10000行_极限压测数据.csv"
df.to_csv(file_name, index=False, encoding='utf-8-sig')

print(f"🎉 搞定！已成功生成文件：{file_name}")
print(f"快去把这个拥有 {NUM_ROWS} 行数据的巨无霸喂给你的大屏系统吧！")