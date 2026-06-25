# AIXYNZ Cortex — Backend Startup Script
# Handles the MySQL Shell / OpenSSL PATH conflict on this machine.
#
# Usage: .\run_backend.ps1
#        .\run_backend.ps1 -Port 8001

param(
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"

# ── 1) Resolve the Python / uvicorn path ─────────────────────────────────────
$UvicornExe = "C:\Users\Atharva\AppData\Roaming\Python\Python313\Scripts\uvicorn.exe"

if (-not (Test-Path $UvicornExe)) {
    Write-Error "uvicorn.exe not found at $UvicornExe. Run: pip install uvicorn"
    exit 1
}

# ── 2) Strip MySQL Shell from PATH to avoid OpenSSL / importlib conflict ──────
$env:PATH = ($env:PATH -split ";") -join ";"   # normalise
$CleanPath = ($env:PATH -split ";" | Where-Object { $_ -notmatch "MySQL" }) -join ";"
$env:PATH = $CleanPath

# ── 3) Suppress the OpenSSL legacy-provider error from MySQL's cryptography ───
$env:CRYPTOGRAPHY_OPENSSL_NO_LEGACY = "1"

# ── 4) Load .env if present ──────────────────────────────────────────────────
$EnvFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]*?)\s*=\s*(.*)\s*$") {
            [System.Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], "Process")
        }
    }
    Write-Host "[cortex] Loaded .env" -ForegroundColor DarkGray
}

# ── 5) Start uvicorn ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  AIXYNZ Cortex Backend" -ForegroundColor Cyan
Write-Host "  http://127.0.0.1:$Port/api/v1" -ForegroundColor White
Write-Host "  Docs: http://127.0.0.1:$Port/docs" -ForegroundColor White
Write-Host ""

Push-Location $PSScriptRoot
try {
    & $UvicornExe main:app --host 127.0.0.1 --port $Port --reload
} finally {
    Pop-Location
}
