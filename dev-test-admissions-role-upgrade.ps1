param(
  [string]$BaseUrl = 'http://localhost:8080',
  [string]$AdminEmail = 'admin@school.com',
  [string]$AdminPassword = 'Admin123!',
  [string]$TeacherPassword = '@Teacher123',
  [switch]$SkipTeacherScenario,
  [switch]$SummaryJson,
  [string]$SummaryJsonPath,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$summary = [ordered]@{
  script = 'dev-test-admissions-role-upgrade.ps1'
  baseUrl = $BaseUrl
  adminEmail = $AdminEmail
  skipTeacherScenario = [bool]$SkipTeacherScenario
  dryRun = [bool]$DryRun
  status = 'running'
  steps = @()
  timestampUtc = [DateTime]::UtcNow.ToString('o')
}

function Add-Step {
  param(
    [string]$Name,
    [string]$Status,
    [string]$Detail
  )
  $summary.steps += [ordered]@{
    name = $Name
    status = $Status
    detail = $Detail
  }
}

function Write-SummaryJson {
  param([object]$Data)

  $json = $Data | ConvertTo-Json -Depth 8 -Compress

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

function Invoke-ApiJson {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Uri,
    [hashtable]$Headers,
    [object]$Body
  )

  $request = @{
    Method = $Method
    Uri = $Uri
    ContentType = 'application/json'
  }

  if ($Headers) {
    $request.Headers = $Headers
  }

  if ($null -ne $Body) {
    $request.Body = ($Body | ConvertTo-Json -Depth 8)
  }

  return Invoke-RestMethod @request
}

Write-Host "BaseUrl=$BaseUrl"
Write-Host "AdminEmail=$AdminEmail"
Write-Host "SkipTeacherScenario=$([bool]$SkipTeacherScenario)"

if ($DryRun) {
  Add-Step -Name 'dry-run' -Status 'passed' -Detail 'DryRun enabled. No API calls were made.'
  $summary.status = 'passed'
  Write-SummaryJson -Data $summary
  exit 0
}

try {
  $health = Invoke-RestMethod -Method Get -Uri "$BaseUrl/actuator/health"
  if ($health.status -ne 'UP') {
    throw "Health endpoint did not return UP. Status=$($health.status)"
  }
  Add-Step -Name 'health-check' -Status 'passed' -Detail 'Backend health is UP.'

  $login = Invoke-ApiJson -Method 'Post' -Uri "$BaseUrl/api/auth/login" -Body @{
    email = $AdminEmail
    password = $AdminPassword
  }

  if (-not $login.accessToken) {
    throw 'Admin login did not return accessToken.'
  }

  $authHeaders = @{ Authorization = "Bearer $($login.accessToken)" }
  Add-Step -Name 'admin-login' -Status 'passed' -Detail "Admin login succeeded for $AdminEmail."

  $timestamp = Get-Date -Format 'yyyyMMddHHmmss'

  $adminEnroll1 = Invoke-ApiJson -Method 'Post' -Uri "$BaseUrl/api/admin/admissions/enroll" -Headers $authHeaders -Body @{
    guardianFirstName = 'Admin'
    guardianLastName = 'Parent'
    guardianPhone = '555-1201'
    guardianEmail = $AdminEmail
    guardianPassword = $AdminPassword
    studentFirstName = 'AdminKidOne'
    studentLastName = $timestamp
    studentPassword = '@AdminKid123'
    studentGender = 'MALE'
    studentAge = 10
    studentGrade = '5'
  }

  $adminRoles1 = @($adminEnroll1.guardian.roles)
  if (-not ($adminRoles1 -contains 'ADMIN' -and $adminRoles1 -contains 'GUARDIAN')) {
    throw "Admin role-upgrade assertion failed. Roles=$($adminRoles1 -join ',')"
  }
  Add-Step -Name 'admin-role-upgrade-enroll' -Status 'passed' -Detail "Admin user has roles: $($adminRoles1 -join ', ')."

  $adminEnroll2 = Invoke-ApiJson -Method 'Post' -Uri "$BaseUrl/api/admin/admissions/enroll" -Headers $authHeaders -Body @{
    guardianFirstName = 'Admin'
    guardianLastName = 'Parent'
    guardianPhone = '555-1201'
    guardianEmail = $AdminEmail
    guardianPassword = $AdminPassword
    studentFirstName = 'AdminKidTwo'
    studentLastName = $timestamp
    studentPassword = '@AdminKid456'
    studentGender = 'FEMALE'
    studentAge = 8
    studentGrade = '3'
  }

  if (-not $adminEnroll2.student.email) {
    throw 'Second admin-child enrollment failed to return student email.'
  }
  Add-Step -Name 'admin-second-child-enroll' -Status 'passed' -Detail "Second child enrolled: $($adminEnroll2.student.email)"

  if (-not $SkipTeacherScenario) {
    $teacherEmail = "teacher.rolepack.$timestamp@test.local"

    $teacherUser = Invoke-ApiJson -Method 'Post' -Uri "$BaseUrl/api/admin/users" -Headers $authHeaders -Body @{
      email = $teacherEmail
      password = $TeacherPassword
      roles = @('TEACHER')
      name = 'RolePack Teacher'
      subject = 'Science'
    }

    if (-not $teacherUser.id) {
      throw 'Teacher seed creation failed.'
    }

    $teacherEnroll = Invoke-ApiJson -Method 'Post' -Uri "$BaseUrl/api/admin/admissions/enroll" -Headers $authHeaders -Body @{
      guardianFirstName = 'Teacher'
      guardianLastName = 'Parent'
      guardianPhone = '555-1301'
      guardianEmail = $teacherEmail
      guardianPassword = $TeacherPassword
      studentFirstName = 'TeacherKid'
      studentLastName = $timestamp
      studentPassword = '@TeacherKid123'
      studentGender = 'MALE'
      studentAge = 9
      studentGrade = '4'
    }

    $teacherRoles = @($teacherEnroll.guardian.roles)
    if (-not ($teacherRoles -contains 'TEACHER' -and $teacherRoles -contains 'GUARDIAN')) {
      throw "Teacher role-upgrade assertion failed. Roles=$($teacherRoles -join ',')"
    }

    Add-Step -Name 'teacher-role-upgrade-enroll' -Status 'passed' -Detail "Teacher user upgraded with roles: $($teacherRoles -join ', ')."
  }

  $summary.status = 'passed'
  Write-SummaryJson -Data $summary
  Write-Host 'Admissions role-upgrade test passed.'
  exit 0
} catch {
  $message = $_.Exception.Message
  Add-Step -Name 'failure' -Status 'failed' -Detail $message
  $summary.status = 'failed'
  $summary.error = $message
  Write-SummaryJson -Data $summary
  Write-Error "Admissions role-upgrade test failed: $message"
  exit 1
}

