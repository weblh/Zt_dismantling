@echo off

cd /d "%~dp0"



set "TASK_NAME=DismantlingPlatformWatchdog"

set "WATCHDOG=%~dp0watchdog.bat"



schtasks /Query /TN "%TASK_NAME%" >nul 2>&1

if not errorlevel 1 (

  schtasks /Delete /TN "%TASK_NAME%" /F >nul

)



schtasks /Create /TN "%TASK_NAME%" /TR "\"%WATCHDOG%\"" /SC MINUTE /MO 5 /RU "%USERNAME%" /F

if errorlevel 1 (

  echo [ERROR] Failed to create scheduled task. Run as Administrator.

  pause

  exit /b 1

)



echo Watchdog installed: checks backend and nginx every 5 minutes.

echo Log: package\backend\logs\watchdog.log

echo Remove: deploy\uninstall-watchdog.bat

pause


