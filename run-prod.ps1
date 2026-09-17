param(
  [switch]$DryRun,
  [switch]$SkipFrontendBuild
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$jdkHome = 'C:\Users\chq-berehanet\installs\lib\sdkman\candidates\java\17.0.12-zulu'

if (-not (Test-Path "$jdkHome\bin\java.exe")) {
  throw "Java not found at $jdkHome. Update run-prod.ps1 with your installed JDK path."
}

$env:JAVA_HOME = $jdkHome
Set-Location $projectRoot

$clientRoot = Join-Path $projectRoot 'client'
$frontendStaticOutput = Join-Path $projectRoot 'target\classes\static'

$logsDir = Join-Path $projectRoot 'logs'
$logFile = Join-Path $logsDir 'prod-app.log'
if (-not (Test-Path $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir | Out-Null
}

# Rotate existing log if it exceeds 5 MB; keep up to 5 archives.
& powershell -ExecutionPolicy Bypass -File (Join-Path $projectRoot 'Rotate-Log.ps1') -LogFile $logFile

$command = '.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=prod"'

Write-Host "JAVA_HOME=$($env:JAVA_HOME)"
Write-Host "Working directory=$projectRoot"
Write-Host "Frontend directory=$clientRoot"
Write-Host "SkipFrontendBuild=$SkipFrontendBuild"
Write-Host "Command=$command"
Write-Host "Log file=$logFile"

if ($DryRun) {
  Write-Host 'DryRun enabled. Command not executed.'
  exit 0
}

if (-not $SkipFrontendBuild) {
  Write-Host 'Building Angular frontend for backend static hosting...'
  Push-Location $clientRoot
  try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
      throw "Frontend build failed with exit code $LASTEXITCODE"
    }
  }
  finally {
    Pop-Location
  }
}

if (Test-Path $frontendStaticOutput) {
  Write-Host "Clearing stale static output at $frontendStaticOutput"
  Remove-Item -Path $frontendStaticOutput -Recurse -Force
}

& .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=prod" 2>&1 | Tee-Object -FilePath $logFile

exit $LASTEXITCODE

