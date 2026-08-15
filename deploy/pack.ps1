<#
.SYNOPSIS
  Build three frontends + backend and publish into apps/zt_dismantling
.DESCRIPTION
  Default target: D:\E\nginx-1.26.3\nginx-1.26.3\apps\zt_dismantling
  Layout:
    apps/zt_dismantling/                 ← 收车 admin-app (base=/zt_dismantling/)
    apps/zt_dismantling/pricing/         ← 收货议价 pricing-app
    apps/zt_dismantling/inspection/      ← 安环巡检 inspection-app
    apps/zt_dismantling/app/             ← jar + yml (denied by nginx)
.EXAMPLE
  .\deploy\pack.ps1
.EXAMPLE
  .\deploy\pack.ps1 -SkipBackend
#>
param(
  [string]$TargetDir = '',
  [string]$BasePath = '/zt_dismantling/',
  [int]$BackendPort = 5000,
  [switch]$SkipBackend,
  [switch]$SkipFrontend
)

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
$DefaultTarget = 'D:\E\nginx-1.26.3\nginx-1.26.3\apps\zt_dismantling'
if (-not $TargetDir) { $TargetDir = $DefaultTarget }

$AppDir = Join-Path $TargetDir 'app'
$LogsDir = Join-Path $TargetDir 'logs'
$Backend = Join-Path $Root 'java-backend'
$ProdYmlSrc = Join-Path $PSScriptRoot 'package\backend\application-prod.yml'

$BaseRoot = $BasePath.TrimEnd('/')
$ApiBase = "$BaseRoot/api"
$ReceiptUrl = $BaseRoot
$PricingUrl = "$BaseRoot/pricing"
$InspectionUrl = "$BaseRoot/inspection"

$Frontends = @(
  @{
    Name     = 'receipt'
    Dir      = Join-Path $Root 'admin-app'
    Base     = $BasePath
    Dest     = $TargetDir
    SubPath  = ''
  },
  @{
    Name     = 'pricing'
    Dir      = Join-Path $Root 'pricing-app'
    Base     = "$BaseRoot/pricing/"
    Dest     = Join-Path $TargetDir 'pricing'
    SubPath  = 'pricing'
  },
  @{
    Name     = 'inspection'
    Dir      = Join-Path $Root 'inspection-app'
    Base     = "$BaseRoot/inspection/"
    Dest     = Join-Path $TargetDir 'inspection'
    SubPath  = 'inspection'
  }
)

Write-Host "==> target: $TargetDir" -ForegroundColor Cyan
Write-Host "==> base:   $BasePath"
Write-Host "==> port:   $BackendPort"
Write-Host "==> apps:   receipt=$ReceiptUrl  pricing=$PricingUrl  inspection=$InspectionUrl"

New-Item -ItemType Directory -Force -Path $TargetDir, $AppDir, $LogsDir | Out-Null

function Build-FrontendApp {
  param($App)

  Write-Host "==> Build $($App.Name) ($($App.Dir))" -ForegroundColor Cyan
  if (-not (Test-Path $App.Dir)) {
    throw "Frontend directory not found: $($App.Dir)"
  }

  Push-Location $App.Dir
  try {
    if (-not (Test-Path 'node_modules')) {
      npm install
      if ($LASTEXITCODE -ne 0) { throw "npm install failed for $($App.Name) with exit $LASTEXITCODE" }
    }

    $env:VITE_BASE = $App.Base
    $env:VITE_API_BASE_URL = $ApiBase
    $env:VITE_APP_RECEIPT_URL = $ReceiptUrl
    $env:VITE_APP_PRICING_URL = $PricingUrl
    $env:VITE_APP_INSPECTION_URL = $InspectionUrl

    npm run build
    if ($LASTEXITCODE -ne 0) { throw "frontend build failed for $($App.Name) with exit $LASTEXITCODE" }
  } finally {
    Pop-Location
    Remove-Item Env:VITE_BASE -ErrorAction SilentlyContinue
    Remove-Item Env:VITE_API_BASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:VITE_APP_RECEIPT_URL -ErrorAction SilentlyContinue
    Remove-Item Env:VITE_APP_PRICING_URL -ErrorAction SilentlyContinue
    Remove-Item Env:VITE_APP_INSPECTION_URL -ErrorAction SilentlyContinue
  }

  $distIndex = Join-Path $App.Dir 'dist\index.html'
  $indexHtml = Get-Content $distIndex -Raw -ErrorAction Stop
  $baseTrim = $App.Base.TrimEnd('/')
  if ($baseTrim -and $indexHtml -notmatch [regex]::Escape("$baseTrim/assets/")) {
    throw "$($App.Name) build missing base path '$($App.Base)' in index.html"
  }
}

if (-not $SkipFrontend) {
  foreach ($app in $Frontends) {
    Build-FrontendApp -App $app
  }

  Write-Host '==> Copy frontend dist' -ForegroundColor Cyan
  $Keep = @(
    'app', 'logs',
    'start-backend.bat',
    'zt-dismantling-service.exe', 'zt-dismantling-service.xml'
  )
  Get-ChildItem $TargetDir -Force | Where-Object {
    $_.Name -notin $Keep
  } | Remove-Item -Recurse -Force

  foreach ($app in $Frontends) {
    New-Item -ItemType Directory -Force -Path $app.Dest | Out-Null
    Copy-Item -Path (Join-Path $app.Dir 'dist\*') -Destination $app.Dest -Recurse -Force
    Write-Host "  $($app.Name) -> $($app.Dest)" -ForegroundColor DarkGray
  }
}

if (-not $SkipBackend) {
  Write-Host '==> Build backend jar' -ForegroundColor Cyan
  Push-Location $Backend
  try {
    if (Test-Path '.\mvnw.cmd') {
      .\mvnw.cmd -DskipTests package
    } else {
      mvn -DskipTests package
    }
    if ($LASTEXITCODE -ne 0) { throw "Maven package failed with exit $LASTEXITCODE" }
  } finally {
    Pop-Location
  }

  $JarSrc = Join-Path $Backend 'target\dismantling-backend-1.0.0.jar'
  if (-not (Test-Path $JarSrc)) {
    throw "Backend jar not found: $JarSrc"
  }

  Copy-Item -Path $JarSrc -Destination (Join-Path $AppDir 'dismantling-backend-1.0.0.jar') -Force
  if (Test-Path $ProdYmlSrc) {
    Copy-Item -Path $ProdYmlSrc -Destination (Join-Path $AppDir 'application-prod.yml') -Force
  }

  $EnvBat = @"
@echo off
set DB_HOST=localhost
set DB_PORT=3306
set DB_NAME=dismantling_platform
set DB_USERNAME=root
set DB_PASSWORD=123456
set SERVER_PORT=$BackendPort
"@
  $EnvExample = Join-Path $AppDir 'env.example.bat'
  Set-Content -Path $EnvExample -Value $EnvBat -Encoding ASCII
  $EnvBatPath = Join-Path $AppDir 'env.bat'
  if (-not (Test-Path $EnvBatPath)) {
    Set-Content -Path $EnvBatPath -Value $EnvBat -Encoding ASCII
  }
}

# WinSW service definition
$SvcXmlDst = Join-Path $TargetDir 'zt-dismantling-service.xml'
$SvcExeDst = Join-Path $TargetDir 'zt-dismantling-service.exe'
$JavaExe = if (Test-Path 'D:\F\jdk\bin\java.exe') { 'D:\F\jdk\bin\java.exe' } else { 'java' }
$SvcXml = @"
<service>
    <id>ZtDismantlingService</id>
    <name>ZtDismantlingService</name>
    <description>Zt Dismantling Backend Service (port $BackendPort)</description>
    <executable>$JavaExe</executable>
    <arguments>-jar dismantling-backend-1.0.0.jar --spring.config.additional-location=./application-prod.yml --server.port=$BackendPort</arguments>
    <workingdirectory>$AppDir</workingdirectory>
    <startmode>Automatic</startmode>
    <logpath>$LogsDir</logpath>
    <logmode>rotate</logmode>
    <env name="DB_HOST" value="localhost" />
    <env name="DB_PORT" value="3306" />
    <env name="DB_NAME" value="dismantling_platform" />
    <env name="DB_USERNAME" value="root" />
    <env name="DB_PASSWORD" value="123456" />
    <env name="SERVER_PORT" value="$BackendPort" />
</service>
"@
Set-Content -Path $SvcXmlDst -Value $SvcXml -Encoding UTF8

if (-not (Test-Path $SvcExeDst)) {
  $WinSwCandidates = @(
    (Join-Path $TargetDir '..\leasing_entity\leasing-entity-service.exe'),
    (Join-Path $TargetDir '..\atourly\atourly-service.exe'),
    'D:\E\nginx-1.26.3\nginx-1.26.3\fengchi-service.exe'
  )
  $WinSw = $WinSwCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($WinSw) {
    Copy-Item -Path $WinSw -Destination $SvcExeDst -Force
    Write-Host "  Copied WinSW -> zt-dismantling-service.exe" -ForegroundColor DarkGray
  } else {
    Write-Host '  [WARN] WinSW exe not found; service install skipped' -ForegroundColor Yellow
  }
}

$StartBat = @"
@echo off
REM Prefer Windows service. Manual fallback if service not installed.
cd /d "%~dp0"
sc query ZtDismantlingService >nul 2>&1
if %ERRORLEVEL%==0 (
  echo Starting ZtDismantlingService ...
  net start ZtDismantlingService
  goto :eof
)
cd /d "%~dp0app"
if exist env.bat call env.bat
if not defined SERVER_PORT set SERVER_PORT=$BackendPort
echo Service not installed. Starting dismantling-backend on :%SERVER_PORT% ...
java -jar dismantling-backend-1.0.0.jar --spring.config.additional-location=./application-prod.yml --server.port=%SERVER_PORT%
pause
"@
Set-Content -Path (Join-Path $TargetDir 'start-backend.bat') -Value $StartBat -Encoding ASCII

Write-Host 'Done.' -ForegroundColor Green
Write-Host "  收车:     https://www.zszy.cc$ReceiptUrl/login"
Write-Host "  收货议价: https://www.zszy.cc$PricingUrl/login"
Write-Host "  安环巡检: https://www.zszy.cc$InspectionUrl/login"
Write-Host "  API:      https://www.zszy.cc$ApiBase/* -> 127.0.0.1:$BackendPort/api/*"
Write-Host '  Service:  ZtDismantlingService'
Write-Host '    install: apps\zt_dismantling\zt-dismantling-service.exe install'
Write-Host '    start:   net start ZtDismantlingService'
Write-Host '    stop:    net stop ZtDismantlingService'
Write-Host '    restart: apps\zt_dismantling\zt-dismantling-service.exe restart'
Write-Host '  Nginx:    nginx -s reload'
