param(
  [switch]$SummaryJson,
  [string]$SummaryJsonPath,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$clientDir = Join-Path $projectRoot 'client'
$scriptName = 'test:filters-pack'
$command = "npm run $scriptName"

if (-not (Test-Path $clientDir)) {
  throw "Client directory not found: $clientDir"
}

Write-Host "Project root=$projectRoot"
Write-Host "Client dir=$clientDir"
Write-Host "Command=$command"
if ($SummaryJsonPath) {
  Write-Host "SummaryJsonPath=$SummaryJsonPath"
}

$summary = [ordered]@{
  script = 'dev-test-filters.ps1'
  projectRoot = $projectRoot
  testScript = $scriptName
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

if ($DryRun) {
  Write-Host 'DryRun enabled. No tests were executed.'
  $summary.status = 'passed'
  Write-SummaryJson -Data $summary
  exit 0
}

Push-Location $clientDir
try {
  & npm run $scriptName
  if ($LASTEXITCODE -ne 0) {
    $summary.status = 'failed'
    Write-SummaryJson -Data $summary
    throw "Filter test run failed. ExitCode=$LASTEXITCODE"
  }
  $summary.status = 'passed'
  Write-SummaryJson -Data $summary
  Write-Host 'Filter tests passed.'
} finally {
  Pop-Location
}

