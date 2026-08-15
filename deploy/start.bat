@echo off
cd /d "%~dp0"

echo [1/3] Configuring nginx...
call "%~dp0setup-nginx.bat"
if errorlevel 1 pause & exit /b 1

echo [2/3] Starting backend...
cd /d "%~dp0package\backend"
call start-backend.bat
if errorlevel 1 (
  echo [ERROR] Backend failed to start. See package\backend\logs\backend.log
  pause
  exit /b 1
)

echo [3/3] Starting nginx...
cd /d "%~dp0tools\nginx"
nginx.exe -s stop 2>nul
nginx.exe -t
if errorlevel 1 (
  echo Nginx config test failed. Check tools\nginx\conf\
  pause
  exit /b 1
)
start "" nginx.exe

echo.
echo ========================================
echo  Open: http://localhost
echo  Login: admin / admin123
echo  Status: status.bat
echo  Stop:   stop.bat
echo.
echo  For 24/7 stability:
echo  1. Set Windows power plan: never sleep
echo  2. Run install-watchdog.bat (auto-restart)
echo ========================================
pause
