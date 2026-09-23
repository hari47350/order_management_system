# ==============================================================================
# CartToDoor — One-Click Production Deployment Script
# ==============================================================================

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   Deploying CartToDoor Order Management System         " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$ROOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ROOT_DIR

# 1. Check if Docker is running for Containerized Deployment
$dockerRunning = $false
try {
    $dockerVer = docker version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
    }
} catch {
    $dockerRunning = $false
}

if ($dockerRunning) {
    Write-Host "`n[1/3] Docker engine detected. Launching full container stack..." -ForegroundColor Yellow
    docker compose up --build -d
    Write-Host "`nCartToDoor deployed successfully with Docker Compose!" -ForegroundColor Green
    Write-Host "Storefront: http://localhost" -ForegroundColor Cyan
    Write-Host "Backend API: http://localhost:8080" -ForegroundColor Cyan
    exit 0
}

Write-Host "`n[INFO] Docker engine not running. Proceeding with Native Production Deployment..." -ForegroundColor Yellow

# 2. Build Backend Production JAR
Write-Host "`n[1/2] Building Backend Production JAR..." -ForegroundColor Yellow
Set-Location "$ROOT_DIR\backend"
mvn clean package -DskipTests
if ($LASTEXITCODE -ne 0) {
    Write-Error "Backend build failed!"
    exit 1
}
Write-Host "Backend JAR built successfully: target/order-management-backend-1.0.0.jar" -ForegroundColor Green

# 3. Build Frontend Production Bundle
Write-Host "`n[2/2] Building Frontend Production Bundle..." -ForegroundColor Yellow
Set-Location "$ROOT_DIR\frontend"
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend build failed!"
    exit 1
}
Write-Host "Frontend production bundle generated in dist/" -ForegroundColor Green

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   DEPLOYMENT ARTIFACTS READY!                          " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "1. Backend Production JAR:  $ROOT_DIR\backend\target\order-management-backend-1.0.0.jar"
Write-Host "2. Frontend Static Bundle:  $ROOT_DIR\frontend\dist"
Write-Host "3. Docker Compose Stack:    docker compose up --build -d"
Write-Host "`nTo start live services:"
Write-Host "  Backend:  java -jar backend\target\order-management-backend-1.0.0.jar"
Write-Host "  Frontend: cd frontend; npm run preview (served on http://localhost:5000)"
