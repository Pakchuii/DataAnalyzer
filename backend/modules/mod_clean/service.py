import pandas as pd


def smart_clean_series(s):
    """
    【三阶自适应智能清洗引擎】: 自动路由 Dixon's Q, 3σ 准则 与 IQR 箱线图
    """
    s_valid = s.dropna()
    n = len(s_valid)

    if n < 3:
        return s, "样本极小(跳过)", 0

    if n < 30:
        # 第一阶：小样本防御机制 - Dixon's Q 检验
        q95 = {3: 0.941, 4: 0.765, 5: 0.642, 6: 0.560, 7: 0.507, 8: 0.468,
               9: 0.437, 10: 0.412, 11: 0.392, 12: 0.376, 13: 0.361, 14: 0.349,
               15: 0.338, 16: 0.329, 17: 0.320, 18: 0.313, 19: 0.306, 20: 0.300,
               21: 0.295, 22: 0.290, 23: 0.285, 24: 0.281, 25: 0.277, 26: 0.273,
               27: 0.269, 28: 0.266, 29: 0.263, 30: 0.260}
        q_crit = q95.get(n, 0.260)
        s_sorted = s_valid.sort_values().values
        s_clean = s.copy()
        outliers_count = 0

        range_all = s_sorted[-1] - s_sorted[0]
        if range_all > 0:
            if (s_sorted[1] - s_sorted[0]) / range_all > q_crit:
                s_clean = s_clean.replace(s_sorted[0], s_sorted[1])
                outliers_count += 1
            s_sorted_new = s_clean.dropna().sort_values().values
            range_new = s_sorted_new[-1] - s_sorted_new[0]
            if range_new > 0 and (s_sorted_new[-1] - s_sorted_new[-2]) / range_new > q_crit:
                s_clean = s_clean.replace(s_sorted_new[-1], s_sorted_new[-2])
                outliers_count += 1

        return s_clean, "Dixon's Q检验 (N<30)", outliers_count

    else:
        # 大样本 (N >= 30)：引入形态探针 (Skewness 偏度) 进行高阶动态路由
        skewness = s_valid.skew()

        # 偏度绝对值 <= 1.0 通常被认为数据形态相对对称/近似正态
        if pd.notna(skewness) and abs(skewness) <= 1.0:
            # 第二阶：近似正态分布 - 3σ 准则 (数学效率最高)
            mean_val = s_valid.mean()
            std_val = s_valid.std()
            if pd.isna(std_val) or std_val == 0:
                return s, "3σ边界拦截 (标准差异常)", 0

            lower_bound = mean_val - 3 * std_val
            upper_bound = mean_val + 3 * std_val

            outliers_count = int(((s_valid < lower_bound) | (s_valid > upper_bound)).sum())
            s_clean = s.clip(lower=lower_bound, upper=upper_bound)
            return s_clean, "3σ边界拦截 (N>=30, 呈近似正态)", outliers_count

        else:
            # 第三阶：严重偏态分布 - IQR 箱线图法 (非参数模型，极度稳健抗偏态)
            Q1 = s_valid.quantile(0.25)
            Q3 = s_valid.quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR

            outliers_count = int(((s_valid < lower_bound) | (s_valid > upper_bound)).sum())
            s_clean = s.clip(lower=lower_bound, upper=upper_bound)
            return s_clean, "IQR箱线图法 (N>=30, 呈偏态分布)", outliers_count
