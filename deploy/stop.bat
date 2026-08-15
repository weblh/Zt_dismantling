@echo off
cd /d "%~dp0"

cd /d "%~dp0tools\nginx"
nginx.exe -s stop 2>nul

cd /d "%~dp0package\backend"
call stop-backend.bat

echo Services stopped
