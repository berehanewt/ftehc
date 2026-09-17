param(
  [string]$Url = 'http://localhost:8080/actuator/health',
  [string]$ExpectedStatus = 'UP',
  [int]$Retries = 10,
  [int]$DelaySeconds = 2,
  [int]$TimeoutSeconds = 5,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

if ($Retries -lt 1) {
  throw 'Retries must be at least 1.'
}

$summary = "Health check: Url=$Url ExpectedStatus=$ExpectedStatus Retries=$Retries DelaySeconds=$DelaySeconds TimeoutSeconds=$TimeoutSeconds"
Write-Host $summary

if ($DryRun) {
  Write-Host 'DryRun enabled. Health endpoint was not called.'
  exit 0
}

for ($attempt = 1; $attempt -le $Retries; $attempt++) {
  try {
    $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec $TimeoutSeconds
    $status = $response.status

    Write-Host "Attempt $attempt/${Retries}: status=$status"

    if ($status -eq $ExpectedStatus) {
      Write-Host "Health is $status."
      exit 0
    }
  } catch {
    Write-Host "Attempt $attempt/${Retries} failed: $($_.Exception.Message)"
  }

  if ($attempt -lt $Retries) {
    Start-Sleep -Seconds $DelaySeconds
  }
}

Write-Error "Health check failed. Expected '$ExpectedStatus' from $Url after $Retries attempts."
exit 1

