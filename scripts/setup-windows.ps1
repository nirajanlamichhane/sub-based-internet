# One-click local setup for Windows
# Usage: powershell -ExecutionPolicy Bypass -File scripts/setup-windows.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "OK  $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "WARN $msg" -ForegroundColor Yellow }

Write-Host "Sub-Based Internet - Windows setup" -ForegroundColor White

# Node.js
Write-Step "Checking Node.js..."
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Install Node.js 20+ from https://nodejs.org then re-run this script." -ForegroundColor Red
    exit 1
}
$nodeVer = (node -v) -replace 'v', ''
if ([version]$nodeVer -lt [version]"20.0.0") {
    Write-Warn "Node $nodeVer found - Node 20+ recommended"
}
Write-Ok "Node $(node -v)"

# pnpm
Write-Step "Checking pnpm..."
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "Installing pnpm..."
    npm install -g pnpm
}
Write-Ok "pnpm $(pnpm -v)"

# Docker
Write-Step "Checking Docker..."
$dockerOk = $false
if (Get-Command docker -ErrorAction SilentlyContinue) {
    try {
        docker info 2>$null | Out-Null
        $dockerOk = $true
        Write-Ok "Docker is running"
    } catch {
        Write-Warn "Docker installed but not running - start Docker Desktop"
    }
} else {
    Write-Warn "Docker not found - install Docker Desktop from https://docker.com"
}

# .env
Write-Step "Environment file..."
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Ok "Created .env from .env.example"
} else {
    Write-Ok ".env already exists"
}

# Use Docker Redis (avoid old Windows Redis 3.x on 6379)
$envContent = Get-Content ".env" -Raw
if ($envContent -notmatch "REDIS_URL=redis://localhost:6379") {
    Write-Ok "REDIS_URL already customized"
} else {
    Write-Ok "REDIS_URL=redis://localhost:6379 (use Docker Redis)"
}

# Start infrastructure
if ($dockerOk) {
    Write-Step "Starting PostgreSQL + Redis (Docker)..."
    docker compose up -d
    Start-Sleep -Seconds 8
    Write-Ok "docker compose up -d"
}

# Install & database
Write-Step "Installing packages (first run may take a few minutes)..."
pnpm install
Write-Ok "pnpm install"

Write-Step "Database setup..."
$env:DATABASE_URL = (Select-String -Path ".env" -Pattern "^DATABASE_URL=(.+)$").Matches.Groups[1].Value.Trim()
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.*)$') { Set-Item -Path "env:$($matches[1].Trim())" -Value $matches[2].Trim() }
}
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
Write-Ok "Database ready"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host " Setup complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host @"

Next steps:
  1. Open a NEW terminal in this folder
  2. Run:  pnpm dev
  3. Open: http://localhost:3000/login

Demo login:
  owner@demo.com / password123

Optional (second terminal):
  pnpm gateway:dev

Run tests:
  pnpm test:e2e

"@ -ForegroundColor White
