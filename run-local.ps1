param(
  [switch]$DryRun,
  [switch]$SkipFrontendBuild
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$jdkHome = 'C:\Users\chq-berehanet\installs\lib\sdkman\candidates\java\17.0.12-zulu'

if (-not (Test-Path "$jdkHome\bin\java.exe")) {
  throw "Java not found at $jdkHome. Update run-local.ps1 with your installed JDK path."
}

$env:JAVA_HOME = $jdkHome
Set-Location $projectRoot

$clientRoot = Join-Path $projectRoot 'client'
$frontendStaticOutput = Join-Path $projectRoot 'target\classes\static'

$logsDir = Join-Path $projectRoot 'logs'
$logFile = Join-Path $logsDir 'local-app.log'
if (-not (Test-Path $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir | Out-Null
}

# Rotate existing log if it exceeds 5 MB; keep up to 5 archives.
& powershell -ExecutionPolicy Bypass -File (Join-Path $projectRoot 'Rotate-Log.ps1') -LogFile $logFile

$command = '.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"'

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

if ($PSVersionTable.PSVersion.Major -ge 7) {
  & .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local" 2>&1 | Tee-Object -FilePath $logFile -Encoding utf8
}
else {
  # PowerShell 5.1: Tee-Object has no -Encoding, so force UTF-8 file writes manually.
  & .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local" 2>&1 | ForEach-Object {
    Write-Host $_
    $_ | Out-File -FilePath $logFile -Encoding utf8 -Append
  }
}

exit $LASTEXITCODE

