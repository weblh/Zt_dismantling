# Build deploy package: frontend dist + backend JAR + SQL + config files
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$DeployRoot = $PSScriptRoot
$PackageRoot = Join-Path $DeployRoot "package"

Write-Host "==> Project root: $Root"

# 1. Build frontend (paths aligned with nginx conf: /zt_dismantling/)
$BasePath = '/zt_dismantling/'
$BaseRoot = $BasePath.TrimEnd('/')
$env:VITE_BASE = $BasePath
$env:VITE_API_BASE_URL = "$BaseRoot/api"
$env:VITE_APP_RECEIPT_URL = $BaseRoot
$env:VITE_APP_PRICING_URL = "$BaseRoot/pricing"
$env:VITE_APP_INSPECTION_URL = "$BaseRoot/inspection"

Write-Host "`n==> Building frontend (base=$BasePath)..."
Push-Location (Join-Path $Root "admin-app")
try {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "frontend build failed with exit $LASTEXITCODE" }
} finally {
  Pop-Location
  Remove-Item Env:VITE_BASE -ErrorAction SilentlyContinue
  Remove-Item Env:VITE_API_BASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:VITE_APP_RECEIPT_URL -ErrorAction SilentlyContinue
  Remove-Item Env:VITE_APP_PRICING_URL -ErrorAction SilentlyContinue
  Remove-Item Env:VITE_APP_INSPECTION_URL -ErrorAction SilentlyContinue
}

# 2. Build backend
Write-Host "`n==> Building backend..."
Push-Location (Join-Path $Root "java-backend")
if ($env:JAVA_HOME) {
    Write-Host "Using JAVA_HOME: $env:JAVA_HOME"
}
.\mvnw.cmd clean package -DskipTests
$JarPath = Join-Path (Get-Location) "target\dismantling-backend-1.0.0.jar"
if (-not (Test-Path $JarPath)) {
    throw "Backend JAR build failed. Install JDK 8+ (JRE alone is not enough)."
}
Pop-Location

# 3. Assemble deploy package
Write-Host "`n==> Assembling package at $PackageRoot"
$FrontendDest = Join-Path $PackageRoot "frontend"
$BackendDest = Join-Path $PackageRoot "backend"
$SqlDest = Join-Path $PackageRoot "sql"
$NginxDest = Join-Path $PackageRoot "nginx"
$BackendTemplate = Join-Path $DeployRoot "package\backend"

foreach ($dir in @($FrontendDest, $SqlDest, $NginxDest)) {
    if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}
New-Item -ItemType Directory -Path $BackendDest -Force | Out-Null

Copy-Item -Path (Join-Path $Root "admin-app\dist\*") -Destination $FrontendDest -Recurse -Force
Copy-Item -Path $JarPath -Destination (Join-Path $BackendDest "dismantling-backend-1.0.0.jar") -Force
Copy-Item -Path (Join-Path $BackendTemplate "application-prod.yml") -Destination $BackendDest -Force
Copy-Item -Path (Join-Path $BackendTemplate "start-backend.bat") -Destination $BackendDest -Force
Copy-Item -Path (Join-Path $BackendTemplate "stop-backend.bat") -Destination $BackendDest -Force
Copy-Item -Path (Join-Path $BackendTemplate "env.example.bat") -Destination $BackendDest -Force
Copy-Item -Path (Join-Path $Root "java-backend\src\main\resources\init.sql") -Destination $SqlDest -Force
Copy-Item -Path (Join-Path $Root "java-backend\src\main\resources\schema.sql") -Destination $SqlDest -Force
Copy-Item -Path (Join-Path $DeployRoot "nginx\dismantling-platform.conf") -Destination $NginxDest -Force

Write-Host "`n==> Package ready: $PackageRoot"
Write-Host "    frontend/  - static frontend files"
Write-Host "    backend/   - backend JAR and startup scripts"
Write-Host "    sql/       - database init scripts"
Write-Host "    nginx/     - nginx config template"
Write-Host "`nCopy deploy folder to target machine, then run start.bat"
