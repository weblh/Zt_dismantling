# Download and install portable nginx for Windows
param(
    [string]$InstallDir = (Join-Path $PSScriptRoot "tools\nginx"),
    [string]$Version = "1.26.3"
)

$ErrorActionPreference = "Stop"
$ZipName = "nginx-$Version.zip"
$ZipPath = Join-Path $env:TEMP $ZipName
$Url = "https://nginx.org/download/$ZipName"

Write-Host "==> Installing nginx $Version to $InstallDir"

if (Test-Path (Join-Path $InstallDir "nginx.exe")) {
    Write-Host "Nginx already exists, skipping download"
    exit 0
}

New-Item -ItemType Directory -Force -Path (Split-Path $InstallDir) | Out-Null
Write-Host "Downloading: $Url"
Invoke-WebRequest -Uri $Url -OutFile $ZipPath -UseBasicParsing

if (Test-Path $InstallDir) { Remove-Item $InstallDir -Recurse -Force }
Expand-Archive -Path $ZipPath -DestinationPath (Split-Path $InstallDir) -Force

$Extracted = Join-Path (Split-Path $InstallDir) "nginx-$Version"
if (Test-Path $Extracted) {
    Rename-Item $Extracted $InstallDir
}

if (-not (Test-Path (Join-Path $InstallDir "nginx.exe"))) {
    throw "Nginx installation failed"
}

Write-Host "Nginx installed: $InstallDir"
