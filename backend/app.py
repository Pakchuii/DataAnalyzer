"""
DataAnalyzer Pro — 模块化微服务入口
启动方式: python app.py
"""
from core import create_app

app = create_app()

if __name__ == '__main__':
    # 启动 Flask WSGI 服务器
    # 注：生产环境部署或打包成执行文件时，需将 debug 设为 False，以防止多进程冲突与性能开销
    app.run(debug=True, port=5000)