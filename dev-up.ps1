param(
  [string]$HealthUrl = 'http://localhost:8080/actuator/health',
  [int]$Retries = 60,
  [int]$DelaySeconds = 2,
  [int]$TimeoutSeconds = 5,
  [switch]$SkipFrontendBuild,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$runLocalScript = Join-Path $projectRoot 'run-local.ps1'
$healthScript = Join-Path $projectRoot 'check-health.ps1'
$pidFile = Join-Path $projectRoot '.dev-up.pid'

if (-not (Test-Path $runLocalScript)) {
  throw "Missing script: $runLocalScript"
}

if (-not (Test-Path $healthScript)) {
  throw "Missing script: $healthScript"
}

Write-Host "Project root=$projectRoot"
Write-Host "Health URL=$HealthUrl"

$startCommand = "powershell -ExecutionPolicy Bypass -File `"$runLocalScript`""
if ($SkipFrontendBuild) {
  $startCommand += ' -SkipFrontendBuild'
}
Write-Host "Start command=$startCommand"

$alreadyUp = $false
try {
  $probe = Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec 2
  if ($probe.status -eq 'UP') {
    $alreadyUp = $true
  }
} catch {
  # Service is not available yet; start it below.
}

if ($DryRun) {
  if ($alreadyUp) {
    Write-Host 'DryRun: service is already UP. No new process would be started.'
  } else {
    Write-Host 'DryRun: service is not UP. The command above would be executed.'
  }
  Write-Host 'DryRun enabled. Service was not started.'
  exit 0
}

if ($alreadyUp) {
  Write-Host 'Service is already UP. No new process started.'
  exit 0
}

$startArgs = @('-ExecutionPolicy', 'Bypass', '-File', $runLocalScript)
if ($SkipFrontendBuild) {
  $startArgs += '-SkipFrontendBuild'
}

$proc = Start-Process -FilePath 'powershell' -ArgumentList $startArgs -PassThru
Write-Host "Started local app process. PID=$($proc.Id)"

# Track the process started by dev-up so dev-down can stop it safely.
Set-Content -Path $pidFile -Value $proc.Id -Encoding ascii
Write-Host "PID file=$pidFile"

& powershell -ExecutionPolicy Bypass -File $healthScript -Url $HealthUrl -ExpectedStatus 'UP' -Retries $Retries -DelaySeconds $DelaySeconds -TimeoutSeconds $TimeoutSeconds

