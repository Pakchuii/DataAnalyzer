import pandas as pd
import numpy as np
import os
import random

def generate_hr_dataset(folder):
    np.random.seed(42)
    n = 200
    names = [f"员工_{i}" for i in range(1, n+1)]
    # Generate some real-looking names for testing privacy mask
    real_names = ["张伟", "王芳", "李娜", "赵强", "钱多多", "孙悟空", "陈大文", "林平之", "毛小旭", "马化飞"]
    for i, rn in enumerate(real_names):
        names[i] = rn
        
    phones = [f"138{str(np.random.randint(10000000, 99999999))}" for _ in range(n)]
    depts = np.random.choice(['研发部', '销售部', '市场部', 'HR部'], size=n, p=[0.4, 0.3, 0.2, 0.1])
    
    base_salary = np.random.normal(8000, 1500, n).round()
    attendance = np.random.randint(15, 23, n)
    overtime = np.random.exponential(10, n).round(1) # Skewed data
    training = np.random.normal(20, 5, n).round()
    
    # Introduce outliers for 3sigma / IQR testing
    overtime[5] = 120.0 # Clear outlier
    training[10] = -50.0 # Error data
    
    # Target variable (with logical relation)
    # Sales department gets more score based on overtime, R&D based on training
    performance = base_salary * 0.001 + overtime * 0.5 + training * 1.2 + np.random.normal(0, 5, n)
    performance = np.clip(performance, 0, 100).round(1)
    
    df = pd.DataFrame({
        '姓名': names,
        '手机': phones,
        '部门': depts,
        '基础薪资': base_salary,
        '出勤天数': attendance,
        '加班时长': overtime,
        '培训时长': training,
        '绩效得分': performance
    })
    
    df.to_csv(os.path.join(folder, "1_企业员工薪资与绩效数据(200条).csv"), index=False, encoding='utf-8-sig')

def generate_medical_dataset(folder):
    # N < 30 to test Dixon's Q and Bootstrap T-test
    np.random.seed(42)
    n = 25
    patient_id = [f"PT-{str(i).zfill(3)}" for i in range(1, n+1)]
    group = np.random.choice(['对照组', '实验组'], size=n)
    
    blood_sugar = np.random.normal(5.5, 0.5, n).round(2)
    blood_pressure_high = np.random.normal(120, 10, n).round()
    med_dose = np.random.normal(10, 2, n).round(1)
    
    # Outlier for Dixon's Q test
    blood_sugar[12] = 25.8 
    
    # Recovery score
    recovery = blood_sugar * -2 + med_dose * 3 + np.random.normal(0, 3, n)
    recovery = np.clip(recovery, 0, 100).round(1)
    
    df = pd.DataFrame({
        '患者病历号': patient_id,
        '用药分组': group,
        '空腹血糖值': blood_sugar,
        '收缩压': blood_pressure_high,
        '用药剂量_mg': med_dose,
        '康复评分': recovery
    })
    
    df.to_csv(os.path.join(folder, "2_小样本医疗诊断与康复数据(25条).csv"), index=False, encoding='utf-8-sig')

def generate_sales_dataset(folder):
    # Test random forest prediction and importance
    np.random.seed(42)
    n = 500
    user_id = [f"UID-{str(i).zfill(4)}" for i in range(1, n+1)]
    age = np.random.poisson(35, n)
    history_cost = np.random.lognormal(mean=7, sigma=1, size=n).round(2) # Highly skewed
    interaction = np.random.randint(0, 50, n)
    active_days = np.random.randint(1, 30, n)
    
    # Inject outliers
    history_cost[45] = 999999.0
    
    churn_risk = (age * 0.1) - (interaction * 0.5) - (active_days * 1.5) + np.random.normal(0, 10, n)
    # scale to 0-100
    churn_risk = (churn_risk - churn_risk.min()) / (churn_risk.max() - churn_risk.min()) * 100
    churn_risk = churn_risk.round(2)
    
    df = pd.DataFrame({
        '客户编号': user_id,
        '客户年龄': age,
        '历史总消费': history_cost,
        '售后互动次数': interaction,
        '近一月活跃天': active_days,
        '流失风险指数': churn_risk
    })
    
    df.to_csv(os.path.join(folder, "3_客户销售行为与流失预警分析数据(500条).csv"), index=False, encoding='utf-8-sig')


if __name__ == "__main__":
    folder = "答辩演示测试数据集"
    if not os.path.exists(folder):
        os.makedirs(folder)
        
    generate_hr_dataset(folder)
    generate_medical_dataset(folder)
    generate_sales_dataset(folder)
    print("Datasets generated successfully!")
