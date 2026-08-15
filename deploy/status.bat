@echo off

cd /d "%~dp0"



echo === Dismantling Platform Status ===

echo.



netstat -ano | findstr ":8080" | findstr "LISTENING" >nul

if errorlevel 1 (

  echo [FAIL] Backend  : port 8080 not listening

) else (

  echo [ OK ] Backend  : port 8080 listening

  for /f "tokens=2 delims==" %%i in ('wmic process where "CommandLine like '%%dismantling-backend-1.0.0.jar%%'" get ProcessId /value 2^>nul ^| find "ProcessId"') do echo        PID=%%i

)



tasklist /FI "IMAGENAME eq nginx.exe" 2>nul | find /I "nginx.exe" >nul

if errorlevel 1 (

  echo [FAIL] Nginx    : not running

) else (

  echo [ OK ] Nginx    : running

)



netstat -ano | findstr ":80 " | findstr "LISTENING" >nul

if errorlevel 1 (

  echo [WARN] Port 80  : not listening

) else (

  echo [ OK ] Port 80  : listening

)



echo.

echo Log: package\backend\logs\backend.log

pause


