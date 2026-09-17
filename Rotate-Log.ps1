#
# Rotate-Log.ps1
# Rotates a log file if it exceeds $MaxSizeMB.
# Keeps up to $MaxArchives timestamped copies in the same directory.
# Deletes oldest archives when limit is exceeded.
#
param(
  [Parameter(Mandatory)][string]$LogFile,
  [int]$MaxSizeMB = 5,
  [int]$MaxArchives = 5
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $LogFile)) {
  return
}

$sizeMB = (Get-Item $LogFile).Length / 1MB

if ($sizeMB -lt $MaxSizeMB) {
  return
}

$logsDir = Split-Path -Parent $LogFile
$baseName = [System.IO.Path]::GetFileNameWithoutExtension($LogFile)
$ext = [System.IO.Path]::GetExtension($LogFile)
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$archiveName = "${baseName}.${timestamp}${ext}"
$archivePath = Join-Path $logsDir $archiveName

Move-Item -Path $LogFile -Destination $archivePath
Write-Host "Rotated log to $archiveName ($([math]::Round($sizeMB, 2)) MB)"

# Remove oldest archives beyond $MaxArchives
$archives = Get-ChildItem -Path $logsDir -Filter "${baseName}.*${ext}" |
  Where-Object { $_.Name -ne (Split-Path -Leaf $LogFile) } |
  Sort-Object LastWriteTime -Descending

if ($archives.Count -gt $MaxArchives) {
  $archives | Select-Object -Skip $MaxArchives | ForEach-Object {
    Remove-Item -Path $_.FullName -Force
    Write-Host "Removed old archive $($_.Name)"
  }
}

