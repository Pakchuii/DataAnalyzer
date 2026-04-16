import webview
import time
import socket
import sys
import os
import subprocess
import ctypes
from PIL import Image

# ==================================================
# 🎨 BRANDING CONFIGURATION
# ==================================================
APP_NAME = "DataAnalyzer Pro" 
APP_ICON = "temp_app_icon.ico" 

# Windows API Constants
WM_SETICON = 0x80
ICON_SMALL = 0
ICON_BIG = 1
IMAGE_ICON = 1
LR_LOADFROMFILE = 0x00000010
# ==================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
BACKEND_DIR = os.path.join(BASE_DIR, "backend")

# Global process tracker
subprocesses = []

def apply_icon_hack():
    """ 
    Deep-level Windows API Injection:
    Forces the taskbar to refresh the icon for the current window handle.
    """
    try:
        # 1. Identity declaration
        myappid = 'com.dataanalyzer.pro.v13.native'
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
        
        # 2. Wait for the window to actually register in Windows Shell
        time.sleep(2) 
        
        user32 = ctypes.windll.user32
        # Find window by its exact Title
        hwnd = user32.FindWindowW(None, APP_NAME)
        
        if hwnd:
            icon_path = os.path.abspath(os.path.join(BASE_DIR, APP_ICON))
            if os.path.exists(icon_path):
                # Load Icon Handles
                hicon_big = user32.LoadImageW(None, icon_path, IMAGE_ICON, 32, 32, LR_LOADFROMFILE)
                hicon_small = user32.LoadImageW(None, icon_path, IMAGE_ICON, 16, 16, LR_LOADFROMFILE)
                
                # Send WM_SETICON messages
                user32.SendMessageW(hwnd, WM_SETICON, ICON_BIG, hicon_big)
                user32.SendMessageW(hwnd, WM_SETICON, ICON_SMALL, hicon_small)
                print(f"[*] Native Hack: WM_SETICON broadcasted to HWND {hwnd}")
        else:
            print("[!] Native Hack: Could not locate Window HWND via title.")
    except Exception as e:
        print(f"[!] Native Hack Failed: {e}")

def start_services():
    """ Launch quiet background services. """
    print("==================================================")
    print(f" [*] System Core: Booting components...")
    print("==================================================")
    try:
        # Launching with direct stdout to the main terminal
        p_flask = subprocess.Popen(["python", "app.py"], cwd=BACKEND_DIR)
        subprocesses.append(p_flask)
        p_vite = subprocess.Popen("npm run dev", cwd=FRONTEND_DIR, shell=True)
        subprocesses.append(p_vite)
    except Exception as e:
        print(f"❌ Initialization Error: {e}"); cleanup(); sys.exit(1)

def cleanup():
    print("\n[*] Synchronizing shutdown. Cleaning up all subprocesses...")
    for p in subprocesses:
        try:
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(p.pid)], 
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except: pass
    print("[OK] Infrastructure released.")

def check_port(host, port):
    try:
        with socket.create_connection((host, port), timeout=1): return True
    except: return False

def launch_window():
    start_services()
    
    hosts = ['localhost', '127.0.0.1']
    port = 5173
    
    max_retries = 40
    retry_count = 0
    target_host = None
    while retry_count < max_retries:
        for host in hosts:
            if check_port(host, port): target_host = host; break
        if target_host: break
        retry_count += 1
        time.sleep(1.5)
            
    if not target_host:
        print("❌ CRITICAL: Handshake timeout."); cleanup(); sys.exit(1)
            
    try:
        print(f"\n[*] GUI Tunnel established. Applying branding layers...")
        
        window = webview.create_window(
            APP_NAME, 
            url=f'http://{target_host}:{port}', 
            width=1440, 
            height=900
        )
        
        # Start the UI loop and run our icon hack as a background function
        webview.start(func=apply_icon_hack, icon=os.path.abspath(os.path.join(BASE_DIR, APP_ICON)))
        
        # Shutdown logic once window is closed
        cleanup()
    except Exception as e:
        print(f"❌ GUI ERROR: {str(e)}"); cleanup()

if __name__ == '__main__':
    launch_window()
