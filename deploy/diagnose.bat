@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo === Backend Diagnosis ===
echo.

echo [1] Java
where java >nul 2>&1
if errorlevel 1 (
  echo   [FAIL] java not found in PATH
) else (
  for /f "delims=" %%v in ('java -version 2^>^&1 ^| findstr /i "version"') do echo   [ OK ] %%v
)

echo.
echo [2] JAR file
if exist "package\backend\dismantling-backend-1.0.0.jar" (
  echo   [ OK ] dismantling-backend-1.0.0.jar exists
) else (
  echo   [FAIL] package\backend\dismantling-backend-1.0.0.jar missing
)

echo.
echo [3] env.bat
if exist "package\backend\env.bat" (
  echo   [ OK ] env.bat found
  type "package\backend\env.bat" | findstr /v "^REM" | findstr /v "^$" | findstr /v "^echo"
) else (
  echo   [WARN] env.bat not found, using defaults from application-prod.yml
  echo          Default DB_PASSWORD=admin
)

echo.
echo [4] Port 8080
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if errorlevel 1 (
  echo   [FAIL] nothing listening on 8080
) else (
  echo   [ OK ] port 8080 is listening
  netstat -ano | findstr ":8080" | findstr "LISTENING"
)

echo.
echo [5] Backend process
set "FOUND=0"
for /f "tokens=2 delims==" %%i in ('wmic process where "CommandLine like '%%dismantling-backend-1.0.0.jar%%'" get ProcessId /value 2^>nul ^| find "ProcessId"') do (
  echo   [INFO] javaw/java PID=%%i
  set "FOUND=1"
)
if "!FOUND!"=="0" echo   [WARN] no backend process found

echo.
echo [6] MySQL port 3306
netstat -ano | findstr ":3306" | findstr "LISTENING" >nul
if errorlevel 1 (
  echo   [FAIL] MySQL may not be running ^(port 3306 not listening^)
) else (
  echo   [ OK ] port 3306 is listening
)

echo.
echo [7] Last 25 lines of backend.log
echo ----------------------------------------
if exist "package\backend\logs\backend.log" (
  powershell -NoProfile -Command "Get-Content -Path 'package\backend\logs\backend.log' -Tail 25 -ErrorAction SilentlyContinue"
) else (
  echo   [WARN] log file not found - backend may never have started
)
echo ----------------------------------------

echo.
echo === Try start backend (foreground, shows errors) ===
echo Press Ctrl+C to stop after you see the result.
echo.
pause

cd /d "%~dp0package\backend"
if exist env.bat call env.bat
java -Xms256m -Xmx512m -jar dismantling-backend-1.0.0.jar --spring.config.additional-location=./application-prod.yml
