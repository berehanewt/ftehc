param(
  [switch]$DryRun,
  [switch]$ForceByPort,
  [int]$Port = 8080
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $projectRoot '.dev-up.pid'

Write-Host "Project root=$projectRoot"
if ($ForceByPort) {
  Write-Host "Mode=ForceByPort Port=$Port"
} else {
  Write-Host 'Mode=TrackedPid'
}

if ((Test-Path $pidFile) -and (-not $ForceByPort)) {
  $pidText = (Get-Content -Path $pidFile -Raw).Trim()
  try {
    $trackedPid = [int]$pidText
  } catch {
    throw "Invalid PID file content in ${pidFile}: '$pidText'"
  }
  $proc = Get-Process -Id $trackedPid -ErrorAction SilentlyContinue

  if ($null -eq $proc) {
    Write-Host "Tracked process PID=$trackedPid is not running."
    Remove-Item -Path $pidFile -Force
    Write-Host 'Removed stale PID file.'
    exit 0
  }

  Write-Host "Tracked process found: PID=$trackedPid Name=$($proc.ProcessName)"

  if ($DryRun) {
    Write-Host "DryRun: would stop tracked PID=$trackedPid Name=$($proc.ProcessName)"
    Write-Host 'DryRun enabled. Process was not stopped.'
    exit 0
  }

  # Use taskkill /T to terminate the tracked process tree (launcher + Java child).
  $taskKillOutput = & taskkill /PID $trackedPid /T /F 2>&1
  Write-Host ($taskKillOutput | Out-String)

  if (Get-Process -Id $trackedPid -ErrorAction SilentlyContinue) {
    Stop-Process -Id $trackedPid -Force -ErrorAction SilentlyContinue
  }

  Remove-Item -Path $pidFile -Force
  Write-Host "Stopped PID=$trackedPid and removed PID file."
  exit 0
}

if (-not $ForceByPort) {
  Write-Host "No PID file found at $pidFile. Nothing to stop."
  Write-Host 'Tip: use -ForceByPort to stop listener on a specific port.'
  exit 0
}

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -eq $listener) {
  Write-Host "No listening process found on port $Port."
  exit 0
}

$portPid = $listener.OwningProcess
$portProc = Get-Process -Id $portPid -ErrorAction SilentlyContinue

if ($null -eq $portProc) {
  Write-Host "Owning process PID=$portPid on port $Port no longer exists."
  exit 0
}

Write-Host "Port listener found: Port=$Port PID=$portPid Name=$($portProc.ProcessName)"

if ($DryRun) {
  Write-Host "DryRun: would stop port listener PID=$portPid Name=$($portProc.ProcessName) on port $Port"
  Write-Host 'DryRun enabled. Process was not stopped.'
  exit 0
}

Stop-Process -Id $portPid -Force
Write-Host "Stopped PID=$portPid listening on port $Port."

