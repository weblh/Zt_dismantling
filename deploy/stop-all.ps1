# Stop nginx and backend
param(
    [string]$NginxDir = (Join-Path $PSScriptRoot "tools\nginx"),
    [string]$BackendDir = (Join-Path $PSScriptRoot "package\backend")
)

$ErrorActionPreference = "SilentlyContinue"

if (Test-Path (Join-Path $NginxDir "nginx.exe")) {
    Push-Location $NginxDir
    & .\nginx.exe -s stop
    Pop-Location
    Write-Host "Nginx stopped"
}

if (Test-Path (Join-Path $BackendDir "stop-backend.bat")) {
    & cmd /c (Join-Path $BackendDir "stop-backend.bat")
}

Write-Host "All services stopped"
