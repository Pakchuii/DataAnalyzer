# utils.py
import pandas as pd


def read_df(filepath):
    """
    【核心工具库：高容错数据读取引擎】
    针对复杂环境下的多编码格式文件提供自动降级解析策略。

    :param filepath: 目标文件的绝对物理路径
    :return: pandas.DataFrame 数据框实例
    """
    ext = filepath.rsplit('.', 1)[1].lower()

    if ext == 'csv':
        try:
            # 优先尝试国际标准的 UTF-8 编码进行解析
            return pd.read_csv(filepath, encoding='utf-8')
        except UnicodeDecodeError:
            # 【容错降级机制】：若触发解码异常，自动回退至中文 Windows 环境常见的 GBK 编码进行二次解析
            return pd.read_csv(filepath, encoding='gbk')
    else:
        # 根据 Excel 文件的后缀版本，智能路由至底层的开放解析引擎 (openpyxl / xlrd)
        return pd.read_excel(filepath, engine='openpyxl' if ext == 'xlsx' else 'xlrd')