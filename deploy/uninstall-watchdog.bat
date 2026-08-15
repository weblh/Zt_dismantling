@echo off

schtasks /Delete /TN "DismantlingPlatformWatchdog" /F 2>nul

echo Watchdog task removed.

pause


