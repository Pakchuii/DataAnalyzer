@echo off
setlocal
cd /d "%~dp0"
title DataAnalyzer Pro Bootloader

:: --------------------------------------------------
:: PURE ASCII VERSION (V10 SEAMLESS INTEGRATION)
:: --------------------------------------------------

echo ==================================================
echo   DataAnalyzer Pro: System Starter
echo ==================================================
echo.
echo Select Mode:
echo [1] Browser Mode (Debugging)
echo [2] Desktop Mode (Seamless Experience)
echo.
set /p choice="Selection [1-2]: "

if "%choice%"=="2" (
    echo.
    echo [*] Initializing Master Controller...
    echo [*] Launching Desktop View...
    echo.
    :: V10 Engine: All background services managed by python
    python desktop_app.py
) else (
    echo.
    echo [1/3] Backend starting...
    start /min "DA-Backend" cmd /c "cd backend && python app.py"
    echo [2/3] Frontend starting...
    start /min "DA-Frontend" cmd /c "cd frontend && npm run dev"
    echo [3/3] Waiting for environment...
    timeout /t 5 >nul
    start http://localhost:5173
)

echo.
echo ==================================================
echo [EXIT] Closing this terminal...
exit
