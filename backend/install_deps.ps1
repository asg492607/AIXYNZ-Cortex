$ErrorActionPreference = "Stop"

$env:PATH = ($env:PATH -split ";") -join ";"
$CleanPath = ($env:PATH -split ";" | Where-Object { $_ -notmatch "MySQL" }) -join ";"
$env:PATH = $CleanPath

# Use the standard py
& "C:\Program Files\MySQL\MySQL Shell 8.0\lib\Python3.13\Lib\venv\scripts\nt\python.exe" -m pip install boto3 groq PyGithub pytest fastapi httpx apscheduler requests

# Also install these packages to ensure everything needed is present
