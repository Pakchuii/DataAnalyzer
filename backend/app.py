import os
from flask import Flask
from flask_cors import CORS

# 导入功能模块蓝图 (Blueprints)，体现面向模块化(Modularity)的设计思想
from routes.upload_routes import upload_bp
from routes.process_routes import process_bp
from routes.analysis_routes import analysis_bp

app = Flask(__name__)

# 【架构设计：解决跨域资源共享问题】
# 启用 CORS (Cross-Origin Resource Sharing) 策略，允许前端 (如 Vue) 跨域调用后端 API，实现前后端彻底分离
CORS(app)

# 【防御性编程：物理目录初始化】
# 确保文件挂载的物理目录存在，防止系统首次冷启动时因 I/O 路径缺失导致崩溃
if not os.path.exists('uploads'):
    os.makedirs('uploads')

# 【路由分发：基于 MVC 模式的控制器注册】
# 将具体的业务逻辑解耦并挂载到主程序实例，降低系统耦合度，提升可维护性
app.register_blueprint(upload_bp)
app.register_blueprint(process_bp)
app.register_blueprint(analysis_bp)

if __name__ == '__main__':
    # 启动 Flask WSGI 服务器
    # 注：生产环境部署或打包成执行文件时，需将 debug 设为 False，以防止多进程冲突与性能开销
    app.run(debug=True, port=5000)