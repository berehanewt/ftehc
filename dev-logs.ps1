param(
  [ValidateSet('local', 'prod')]
  [string]$Profile = 'local',
  [int]$Lines = 80,
  [switch]$Follow,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$logsDir = Join-Path $projectRoot 'logs'
$logFileName = if ($Profile -eq 'prod') { 'prod-app.log' } else { 'local-app.log' }
$logFile = Join-Path $logsDir $logFileName

Write-Host "Project root=$projectRoot"
Write-Host "Profile=$Profile"
Write-Host "Log file=$logFile"

if ($DryRun) {
  Write-Host 'DryRun enabled. Log file was not read.'
  exit 0
}

if (-not (Test-Path $logFile)) {
  Write-Host 'Log file not found. Start the app first (run-local.ps1 / run-prod.ps1 / dev-up.ps1 / dev-restart.ps1).'
  exit 0
}

if ($Follow) {
  Get-Content -Path $logFile -Tail $Lines -Wait
  exit 0
}

Get-Content -Path $logFile -Tail $Lines

