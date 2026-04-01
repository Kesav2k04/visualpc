@echo off
REM =====================================================
REM VisualPC — Backend Start Script (Windows)
REM Checks port 8500 before starting uvicorn
REM =====================================================

set PORT=8500

echo [start-backend] Checking port %PORT%...
netstat -aon | findstr ":%PORT% " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo.
    echo [WARNING] Port %PORT% is already in use!
    echo.
    echo   To find the process:
    echo     netstat -aon ^| findstr ":%PORT%"
    echo.
    echo   To kill it (replace PID with actual PID^):
    echo     taskkill /PID ^<PID^> /F
    echo.
    set /p CONTINUE="Continue anyway? (y/n): "
    if /i not "%CONTINUE%"=="y" exit /b 1
)

echo [start-backend] Starting uvicorn on port %PORT%...
cd /d "%~dp0.."
python -m uvicorn backend.metrics_api:app --host 0.0.0.0 --port %PORT% --reload
