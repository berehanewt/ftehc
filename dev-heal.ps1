param(
  [string]$HealthUrl = 'http://localhost:8080/actuator/health',
  [int]$Retries = 20,
  [int]$DelaySeconds = 2,
  [int]$TimeoutSeconds = 5,
  [int]$Port = 8080,
  [switch]$RunPortalCriticalTests,
  [ValidateSet('portal-critical', 'role-pack')]
  [string]$CriticalTestMode = 'portal-critical',
  [switch]$SummaryJson,
  [string]$SummaryJsonPath,
  [switch]$RestartIfUnhealthy,
  [switch]$FailOnUnhealthy,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$devStatusScript = Join-Path $projectRoot 'dev-status.ps1'
$devRestartScript = Join-Path $projectRoot 'dev-restart.ps1'
$criticalScript = Join-Path $projectRoot 'dev-test-critical.ps1'

if (-not (Test-Path $devStatusScript)) {
  throw "Missing script: $devStatusScript"
}
if (-not (Test-Path $devRestartScript)) {
  throw "Missing script: $devRestartScript"
}
if ($RunPortalCriticalTests -and -not (Test-Path $criticalScript)) {
  throw "Missing script: $criticalScript"
}

Write-Host "Project root=$projectRoot"
Write-Host "Health URL=$HealthUrl"
Write-Host "Port=$Port"
Write-Host "RestartIfUnhealthy=$RestartIfUnhealthy"
Write-Host "RunPortalCriticalTests=$RunPortalCriticalTests"
Write-Host "CriticalTestMode=$CriticalTestMode"
Write-Host "SummaryJson=$SummaryJson"
if ($SummaryJsonPath) {
  Write-Host "SummaryJsonPath=$SummaryJsonPath"
}
Write-Host "FailOnUnhealthy=$FailOnUnhealthy"

if ($DryRun) {
  Write-Host 'DryRun enabled. No service restart or tests will be executed.'
  & powershell -ExecutionPolicy Bypass -File $devStatusScript -HealthUrl $HealthUrl -Port $Port -TimeoutSeconds $TimeoutSeconds -CleanStalePidFile -CriticalTestMode $CriticalTestMode -DryRun
  if ($RestartIfUnhealthy) {
    & powershell -ExecutionPolicy Bypass -File $devRestartScript -HealthUrl $HealthUrl -Retries $Retries -DelaySeconds $DelaySeconds -TimeoutSeconds $TimeoutSeconds -Port $Port -DryRun
  }
  if ($RunPortalCriticalTests) {
    $criticalArgs = @('-ExecutionPolicy', 'Bypass', '-File', $criticalScript, '-Mode', $CriticalTestMode, '-DryRun')
    if ($SummaryJson) { $criticalArgs += '-SummaryJson' }
    if ($SummaryJsonPath) { $criticalArgs += @('-SummaryJsonPath', $SummaryJsonPath) }
    & powershell @criticalArgs
  }
  exit 0
}

# Always clean stale PID metadata first.
& powershell -ExecutionPolicy Bypass -File $devStatusScript -HealthUrl $HealthUrl -Port $Port -TimeoutSeconds $TimeoutSeconds -CleanStalePidFile -CriticalTestMode $CriticalTestMode

$healthOk = $false
try {
  $probe = Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec $TimeoutSeconds
  if ($probe.status -eq 'UP') {
    $healthOk = $true
  }
} catch {
  $healthOk = $false
}

if (-not $healthOk -and $RestartIfUnhealthy) {
  Write-Host 'Service is not healthy. Running restart and waiting for UP...'
  & powershell -ExecutionPolicy Bypass -File $devRestartScript -HealthUrl $HealthUrl -Retries $Retries -DelaySeconds $DelaySeconds -TimeoutSeconds $TimeoutSeconds -Port $Port
  $healthOk = $true
}

if ($RunPortalCriticalTests) {
  $criticalArgs = @('-ExecutionPolicy', 'Bypass', '-File', $criticalScript, '-Mode', $CriticalTestMode)
  if ($SummaryJson) { $criticalArgs += '-SummaryJson' }
  if ($SummaryJsonPath) { $criticalArgs += @('-SummaryJsonPath', $SummaryJsonPath) }
  & powershell @criticalArgs
}

if ($FailOnUnhealthy -and -not $healthOk) {
  throw "Service health is not UP and no successful recovery was completed. URL=$HealthUrl"
}

Write-Host 'Healing flow completed.'

