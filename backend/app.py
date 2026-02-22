from flask import Flask
from flask_cors import CORS
from routes.upload_routes import upload_bp
from routes.process_routes import process_bp
from routes.analysis_routes import analysis_bp
import os

app = Flask(__name__)
CORS(app) # 彻底解决你看到的跨域问题

# 确保文件夹存在
if not os.path.exists('uploads'):
    os.makedirs('uploads')

# 注册蓝图
app.register_blueprint(upload_bp)
app.register_blueprint(process_bp)
app.register_blueprint(analysis_bp)

if __name__ == '__main__':
    app.run(debug=True, port=5000)