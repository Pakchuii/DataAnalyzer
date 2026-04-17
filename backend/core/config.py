import os

# 【核心配置：物理存储路径】
# 强制使用绝对路径以支持便携化分发环境
CORE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CORE_DIR)
UPLOAD_FOLDER = os.path.join(BACKEND_DIR, 'uploads')
OUTPUT_FOLDER = os.path.join(BACKEND_DIR, 'outputs')

# 【安全防御：文件类型白名单】
# 仅允许解析特定的电子表格格式，从入口处拦截恶意脚本 (如 .exe, .sh) 上传，防范任意文件上传漏洞
ALLOWED_EXTENSIONS = {'csv', 'xls', 'xlsx'}

def allowed_file(filename):
    """
    【安全校验机制】
    验证文件扩展名是否符合系统安全白名单。
    :param filename: 上传的原始文件名
    :return: bool 是否允许上传
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
