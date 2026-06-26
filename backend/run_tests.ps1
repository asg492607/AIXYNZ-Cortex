$ErrorActionPreference = "Stop"

$env:PATH = ($env:PATH -split ";") -join ";"
$CleanPath = ($env:PATH -split ";" | Where-Object { $_ -notmatch "MySQL" }) -join ";"
$env:PATH = $CleanPath

$env:CRYPTOGRAPHY_OPENSSL_NO_LEGACY = "1"
$env:PYTHONPATH = $PSScriptRoot

Push-Location $PSScriptRoot
try {
    & "C:\Users\Atharva\AppData\Roaming\Python\Python313\Scripts\pytest.exe" $args -v
} finally {
    Pop-Location
}
