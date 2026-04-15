# routes/analysis_routes.py
from flask import Blueprint

# 【面向服务架构 (SOA) 设计】
# 将底层的算法“服务提供者 (Services)”引入，保持控制器 (Controller) 层的轻量化
from services.service_stats import do_descriptive, do_advanced, do_ttest
from services.service_visualize import do_get_options, do_distribution, do_categorical, do_radar
from services.service_ml import do_summary, do_predict, do_predict_new
from services.service_security import do_mask

# 注册数据分析相关的蓝图路由
analysis_bp = Blueprint('analysis', __name__)

# ==========================================
# 模块一：基础统计与分布可视化 API
# ==========================================
@analysis_bp.route('/api/analyze/descriptive', methods=['POST'])
def descriptive_analysis():
    """执行基础描述性统计（均值、方差、极值等）"""
    return do_descriptive()

@analysis_bp.route('/api/visualize/distribution', methods=['POST'])
def visualize_distribution():
    """提取数据分布特征（服务于前端直方图、箱线图）"""
    return do_distribution()

@analysis_bp.route('/api/visualize/categorical', methods=['POST'])
def visualize_categorical():
    """提取类别型数据频数特征（服务于饼图渲染）"""
    return do_categorical()

# ==========================================
# 模块二：高阶分析（相关性、t检验、雷达图） API
# ==========================================
@analysis_bp.route('/api/get_options', methods=['POST'])
def get_options():
    """获取指定特征列的唯一值清单"""
    return do_get_options()

@analysis_bp.route('/api/analyze/advanced', methods=['POST'])
def advanced_analysis():
    """执行高级关联分析（正态性检验、Pearson相关性矩阵）"""
    return do_advanced()

@analysis_bp.route('/api/analyze/ttest', methods=['POST'])
def ttest_analysis():
    """执行独立样本 t 检验 (Welch's t-test)"""
    return do_ttest()

@analysis_bp.route('/api/visualize/radar', methods=['POST'])
def visualize_radar():
    """提取个体多维特征向量（服务于雷达图多维对比）"""
    return do_radar()

# ==========================================
# 模块三：智能化与机器学习算法 API
# ==========================================
@analysis_bp.route('/api/analyze/summary', methods=['POST'])
def generate_summary():
    """执行数据质量宏观探测与 AI 靶点特征推荐"""
    return do_summary()

@analysis_bp.route('/api/predict', methods=['POST'])
def predict_data():
    """执行机器学习模型训练及特征重要性量化评估"""
    return do_predict()

@analysis_bp.route('/api/predict_new', methods=['POST'])
def predict_new_data():
    """执行未知数据推理预测，并基于惩罚机制生成专家级诊断报告"""
    return do_predict_new()

# ==========================================
# 模块四：企业级数据安全 API
# ==========================================
@analysis_bp.route('/api/mask', methods=['POST'])
def mask_data():
    """执行敏感特征脱敏与不可逆隐私遮蔽"""
    return do_mask()