import os
from flask import Flask
from flask_cors import CORS
from config import UPLOAD_FOLDER

from routes.upload_routes import upload_bp
from routes.process_routes import process_bp
from routes.analysis_routes import analysis_bp

app = Flask(__name__)
# 彻底放开跨域限制
CORS(app, resources={r"/api/*": {"origins": "*"}})

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.register_blueprint(upload_bp)
app.register_blueprint(process_bp)
app.register_blueprint(analysis_bp)

if __name__ == '__main__':
    print("🚀 后端服务启动成功！纯净稳定版运行中...")
    app.run(debug=True, port=5000)