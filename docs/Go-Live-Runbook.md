# Go-Live Runbook

## 1) Start
- announce deployment start
- confirm release owner and rollback owner

## 2) Deploy Backend
- deploy backend artifact
- check logs
- verify `/actuator/health` is `UP`

## 3) Deploy Frontend
- publish frontend build
- verify app loads

## 4) Validate Core Flows
- login works
- dashboard routing works by role
- admin routes protected correctly
- targeted admin filter unit tests pass:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School\client"
npm run test:admin-filters
```

- targeted teacher core unit tests pass:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School\client"
npm run test:teacher-core
```

- combined portal critical tests pass:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School\client"
npm run test:portal-critical
```

- focused filter behavior tests pass (Guardian + Teacher submissions):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-test-filters.ps1
```

Optional helper (from repo root):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-test-critical.ps1
```

Optional role-module helper mode:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-test-critical.ps1 -Mode role-pack
```

Optional one-command recover + validate helper (from repo root):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-heal.ps1 -RestartIfUnhealthy -RunPortalCriticalTests -FailOnUnhealthy
```

Optional role-pack mode with same helper:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-heal.ps1 -RunPortalCriticalTests -CriticalTestMode role-pack
```

Optional role-pack mode with summary artifact:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-heal.ps1 -RunPortalCriticalTests -CriticalTestMode role-pack -SummaryJsonPath .\logs\heal-summary.json
```

Optional strict release gate helper (auto-fails on unhealthy or test failures):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-release-check.ps1 -Mode portal-critical -RestartIfUnhealthy
```

Optional strict role-pack gate:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-release-check.ps1 -Mode role-pack
```

Optional JSON summary artifact output:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-release-check.ps1 -Mode portal-critical -SummaryJsonPath .\logs\release-check-summary.json
```

## 5) Monitor
- watch error rates and auth failures for first 1-2 hours

## 6) Rollback (if needed)
- redeploy previous backend/frontend versions
- restore DB only if required
- re-run smoke checks

## Last Updated
- 2026-05-11

