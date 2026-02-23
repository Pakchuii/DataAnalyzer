import os
from flask import Flask
from flask_cors import CORS

# 导入功能模块蓝图
from routes.upload_routes import upload_bp
from routes.process_routes import process_bp
from routes.analysis_routes import analysis_bp

app = Flask(__name__)

# [Pro哥点评: 难点解决]
# CORS(app) 是前后端分离开发的救星，它彻底解决了浏览器恶心的“跨域拦截”问题。
CORS(app)

# [Pro哥点评: 防御性编程]
# 确保文件上传目录存在，防止系统第一次启动时因为找不到文件夹而直接崩溃。
if not os.path.exists('uploads'):
    os.makedirs('uploads')

# 注册蓝图 (将具体业务逻辑挂载到主程序)
app.register_blueprint(upload_bp)
app.register_blueprint(process_bp)
app.register_blueprint(analysis_bp)

if __name__ == '__main__':
    # 这里的 debug=True 在打包成 exe 时必须改成 False，否则会导致多进程疯狂重启！
    app.run(debug=True, port=5000)