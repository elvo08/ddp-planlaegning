# Starter DDP-planlægning på http://localhost:8000
# Første gang opretter scriptet et Python-miljø og installerer FastAPI.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Test-Path ".venv")) {
  python -m venv .venv
  .venv\Scripts\python -m pip install -q -r requirements.txt
}
Write-Output "DDP-planlægning kører på http://localhost:8000 (stop med Ctrl+C)"
.venv\Scripts\python -m uvicorn server.main:app --port 8000
