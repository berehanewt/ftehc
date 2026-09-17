param(
  [string]$HealthUrl = 'http://localhost:8080/actuator/health',
  [int]$Port = 8080,
  [int]$TimeoutSeconds = 3,
  [switch]$RunPortalCriticalTests,
  [ValidateSet('portal-critical', 'role-pack')]
  [string]$CriticalTestMode = 'portal-critical',
  [switch]$CleanStalePidFile,
  [switch]$FailOnUnhealthy,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $projectRoot '.dev-up.pid'

Write-Host "Project root=$projectRoot"
Write-Host "Health URL=$HealthUrl"
Write-Host "Port=$Port"
Write-Host "RunPortalCriticalTests=$RunPortalCriticalTests"
Write-Host "CriticalTestMode=$CriticalTestMode"
Write-Host "CleanStalePidFile=$CleanStalePidFile"
Write-Host "FailOnUnhealthy=$FailOnUnhealthy"

if ($DryRun) {
  Write-Host 'DryRun enabled. Endpoint and process checks were not executed.'
  exit 0
}

$healthOk = $false

if (Test-Path $pidFile) {
  $pidText = (Get-Content -Path $pidFile -Raw).Trim()
  try {
    $trackedPid = [int]$pidText
    $trackedProc = Get-Process -Id $trackedPid -ErrorAction SilentlyContinue

    if ($null -eq $trackedProc) {
      Write-Host "PID file exists, but tracked process is not running. PID=$trackedPid"
      if ($CleanStalePidFile) {
        Remove-Item -Path $pidFile -Force
        Write-Host "Removed stale PID file: $pidFile"
      }
    } else {
      Write-Host "Tracked process: PID=$trackedPid Name=$($trackedProc.ProcessName)"
    }
  } catch {
    Write-Host "PID file exists, but content is invalid: '$pidText'"
  }
} else {
  Write-Host 'PID file not found.'
}

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -eq $listener) {
  Write-Host "Port listener: none on $Port"
} else {
  $portPid = $listener.OwningProcess
  $portProc = Get-Process -Id $portPid -ErrorAction SilentlyContinue
  if ($null -eq $portProc) {
    Write-Host "Port listener: PID=$portPid (process exited)"
  } else {
    Write-Host "Port listener: PID=$portPid Name=$($portProc.ProcessName)"
  }
}

try {
  $health = Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec $TimeoutSeconds
  $status = $health.status
  Write-Host "Actuator health: $status"
  if ($status -eq 'UP') {
    $healthOk = $true
  }
} catch {
  Write-Host "Actuator health check failed: $($_.Exception.Message)"
}

if ($RunPortalCriticalTests) {
  $criticalScript = Join-Path $projectRoot 'dev-test-critical.ps1'
  if (-not (Test-Path $criticalScript)) {
    throw "Missing script: $criticalScript"
  }

  Write-Host 'Running critical frontend tests...'
  & powershell -ExecutionPolicy Bypass -File $criticalScript -Mode $CriticalTestMode
}

if ($FailOnUnhealthy -and -not $healthOk) {
  throw "Health check status is not UP. URL=$HealthUrl"
}

