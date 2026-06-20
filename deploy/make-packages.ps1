# Build production-cloud.zip and gateway-venue.zip (Windows)
# Usage: powershell -ExecutionPolicy Bypass -File deploy/make-packages.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Out = Join-Path $Root "deploy"
$Staging = Join-Path $Out ".pack-staging"

if (Test-Path $Staging) { Remove-Item $Staging -Recurse -Force }
$CloudStaging = Join-Path $Staging "cloud"
$GatewayStaging = Join-Path $Staging "gateway"
New-Item -ItemType Directory -Path $CloudStaging, $GatewayStaging -Force | Out-Null

function Copy-ProjectTree {
    param([string]$Source, [string]$Dest)
    $exclude = @("node_modules", "dist", ".next", ".turbo", ".pack-staging")
    New-Item -ItemType Directory -Path $Dest -Force | Out-Null
    Get-ChildItem -Path $Source -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($Source.Length).TrimStart("\")
        $skip = $false
        foreach ($part in $exclude) {
            if ($rel -match [regex]::Escape($part)) { $skip = $true; break }
        }
        if ($skip) { return }
        $target = Join-Path $Dest $rel
        $dir = Split-Path $target -Parent
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        Copy-Item $_.FullName $target -Force
    }
}

Write-Host "Building production-cloud.zip ..."
Copy-ProjectTree (Join-Path $Root "apps\api") (Join-Path $CloudStaging "apps\api")
Copy-ProjectTree (Join-Path $Root "apps\web") (Join-Path $CloudStaging "apps\web")
Copy-ProjectTree (Join-Path $Root "packages\db") (Join-Path $CloudStaging "packages\db")
Copy-ProjectTree (Join-Path $Root "packages\shared") (Join-Path $CloudStaging "packages\shared")
# Copy deploy files individually (avoid staging/zip recursion)
$cloudDeploy = Join-Path $CloudStaging "deploy"
New-Item -ItemType Directory -Path $cloudDeploy -Force | Out-Null
Get-ChildItem (Join-Path $Root "deploy") -File | Where-Object {
    $_.Extension -ne ".zip" -and $_.Name -notlike "make-packages*"
} | ForEach-Object { Copy-Item $_.FullName (Join-Path $cloudDeploy $_.Name) -Force }

$cloudFiles = @(
    "docker-compose.prod.yml", "Dockerfile.api", "Dockerfile.web", ".dockerignore",
    ".env.production.example", "package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml",
    "turbo.json", "tsconfig.base.json", "README.md"
)
foreach ($f in $cloudFiles) {
    $src = Join-Path $Root $f
    if (Test-Path $src) { Copy-Item $src (Join-Path $CloudStaging $f) -Force }
}

$cloudZip = Join-Path $Out "production-cloud.zip"
if (Test-Path $cloudZip) { Remove-Item $cloudZip -Force }
Compress-Archive -Path (Join-Path $CloudStaging "*") -DestinationPath $cloudZip -Force

Write-Host "Building gateway-venue.zip ..."
Copy-ProjectTree (Join-Path $Root "gateway\agent") (Join-Path $GatewayStaging "gateway\agent")
Copy-ProjectTree (Join-Path $Root "packages\shared") (Join-Path $GatewayStaging "packages\shared")
$gwDeploy = Join-Path $GatewayStaging "deploy"
New-Item -ItemType Directory -Path $gwDeploy -Force | Out-Null
@(
    "gateway-agent.env.example", "gateway-agent.service", "gateway-agent.procd",
    "nodogsplash.uci.example", "install-gateway-agent.sh"
) | ForEach-Object {
    Copy-Item (Join-Path $Root "deploy\$_") (Join-Path $gwDeploy $_) -Force
}
@("package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "tsconfig.base.json") | ForEach-Object {
    Copy-Item (Join-Path $Root $_) (Join-Path $GatewayStaging $_) -Force
}

$gatewayZip = Join-Path $Out "gateway-venue.zip"
if (Test-Path $gatewayZip) { Remove-Item $gatewayZip -Force }
Compress-Archive -Path (Join-Path $GatewayStaging "*") -DestinationPath $gatewayZip -Force

Remove-Item $Staging -Recurse -Force
Write-Host "Done:"
Get-Item $cloudZip, $gatewayZip | Format-Table Name, @{N="SizeMB";E={[math]::Round($_.Length/1MB,2)}}
