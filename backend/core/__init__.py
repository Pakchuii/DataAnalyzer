"""
【核心工厂】：Flask 应用工厂 + 模块自动发现注册引擎
"""
import os
import importlib
from flask import Flask
from flask_cors import CORS


def create_app():
    """
    基于工厂模式 (Factory Pattern) 创建 Flask 应用实例。
    自动扫描 modules/ 目录，发现并注册所有功能模块的 Blueprint。
    """
    app = Flask(__name__)
    CORS(app)

    # 确保文件挂载的物理目录存在
    from core.config import UPLOAD_FOLDER
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(UPLOAD_FOLDER), 'outputs'), exist_ok=True)

    # ========== 模块自动发现与注册 ==========
    modules_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'modules')
    if os.path.isdir(modules_dir):
        for name in sorted(os.listdir(modules_dir)):
            mod_path = os.path.join(modules_dir, name)
            if os.path.isdir(mod_path) and name.startswith('mod_'):
                try:
                    module = importlib.import_module(f'modules.{name}')
                    if hasattr(module, 'bp'):
                        app.register_blueprint(module.bp)
                        print(f'  [OK] Module loaded: {name}')
                except Exception as e:
                    print(f'  [FAIL] Module {name}: {e}')

    return app
