@echo off
setlocal
cd /d "%~dp0"
title DataAnalyzer Pro Bootloader

:: --------------------------------------------------
:: [ENV INJECTION] Safe and Standard
:: --------------------------------------------------
set "PR_ROOT=%~dp0"
set "PATH=%PR_ROOT%python;%PR_ROOT%node;%PATH%"
set "PYTHONPATH=%PR_ROOT%backend;%PR_ROOT%backend\core;%PYTHONPATH%"

:: --------------------------------------------------
:: [INTERFACE] Pure English to Prevent Garble
:: --------------------------------------------------
cls
echo ==================================================
echo   DataAnalyzer Pro: Portable Launcher (V15)
echo ==================================================
echo.
echo Select Launcher Mode:
echo [1] Browser Mode
echo [2] Desktop Mode
echo.

set "choice="
set /p "choice=Enter Selection: "

if "%choice%"=="1" goto MODE_1
if "%choice%"=="2" goto MODE_2

echo [!] Error: Invalid selection.
timeout /t 3 >nul
exit

:MODE_2
echo.
echo [*] Launching Desktop GUI...
python desktop_app.py
exit

:MODE_1
echo.
echo [1/3] Starting Backend (Python)...
start "DA-Backend" /min cmd /c "set "PYTHONPATH=%PYTHONPATH%" && cd /d "%PR_ROOT%backend" && python app.py"

echo [2/3] Starting Frontend (Node/Vite)...
if exist "%PR_ROOT%node\node.exe" (
    start "DA-Frontend" /min cmd /c "cd /d "%PR_ROOT%frontend" && "%PR_ROOT%node\node.exe" "%PR_ROOT%node\node_modules\npm\bin\npm-cli.js" run dev"
) else (
    start "DA-Frontend" /min cmd /c "cd /d "%PR_ROOT%frontend" && npm run dev"
)

echo [3/3] Waiting for environment...
timeout /t 5 >nul
start http://localhost:5173
exit
