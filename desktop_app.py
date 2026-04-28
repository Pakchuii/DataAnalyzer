import webview
import time
import socket
import sys
import os
import subprocess
import ctypes
import threading

# ==================================================
# 🎨 BRANDING CONFIGURATION
# ==================================================
APP_NAME = "DataAnalyzer Pro" 
APP_ICON = "temp_app_icon.ico" 

class Api:
    def __init__(self):
        self._window = None

    def set_window(self, window):
        self._window = window

    def toggle_fullscreen(self):
        if self._window:
            self._window.toggle_fullscreen()

    def save_file(self, content, default_filename):
        """原生文件保存对话框（绕过 Webview 下载限制）"""
        if self._window:
            try:
                result = self._window.create_file_dialog(
                    webview.SAVE_DIALOG, 
                    directory='', 
                    save_filename=default_filename
                )
                if result and len(result) > 0:
                    with open(result[0], 'w', encoding='utf-8-sig') as f:
                        f.write(content)
                    return True
            except Exception as e:
                print(f"Save failed: {e}")
        return False

    def restart(self):
        """清理资源并重启程序（非阻塞模式）"""
        def _do_restart():
            try:
                # 1. 彻底清理后端和前端子进程
                cleanup()
                # 2. 启动一个新的主程序实例
                # 使用 sys.executable 和 sys.argv 确保环境一致
                subprocess.Popen([sys.executable] + sys.argv, shell=False)
                # 3. 强制退出当前进程
                os._exit(0)
            except Exception as e:
                print(f"Restart failed: {e}")

        # 在新线程中执行，防止阻塞 UI 响应
        threading.Thread(target=_do_restart, daemon=True).start()

api = Api()
# ==================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
BACKEND_DIR = os.path.join(BASE_DIR, "backend")

# Global process tracker
subprocesses = []

SPLASH_HTML = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            margin: 0;
            padding: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            font-family: 'Segoe UI', system-ui, sans-serif;
            color: white;
            overflow: hidden;
            -webkit-app-region: drag; /* Allow dragging from anywhere */
        }}
        .container {{
            text-align: center;
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            padding: 40px;
            border-radius: 24px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }}
        .logo {{
            width: 80px;
            height: 80px;
            margin-bottom: 20px;
            filter: drop-shadow(0 0 15px rgba(56, 189, 248, 0.5));
            animation: pulse 2s infinite ease-in-out;
        }}
        .title {{
            font-size: 24px;
            font-weight: 600;
            letter-spacing: 2px;
            margin-bottom: 8px;
            background: linear-gradient(to right, #38bdf8, #818cf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        .status {{
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            letter-spacing: 3px;
        }}
        .loader {{
            width: 40px;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            margin: 20px auto 0;
            border-radius: 2px;
            overflow: hidden;
            position: relative;
        }}
        .loader-bar {{
            width: 40%;
            height: 100%;
            background: #38bdf8;
            position: absolute;
            animation: loading 1.5s infinite ease-in-out;
        }}
        @keyframes pulse {{
            0%, 100% {{ transform: scale(1); opacity: 1; }}
            50% {{ transform: scale(1.05); opacity: 0.8; }}
        }}
        @keyframes loading {{
            0% {{ left: -40%; }}
            100% {{ left: 100%; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="title">{APP_NAME}</div>
        <div class="status" id="status">Initializing Infrastructure...</div>
        <div class="loader">
            <div class="loader-bar"></div>
        </div>
    </div>
</body>
</html>
"""

def register_app_id():
    try:
        myappid = 'com.dataanalyzer.pro.v15.native'
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
    except: pass

def apply_icon_hack(window):
    try:
        user32 = ctypes.windll.user32
        hwnd = None
        for _ in range(30):
            hwnd = user32.FindWindowW(None, APP_NAME)
            if hwnd: break
            time.sleep(0.1)
        
        if hwnd:
            icon_path = os.path.abspath(os.path.join(BASE_DIR, APP_ICON))
            if os.path.exists(icon_path):
                WM_SETICON = 0x80
                ICON_SMALL, ICON_BIG = 0, 1
                LR_LOADFROMFILE = 0x00000010
                IMAGE_ICON = 1
                hicon_big = user32.LoadImageW(None, icon_path, IMAGE_ICON, 32, 32, LR_LOADFROMFILE)
                hicon_small = user32.LoadImageW(None, icon_path, IMAGE_ICON, 16, 16, LR_LOADFROMFILE)
                user32.SendMessageW(hwnd, WM_SETICON, ICON_BIG, hicon_big)
                user32.SendMessageW(hwnd, WM_SETICON, ICON_SMALL, hicon_small)
    except: pass

def start_services():
    try:
        p_flask = subprocess.Popen(["python", "app.py"], cwd=BACKEND_DIR)
        subprocesses.append(p_flask)
        p_vite = subprocess.Popen("npm run dev", cwd=FRONTEND_DIR, shell=True)
        subprocesses.append(p_vite)
    except: pass

def cleanup():
    """强力清理所有子进程，包括按 PID 树和按端口号双重保险"""
    # 第一轮：按 PID 进程树强杀
    for p in subprocesses:
        try:
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(p.pid)], 
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except: pass

    # 第二轮：按端口号兜底清理（防止 shell=True 导致的孤儿进程）
    for port in [5000, 5173]:
        try:
            result = subprocess.run(
                f'netstat -ano | findstr :{port} | findstr LISTENING',
                shell=True, capture_output=True, text=True
            )
            for line in result.stdout.strip().split('\n'):
                parts = line.split()
                if parts:
                    pid = parts[-1]
                    if pid.isdigit():
                        subprocess.run(["taskkill", "/F", "/PID", pid],
                                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except: pass

def boot_sequence(splash_window):
    start_services()
    
    port = 5173
    target_host = None
    max_retries = 50 
    
    for _ in range(max_retries):
        try:
            with socket.create_connection(('localhost', port), timeout=0.5):
                target_host = 'localhost'
                break
        except: pass
        time.sleep(1)

    if target_host:
        # Create the MAIN window while splash is still visible
        main_url = f'http://{target_host}:{port}'
        
        # Hide splash and launch main
        main_window = webview.create_window(
            APP_NAME, 
            url=main_url, 
            width=1440, 
            height=900,
            js_api=api
        )
        api.set_window(main_window)
        
        # Destroy splash to hand over the loop
        splash_window.destroy()
        
        # Apply the icon hack to the NEW main window handle
        threading.Thread(target=apply_icon_hack, args=(main_window,), daemon=True).start()
    else:
        splash_window.destroy()
        sys.exit(1)

def launch_window():
    register_app_id()
    
    # [STEP 1] Launch the Frameless Splash
    splash = webview.create_window(
        "", # No title for splash to keep it clean
        html=SPLASH_HTML,
        width=500,
        height=300,
        frameless=True,
        transparent=True,
        on_top=True
    )
    
    # [STEP 2] Use the boot_sequence to handle the handover
    webview.start(boot_sequence, splash)
    
    # If the flow reaches here, it means we are in the main app
    # (Or the user closed the window)
    cleanup()

if __name__ == '__main__':
    launch_window()