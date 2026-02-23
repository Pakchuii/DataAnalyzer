# routes/analysis_routes.py
from flask import Blueprint

# 导入后面四大微服务车间的“工人”
from services.service_stats import do_descriptive, do_advanced, do_ttest
from services.service_visualize import do_get_options, do_distribution, do_categorical, do_radar
from services.service_ml import do_summary, do_predict
from services.service_security import do_mask

analysis_bp = Blueprint('analysis', __name__)

# ==========================================
# 模块一：基础统计与分布可视化
# ==========================================
@analysis_bp.route('/api/analyze/descriptive', methods=['POST'])
def descriptive_analysis(): 
    return do_descriptive()

@analysis_bp.route('/api/visualize/distribution', methods=['POST'])
def visualize_distribution(): 
    return do_distribution()

@analysis_bp.route('/api/visualize/categorical', methods=['POST'])
def visualize_categorical(): 
    return do_categorical()

# ==========================================
# 模块二：高阶分析（相关性、t检验、雷达图）
# ==========================================
@analysis_bp.route('/api/get_options', methods=['POST'])
def get_options(): 
    return do_get_options()

@analysis_bp.route('/api/analyze/advanced', methods=['POST'])
def advanced_analysis(): 
    return do_advanced()

@analysis_bp.route('/api/analyze/ttest', methods=['POST'])
def ttest_analysis(): 
    return do_ttest()

@analysis_bp.route('/api/visualize/radar', methods=['POST'])
def visualize_radar(): 
    return do_radar()

# ==========================================
# 模块三：智能化与机器学习算法
# ==========================================
@analysis_bp.route('/api/analyze/summary', methods=['POST'])
def generate_summary(): 
    return do_summary()

@analysis_bp.route('/api/predict', methods=['POST'])
def predict_data(): 
    return do_predict()

# ==========================================
# 模块四：企业级安全协议
# ==========================================
@analysis_bp.route('/api/mask', methods=['POST'])
def mask_data(): 
    return do_mask()