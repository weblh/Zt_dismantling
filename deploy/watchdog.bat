@echo off

setlocal



cd /d "%~dp0"



if not exist "package\backend\logs" mkdir "package\backend\logs"

set "LOG=package\backend\logs\watchdog.log"



set "BACKEND_UP=0"

for /f "delims=" %%a in ('netstat -ano 2^>nul ^| findstr ":8080" ^| findstr "LISTENING"') do set "BACKEND_UP=1"



if "%BACKEND_UP%"=="0" (

  echo [%date% %time%] Backend not listening on 8080, restarting...>>"%LOG%"

  cd /d "%~dp0package\backend"

  call start-backend.bat >>"%LOG%" 2>&1

  cd /d "%~dp0"

)



tasklist /FI "IMAGENAME eq nginx.exe" 2>nul | find /I "nginx.exe" >nul

if errorlevel 1 (

  echo [%date% %time%] Nginx not running, restarting...>>"%LOG%"

  cd /d "%~dp0tools\nginx"

  start "" nginx.exe

  cd /d "%~dp0"

)



exit /b 0


