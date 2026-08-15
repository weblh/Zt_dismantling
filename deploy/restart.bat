@echo off
cd /d "%~dp0"

echo Stopping services...
call "%~dp0stop.bat"

echo.
echo Starting services...
call "%~dp0start.bat"
