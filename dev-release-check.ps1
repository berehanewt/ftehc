param(
  [ValidateSet('portal-critical', 'role-pack')]
  [string]$Mode = 'portal-critical',
  [string]$HealthUrl = 'http://localhost:8080/actuator/health',
  [switch]$RestartIfUnhealthy,
  [switch]$RunAdmissionsRoleUpgradeTest,
  [switch]$SummaryJson,
  [string]$SummaryJsonPath,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$healScript = Join-Path $projectRoot 'dev-heal.ps1'
$admissionsRoleUpgradeScript = Join-Path $projectRoot 'dev-test-admissions-role-upgrade.ps1'

if (-not (Test-Path $healScript)) {
  throw "Missing script: $healScript"
}

if ($RunAdmissionsRoleUpgradeTest -and -not (Test-Path $admissionsRoleUpgradeScript)) {
  throw "Missing script: $admissionsRoleUpgradeScript"
}

Write-Host "Project root=$projectRoot"
Write-Host "Mode=$Mode"
Write-Host "HealthUrl=$HealthUrl"
Write-Host "RestartIfUnhealthy=$RestartIfUnhealthy"
Write-Host "RunAdmissionsRoleUpgradeTest=$RunAdmissionsRoleUpgradeTest"
Write-Host "SummaryJson=$SummaryJson"
if ($SummaryJsonPath) {
  Write-Host "SummaryJsonPath=$SummaryJsonPath"
}

$summary = [ordered]@{
  script = 'dev-release-check.ps1'
  projectRoot = $projectRoot
  mode = $Mode
  criticalMode = $Mode
  healthUrl = $HealthUrl
  healthGateEnabled = $true
  admissionsRoleUpgradeGateEnabled = [bool]$RunAdmissionsRoleUpgradeTest
  restartIfUnhealthy = [bool]$RestartIfUnhealthy
  dryRun = [bool]$DryRun
  status = 'running'
  timestampUtc = [DateTime]::UtcNow.ToString('o')
}

function Write-SummaryJson {
  param([object]$Data)

  $json = $Data | ConvertTo-Json -Depth 4 -Compress

  if ($SummaryJson) {
    Write-Host $json
  }

  if ($SummaryJsonPath) {
    $targetPath = $SummaryJsonPath
    if (-not [System.IO.Path]::IsPathRooted($targetPath)) {
      $targetPath = Join-Path $projectRoot $targetPath
    }
    $targetPath = [System.IO.Path]::GetFullPath($targetPath)

    $targetDir = Split-Path -Parent $targetPath
    if ($targetDir -and -not (Test-Path $targetDir)) {
      New-Item -Path $targetDir -ItemType Directory -Force | Out-Null
    }

    Set-Content -Path $targetPath -Value $json -Encoding ascii
    Write-Host "Summary JSON written: $targetPath"
  }
}

$args = @(
  '-ExecutionPolicy', 'Bypass',
  '-File', $healScript,
  '-HealthUrl', $HealthUrl,
  '-RunPortalCriticalTests',
  '-CriticalTestMode', $Mode,
  '-FailOnUnhealthy'
)

if ($RestartIfUnhealthy) {
  $args += '-RestartIfUnhealthy'
}

if ($DryRun) {
  $args += '-DryRun'
}

& powershell @args
if ($LASTEXITCODE -ne 0) {
  $summary.status = 'failed'
  Write-SummaryJson -Data $summary
  throw "Release check failed. ExitCode=$LASTEXITCODE"
}

if ($RunAdmissionsRoleUpgradeTest) {
  $admissionsArgs = @(
    '-ExecutionPolicy', 'Bypass',
    '-File', $admissionsRoleUpgradeScript
  )

  if ($DryRun) {
    $admissionsArgs += '-DryRun'
  }

  & powershell @admissionsArgs
  if ($LASTEXITCODE -ne 0) {
    $summary.status = 'failed'
    Write-SummaryJson -Data $summary
    throw "Release check failed during admissions role-upgrade gate. ExitCode=$LASTEXITCODE"
  }
}

$summary.status = 'passed'
Write-SummaryJson -Data $summary

Write-Host 'Release check passed.'

