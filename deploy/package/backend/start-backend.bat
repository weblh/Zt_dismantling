@echo off
setlocal enabledelayedexpansion

set "BACKEND_DIR=%~dp0"
cd /d "%BACKEND_DIR%"

if not exist "%BACKEND_DIR%dismantling-backend-1.0.0.jar" (
  echo [ERROR] dismantling-backend-1.0.0.jar not found
  exit /b 1
)

if "%JAVA_HOME%"=="" (
  where java >nul 2>&1
  if errorlevel 1 (
    echo [ERROR] Java not found. Install JRE/JDK 8+ and set PATH or JAVA_HOME
    exit /b 1
  )
) else (
  set "PATH=%JAVA_HOME%\bin;%PATH%"
)

if exist "%BACKEND_DIR%env.bat" (
  call "%BACKEND_DIR%env.bat"
)

if not exist "%BACKEND_DIR%logs" mkdir "%BACKEND_DIR%logs"

if not defined SERVER_PORT set SERVER_PORT=8086
if not defined JAVA_OPTS set JAVA_OPTS=-Xms256m -Xmx512m

set "JAR=%BACKEND_DIR%dismantling-backend-1.0.0.jar"
set "CONFIG=%BACKEND_DIR%application-prod.yml"
set "LOGFILE=%BACKEND_DIR%logs\backend.log"

set "PORT_UP=0"
for /f "delims=" %%a in ('netstat -ano 2^>nul ^| findstr ":%SERVER_PORT% " ^| findstr "LISTENING"') do set "PORT_UP=1"

if "!PORT_UP!"=="1" (
  echo Backend already listening on port %SERVER_PORT%
  for /f "tokens=2 delims==" %%i in ('wmic process where "CommandLine like '%%dismantling-backend-1.0.0.jar%%'" get ProcessId /value 2^>nul ^| find "ProcessId"') do echo PID=%%i
  exit /b 0
)

for /f "tokens=2 delims==" %%i in ('wmic process where "CommandLine like '%%dismantling-backend-1.0.0.jar%%'" get ProcessId /value 2^>nul ^| find "ProcessId"') do (
  echo Stale backend process found, PID=%%i, killing...
  taskkill /PID %%i /F >nul 2>&1
)

echo Starting backend on port %SERVER_PORT%...
echo JAR: %JAR%
echo Config: %CONFIG%

where javaw >nul 2>&1
if errorlevel 1 (
  start "" /D "%BACKEND_DIR%" /B java %JAVA_OPTS% -Dlogging.file.name="%LOGFILE%" -jar "%JAR%" --spring.config.additional-location="%CONFIG%" >> "%LOGFILE%" 2>&1
) else (
  start "" /D "%BACKEND_DIR%" javaw %JAVA_OPTS% -Dlogging.file.name="%LOGFILE%" -jar "%JAR%" --spring.config.additional-location="%CONFIG%"
)

echo Waiting for backend to listen on %SERVER_PORT% ^(may take 15s^)...
set "PORT_UP=0"
for /L %%n in (1,1,45) do (
  timeout /t 1 /nobreak >nul
  for /f "delims=" %%a in ('netstat -ano 2^>nul ^| findstr ":%SERVER_PORT% " ^| findstr "LISTENING"') do set "PORT_UP=1"
  if "!PORT_UP!"=="1" goto :started
)

echo [WARN] Backend did not start within 45s. Check logs\backend.log
exit /b 1

:started
echo Backend started. Log: %LOGFILE%
exit /b 0
