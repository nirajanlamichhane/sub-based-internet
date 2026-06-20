# Local E2E test runner for sub-based-internet (Windows)

# Usage: .\scripts\test-local.ps1



$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot

Set-Location $Root



$Tools = Join-Path $Root ".tools"

$PgBin = Join-Path $Tools "pgsql\bin"

$Redis5 = Join-Path $Tools "redis7\redis-server.exe"



$env:Path = "$PgBin;C:\Program Files\nodejs;$env:APPDATA\npm;" + $env:Path



function Wait-Port($port, $label, $timeoutSec = 120) {

  Write-Host "Waiting for $label on port $port..."

  for ($i = 0; $i -lt $timeoutSec; $i++) {

    if ((Test-NetConnection localhost -Port $port -WarningAction SilentlyContinue).TcpTestSucceeded) {

      Write-Host "$label is up."

      return

    }

    Start-Sleep -Seconds 1

  }

  throw "$label not reachable on port $port after ${timeoutSec}s"

}



function Ensure-PortablePostgres {

  if (Test-NetConnection localhost -Port 5432 -WarningAction SilentlyContinue | Where-Object { $_.TcpTestSucceeded }) {

    return

  }



  $pgData = Join-Path $Tools "pgdata"

  if (-not (Test-Path (Join-Path $PgBin "postgres.exe"))) {

    throw "PostgreSQL not on :5432 and portable binaries missing in .tools/pgsql — run Docker or download postgres binaries to .tools"

  }



  if (-not (Test-Path (Join-Path $pgData "PG_VERSION"))) {

    Write-Host "Initializing portable PostgreSQL..."

    & (Join-Path $PgBin "initdb.exe") -D $pgData -U postgres -A trust -E UTF8 | Out-Null

    Add-Content (Join-Path $pgData "postgresql.conf") "`nlisten_addresses = 'localhost'"

  }



  Write-Host "Starting portable PostgreSQL..."

  & (Join-Path $PgBin "pg_ctl.exe") -D $pgData -l (Join-Path $Tools "pg.log") start -w -t 60 | Out-Null

  Wait-Port 5432 "PostgreSQL"

}



function Ensure-Redis5 {

  # BullMQ requires Redis >= 5. Windows winget Redis is often 3.x on :6379.

  if (Test-Path $Redis5) {

    $redisData = Join-Path $Tools "redis7-data-6380"

    New-Item -ItemType Directory -Force -Path $redisData | Out-Null

    $cli = Join-Path $Tools "redis7\redis-cli.exe"

    $version = & $cli -p 6380 INFO server 2>$null | Select-String "redis_version"

    if (-not $version) {

      Write-Host "Starting Redis 5+ on :6380 (BullMQ requires Redis >= 5)..."

      Start-Process -FilePath $Redis5 -ArgumentList "--port 6380 --dir `"$redisData`"" -WindowStyle Hidden | Out-Null

      Start-Sleep -Seconds 2

    }

    $env:REDIS_URL = "redis://localhost:6380"

    Wait-Port 6380 "Redis 5+"

    return

  }



  Wait-Port 6379 "Redis"

}



if (-not (Test-Path .env)) {

  Copy-Item .env.example .env

  Write-Host "Created .env from .env.example"

}



Ensure-PortablePostgres

Ensure-Redis5



$psql = Join-Path $PgBin "psql.exe"

if (-not (Test-Path $psql)) { $psql = "C:\Program Files\PostgreSQL\17\bin\psql.exe" }

if (Test-Path $psql) {

  $env:PGPASSWORD = "postgres"

  & $psql -U postgres -c "CREATE DATABASE sub_based_internet;" 2>$null | Out-Null

}



Get-Content .env | ForEach-Object {

  if ($_ -match '^([^#=]+)=(.*)$') { Set-Item -Path "env:$($matches[1].Trim())" -Value $matches[2].Trim() }

}

if ($env:REDIS_URL) { Write-Host "Using REDIS_URL=$($env:REDIS_URL)" }



Write-Host "Installing dependencies..."

pnpm install



Write-Host "Database setup..."

pnpm db:generate

pnpm db:migrate:deploy

pnpm db:seed



Write-Host "Building packages..."

pnpm --filter @sub-based-internet/shared build

pnpm --filter @sub-based-internet/db build

pnpm --filter @sub-based-internet/api build



Write-Host "Starting API..."

$apiJob = Start-Job -ScriptBlock {

  Set-Location $using:Root

  $env:Path = "$using:PgBin;C:\Program Files\nodejs;$env:APPDATA\npm;" + $env:Path

  if ($using:env:REDIS_URL) { $env:REDIS_URL = $using:env:REDIS_URL }

  Get-Content .env | ForEach-Object {

    if ($_ -match '^([^#=]+)=(.*)$') { Set-Item -Path "env:$($matches[1].Trim())" -Value $matches[2].Trim() }

  }

  node apps/api/dist/main.js

}



try {

  Wait-Port 3001 "API"

  Write-Host "Running E2E tests..."

  pnpm test:e2e

  $exit = $LASTEXITCODE

} finally {

  Stop-Job $apiJob -ErrorAction SilentlyContinue

  Remove-Job $apiJob -Force -ErrorAction SilentlyContinue

}



exit $exit

