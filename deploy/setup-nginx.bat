@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set "NGINX=%~dp0tools\nginx"
set "CONF=%NGINX%\conf\dismantling-platform.conf"

for %%I in ("%~dp0package\frontend") do set "FRONTEND=%%~fI"
set "FRONTEND=!FRONTEND:\=/!"

if not exist "%NGINX%\nginx.exe" (
  echo [ERROR] nginx.exe not found in tools\nginx
  exit /b 1
)

if not exist "%~dp0package\frontend\index.html" (
  echo [ERROR] package\frontend\index.html not found
  exit /b 1
)

(
echo server {
echo     listen       80;
echo     server_name  localhost;
echo.
echo     root   "!FRONTEND!";
echo     index  index.html;
echo.
echo     location / {
echo         try_files $uri $uri/ /index.html;
echo     }
echo.
echo     location /api/ {
echo         proxy_pass         http://127.0.0.1:8080;
echo         proxy_set_header   Host              $host;
echo         proxy_set_header   X-Real-IP         $remote_addr;
echo         proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
echo         client_max_body_size 50m;
echo     }
echo }
)>"%CONF%"

echo Nginx config generated
echo Frontend root: !FRONTEND!
exit /b 0
