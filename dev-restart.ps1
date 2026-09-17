param(
  [string]$HealthUrl = 'http://localhost:8080/actuator/health',
  [int]$Retries = 60,
  [int]$DelaySeconds = 2,
  [int]$TimeoutSeconds = 5,
  [int]$Port = 8080,
  [switch]$SkipFrontendBuild,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$devDownScript = Join-Path $projectRoot 'dev-down.ps1'
$devUpScript = Join-Path $projectRoot 'dev-up.ps1'

if (-not (Test-Path $devDownScript)) {
  throw "Missing script: $devDownScript"
}

if (-not (Test-Path $devUpScript)) {
  throw "Missing script: $devUpScript"
}

Write-Host "Project root=$projectRoot"
Write-Host "Restart target URL=$HealthUrl"

$downTrackedCommand = "powershell -ExecutionPolicy Bypass -File `"$devDownScript`""
$downPortCommand = "powershell -ExecutionPolicy Bypass -File `"$devDownScript`" -ForceByPort -Port $Port"
$upCommand = "powershell -ExecutionPolicy Bypass -File `"$devUpScript`" -HealthUrl `"$HealthUrl`" -Retries $Retries -DelaySeconds $DelaySeconds -TimeoutSeconds $TimeoutSeconds"
if ($SkipFrontendBuild) {
  $upCommand += ' -SkipFrontendBuild'
}

Write-Host "Planned stop (tracked)=$downTrackedCommand"
Write-Host "Planned stop (port)=$downPortCommand"
Write-Host "Planned start=$upCommand"

if ($DryRun) {
  Write-Host 'DryRun enabled. No process will be stopped or started.'
  & powershell -ExecutionPolicy Bypass -File $devDownScript -DryRun
  $dryUpArgs = @(
    '-ExecutionPolicy', 'Bypass', '-File', $devUpScript,
    '-DryRun',
    '-HealthUrl', $HealthUrl,
    '-Retries', $Retries,
    '-DelaySeconds', $DelaySeconds,
    '-TimeoutSeconds', $TimeoutSeconds
  )
  if ($SkipFrontendBuild) {
    $dryUpArgs += '-SkipFrontendBuild'
  }
  & powershell $dryUpArgs
  exit 0
}

# Prefer tracked shutdown, then fallback by port when needed.
& powershell -ExecutionPolicy Bypass -File $devDownScript
& powershell -ExecutionPolicy Bypass -File $devDownScript -ForceByPort -Port $Port

# Start app and wait for healthy state.
$upArgs = @(
  '-ExecutionPolicy', 'Bypass', '-File', $devUpScript,
  '-HealthUrl', $HealthUrl,
  '-Retries', $Retries,
  '-DelaySeconds', $DelaySeconds,
  '-TimeoutSeconds', $TimeoutSeconds
)
if ($SkipFrontendBuild) {
  $upArgs += '-SkipFrontendBuild'
}
& powershell $upArgs

