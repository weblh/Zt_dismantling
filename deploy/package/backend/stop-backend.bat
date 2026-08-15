@echo off
for /f "tokens=2" %%i in ('tasklist /FI "WINDOWTITLE eq dismantling-backend*" /FO LIST ^| find "PID:"') do taskkill /PID %%i /F >nul 2>&1
for /f "tokens=2" %%i in ('wmic process where "CommandLine like '%%dismantling-backend-1.0.0.jar%%'" get ProcessId /value ^| find "ProcessId"') do taskkill /PID %%i /F >nul 2>&1
echo Backend stop attempted
