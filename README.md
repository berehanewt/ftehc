# FTEHC

## Contents

- [Test Credentials](#test-credentials)
- [Run Profiles (Spring Boot)](#run-profiles-spring-boot)
- [Frontend Dev (`localhost:4200`)](#frontend-dev-localhost4200)
- [Frontend Test Quick Checks](#frontend-test-quick-checks)
- [Dev Scripts (Windows PowerShell)](#dev-scripts-windows-powershell)
- [Script Reference](#script-reference)

## Test Credentials

Use the following test accounts to explore the application. These are automatically created when the backend starts with the admin seed credentials.

### Admin Account
- **Email:** `admin@ftehcschool.com`
- **Password:** `@Admin123`
- **Role:** ADMIN
- **Access:** User management, admissions enrollment, class management, audit logs

### Guardian Account
- **Email:** `guardian@ftehcschool.com`
- **Password:** `@Guardian123`
- **Role:** GUARDIAN
- **Access:** Child progress monitoring, homework overview, submissions, announcements, documents

### Student Account
- **Email:** `student.test@student.ftehc.local`
- **Password:** `@Student123`
- **Role:** STUDENT
- **Access:** Homework assignments, submissions, announcements, documents, profile
- **Note:** This student is linked to the Guardian account above

### Creating Custom Test Accounts

To create additional test Guardian + Student pairs via the UI:
1. Login as Admin
2. Navigate to **Admin Dashboard → Admissions**
3. Fill in guardian and student information:

**Guardian Fields:**
- **First Name** (required) - e.g., "Tesfaye"
- **Middle Name** (optional) - e.g., "Mohamed"
- **Last Name** (required) - e.g., "Haile"
- **Telephone Number** (required)
- **Email** (required)
- **Spouse First Name** (optional)
- **Spouse Middle Name** (optional)
- **Spouse Last Name** (optional)
- **Relationship to Student** (optional)
- **Portal Password** (required, minimum 6 characters)

**Student Fields:**
- **First Name** (required) - e.g., "Abel"
- **Middle Name** (optional) - e.g., "Tadesse"
- **Last Name** (required) - e.g., "Kebede"
- **Age** (required)
- **Gender** (required - Male/Female)
- **Grade/Class Level** (optional)
- **Portal Password** (required, minimum 6 characters)

4. Click **"Enroll Guardian & Student"**

The system will automatically:
- Build guardian's full name from first, middle, and last name
- Generate a student email in the format: `firstname.lastname@student.ftehc.local`
- Create the linked guardian-student relationship

## Run Profiles (Spring Boot)

Use explicit profiles so actuator behavior matches the environment.

- `local`: verbose health output for debugging
- `prod`: restricted health output for safer production defaults

### Local Run (recommended for development)

`run-local.ps1` now builds the Angular app and lets Spring Boot serve it on `http://localhost:8080`, so local login can work from the backend port directly.

```powershell
$env:JAVA_HOME = 'C:\Users\chq-berehanet\installs\lib\sdkman\candidates\java\17.0.12-zulu'
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\run-local.ps1
```

Optional: skip the frontend rebuild when you only need backend changes and already have a valid built frontend bundle or separate `4200` frontend running.

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\run-local.ps1 -SkipFrontendBuild
```

### Production-like Run

`run-prod.ps1` follows the same one-port pattern and builds the Angular frontend before starting Spring Boot with the `prod` profile.

```powershell
$env:JAVA_HOME = 'C:\Users\chq-berehanet\installs\lib\sdkman\candidates\java\17.0.12-zulu'
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\run-prod.ps1
```

Optional: skip rebuilding the frontend when a fresh bundle already exists.

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\run-prod.ps1 -SkipFrontendBuild
```

### Health Check

```powershell
curl.exe http://localhost:8080/actuator/health
```

### Troubleshooting: Mail health shows DOWN on local

If you see errors similar to `MailConnectException` / `Connection refused` for `localhost:1025`, Spring is trying to probe SMTP but no local mail server (for example MailHog) is running.

- Local/default runs now keep mail health disabled by default in `src/main/resources/application.properties`.
- Production keeps mail health enabled in `src/main/resources/application-prod.properties`.

Quick recovery (restart local profile and re-check health):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-down.ps1 -ForceByPort -Port 8080
powershell -ExecutionPolicy Bypass -File .\run-local.ps1 -SkipFrontendBuild
curl.exe -s -i "http://localhost:8080/actuator/health"
```

Temporary override (current shell only):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
$env:MANAGEMENT_HEALTH_MAIL_ENABLED="false"
.\mvnw.cmd spring-boot:run
```

## Frontend Dev (`localhost:4200`)

Use the Angular app in `client/` for local frontend development.

```powershell
# terminal 1 (backend)
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-up.ps1

# terminal 2 (frontend)
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School\client"
npm start
```

- Frontend URL: `http://localhost:4200`
- API calls use `/api` and are proxied to `http://localhost:8080` via `client/proxy.conf.json`.
- See `client/README.md` for frontend troubleshooting and proxy details.

## Frontend Test Quick Checks

Run this targeted test suite before merging Admin enrollment/guardian UI changes:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School\client"
npm run test:admin-filters
```

Run this targeted test suite before merging Teacher homework/submissions UI changes:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School\client"
npm run test:teacher-core
```

Run this targeted deep-link monitor pack (Teacher + Student + Guardian):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School\client"
npm run test:deeplink-monitor-pack
```

Run this consolidated role-module suite (Teacher + Student + Guardian):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School\client"
npm run test:role-pack
```

Run this focused filter-behavior suite (Guardian + Teacher submissions):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School\client"
npm run test:filters-pack
```

Or run the root helper for filter tests:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-test-filters.ps1
```

Run this combined critical suite before go-live signoff (Admin + Teacher + Student + Guardian):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School\client"
npm run test:portal-critical
```

Or run the root helper script:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-test-critical.ps1
```

Run role-module scope using the same helper:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-test-critical.ps1 -Mode role-pack
```

Run admissions role-upgrade smoke test (verifies `ADMIN+GUARDIAN`, multiple kids, and optional `TEACHER+GUARDIAN`):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-test-admissions-role-upgrade.ps1
```

Git Bash shortcut:

```bash
cd /c/Users/chq-berehanet/DBKG/FTEHC-School
bash ./dev-test-admissions-role-upgrade.sh
```

## Dev Scripts (Windows PowerShell)

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\run-local.ps1
```

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\run-prod.ps1
```

Use `-DryRun` to print the command without starting the app.

### Health Smoke Check

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\check-health.ps1
```

Custom example (faster fail):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\check-health.ps1 -Retries 3 -DelaySeconds 1 -TimeoutSeconds 3
```

### Dev Startup

This starts local Spring Boot only when needed, builds the Angular frontend for one-port local access on `8080`, then waits for health status `UP`.

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-up.ps1
```

Git Bash shortcut:

```bash
cd /c/Users/chq-berehanet/DBKG/FTEHC-School
bash ./dev-up.sh
```

Native shell options (Git Bash / Linux / macOS):

```bash
cd /c/Users/chq-berehanet/DBKG/FTEHC-School
bash ./run-local.sh --dry-run
bash ./dev-up.sh --skip-frontend-build
```

- `run-local.sh` mirrors the local startup flow from `run-local.ps1`.
- `dev-up.sh` uses `run-local.sh`, writes `.dev-up.pid`, and waits for actuator health `UP`.
- On Unix-like servers, make the scripts executable once if needed:

```bash
chmod +x ./run-local.sh ./check-health.sh ./dev-up.sh ./dev-down.sh
```

Preview only (no process start):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-up.ps1 -DryRun
```

### Dev Stop

Stops the process started by `dev-up.ps1` using tracked PID file `.dev-up.pid`.

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-down.ps1
```

Git Bash / Unix shell:

```bash
cd /c/Users/chq-berehanet/DBKG/FTEHC-School
bash ./dev-down.sh
```

Fallback by port (if no PID file exists):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-down.ps1 -ForceByPort -Port 8080
```

Shell fallback:

```bash
cd /c/Users/chq-berehanet/DBKG/FTEHC-School
bash ./dev-down.sh --force-by-port --port 8080
```

### Dev Restart

Performs stop + start and waits for health status `UP`.

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-restart.ps1
```

Preview only (no stop/start):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-restart.ps1 -DryRun
```

### Dev Status

Shows PID file status, tracked process, listener on port 8080, and actuator health.

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-status.ps1
```

Run status checks and critical frontend tests in one command:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-status.ps1 -RunPortalCriticalTests
```

Run status checks with role-pack critical scope:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-status.ps1 -RunPortalCriticalTests -CriticalTestMode role-pack
```

Clean stale tracked PID file (if process is no longer running):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-status.ps1 -CleanStalePidFile
```

Return non-zero when health is not `UP` (for CI/release gates):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-status.ps1 -FailOnUnhealthy
```

### Dev Heal

Run stale PID cleanup + status checks, and optionally recover unhealthy state:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-heal.ps1 -RestartIfUnhealthy -RunPortalCriticalTests -FailOnUnhealthy
```

Use role-module critical scope with the same helper:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-heal.ps1 -RunPortalCriticalTests -CriticalTestMode role-pack
```

Emit CI-friendly summary JSON from the same heal flow:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-heal.ps1 -RunPortalCriticalTests -CriticalTestMode role-pack -SummaryJsonPath .\logs\heal-summary.json
```

### Dev Release Check

Run strict release gate checks (health must be `UP` and selected critical suite must pass):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-release-check.ps1 -Mode portal-critical -RestartIfUnhealthy
```

Faster role-module gate:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-release-check.ps1 -Mode role-pack
```

Include admissions role-upgrade backend smoke gate (verifies `ADMIN/TEACHER -> +GUARDIAN` and multi-kid enrollment):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-release-check.ps1 -Mode role-pack -RunAdmissionsRoleUpgradeTest
```

Use a custom health endpoint URL if needed:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-release-check.ps1 -Mode portal-critical -HealthUrl http://localhost:8080/actuator/health
```

Emit machine-readable JSON summary (for CI parsing):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-release-check.ps1 -Mode portal-critical -SummaryJson
```

Write summary JSON to file artifact:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-release-check.ps1 -Mode role-pack -SummaryJsonPath .\logs\release-check-summary.json
```

Preview only:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-heal.ps1 -RestartIfUnhealthy -RunPortalCriticalTests -DryRun
```

Preview only:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-status.ps1 -DryRun
```

### Dev Logs

Print latest local profile logs (default 80 lines):

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-logs.ps1
```

Follow logs continuously:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-logs.ps1 -Follow
```

Read prod profile log file:

```powershell
Set-Location "C:\Users\chq-berehanet\DBKG\FTEHC-School"
powershell -ExecutionPolicy Bypass -File .\dev-logs.ps1 -Profile prod -Lines 120
```

### Notes

- Local profile file: `src/main/resources/application-local.properties`
- Production profile file: `src/main/resources/application-prod.properties`
- Shared defaults: `src/main/resources/application.properties`
- Local app log: `logs/local-app.log`
- Prod app log: `logs/prod-app.log`
- Log rotation: auto-rotated at 5 MB per run; up to 5 timestamped archives kept in `logs/`
- Rotation helper: `Rotate-Log.ps1` (called automatically by `run-local.ps1` and `run-prod.ps1`)

## Script Reference

| Script | Purpose |
| --- | --- |
| `run-local.ps1` | Start with local profile + log capture + rotation |
| `run-prod.ps1` | Start with prod profile + log capture + rotation |
| `dev-up.ps1` | Start only if not already running, wait for `UP` |
| `dev-down.ps1` | Stop tracked process tree or fallback by port |
| `dev-restart.ps1` | Stop + Start + wait for `UP` |
| `dev-status.ps1` | Show PID, port owner, actuator health (+ optional critical frontend tests) |
| `dev-logs.ps1` | Tail log file (optional follow) |
| `dev-test-critical.ps1` | Run frontend critical tests (`portal-critical` or `role-pack`) |
| `dev-test-admissions-role-upgrade.ps1` | Run backend admissions smoke tests for role upgrades (`ADMIN/TEACHER -> +GUARDIAN`) |
| `dev-test-filters.ps1` | Run focused Guardian+Teacher filter behavior tests |
| `dev-heal.ps1` | Clean stale PID + optional restart + optional critical tests |
| `dev-release-check.ps1` | Strict release gate using dev-heal + fail-on-unhealthy |
| `check-health.ps1` | Smoke check actuator endpoint with retries |
| `Rotate-Log.ps1` | Rotate log by size, keep N archives |

## Full shell script suite now available

| PowerShell | Shell | Git Bash |
| --- | --- | --- |
| `run-local.ps1` | `run-local.sh` | `bash ./run-local.sh` |
| `run-prod.ps1` | `run-prod.sh` | `bash ./run-prod.sh` |
| `dev-up.ps1` | `dev-up.sh` | `bash ./dev-up.sh` |
| `dev-down.ps1` | `dev-down.sh` | `bash ./dev-down.sh` |
| `dev-restart.ps1` | `dev-restart.sh` | `bash ./dev-restart.sh` |
| `dev-status.ps1` | `dev-status.sh` | `bash ./dev-status.sh` |
| `dev-test-admissions-role-upgrade.ps1` | `dev-test-admissions-role-upgrade.sh` | `bash ./dev-test-admissions-role-upgrade.sh` |

All shell scripts support `--help` to show available options. Example:

```bash
bash ./dev-up.sh --help
bash ./dev-restart.sh --help
bash ./run-local.sh --help
```

On Unix/Linux servers, make scripts executable once:

```bash
chmod +x ./run-local.sh ./run-prod.sh ./dev-up.sh ./dev-down.sh ./dev-restart.sh ./dev-status.sh ./check-health.sh
```

