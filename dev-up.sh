#!/usr/bin/env bash
set -euo pipefail

health_url=""
port=8080
auto_port=false
retries=60
delay_seconds=2
timeout_seconds=5
dry_run=false
skip_frontend_build=false
no_frontend_redirect=false
kill_conflicting=false

usage() {
  cat <<'EOF'
Usage: ./dev-up.sh [options]

Options:
  --port N                       App server port. Default: 8080
  --auto-port                    Scan 8080–8099 and pick the first free port.
  --health-url URL               Override health endpoint URL entirely.
  --retries N                    Health check retries. Default: 60
  --delay-seconds N              Delay between retries. Default: 2
  --timeout-seconds N            HTTP timeout per attempt. Default: 5
  --skip-frontend-build          Skip Angular rebuild.
  --no-frontend-redirect         Disable redirect to Angular dev server (serve UI from backend port).
  --kill-conflicting-port-process  Auto-stop any process already listening on the selected port.
  --dry-run                      Print what would run without starting anything.
  -h, --help                     Show this help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)           port="$2";            shift 2 ;;
    --auto-port)      auto_port=true;       shift   ;;
    --health-url)     health_url="$2";      shift 2 ;;
    --retries)        retries="$2";         shift 2 ;;
    --delay-seconds)  delay_seconds="$2";   shift 2 ;;
    --timeout-seconds) timeout_seconds="$2"; shift 2 ;;
    --skip-frontend-build)       skip_frontend_build=true;  shift ;;
    --no-frontend-redirect)      no_frontend_redirect=true; shift ;;
    --kill-conflicting-port-process) kill_conflicting=true; shift ;;
    --dry-run)        dry_run=true;         shift   ;;
    -h|--help)        usage; exit 0         ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 1 ;;
  esac
done

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
run_local_script="$script_dir/run-local.sh"
health_script="$script_dir/check-health.sh"
pid_file="$script_dir/.dev-up.pid"

for required in "$run_local_script" "$health_script"; do
  if [[ ! -f "$required" ]]; then
    echo "Missing script: $required" >&2; exit 1
  fi
done

# ── helpers ──────────────────────────────────────────────────────────────────
extract_status() {
  sed -nE 's/.*"status"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' | head -n 1
}

port_is_free() {
  local p="$1"
  if command -v lsof >/dev/null 2>&1; then
    [[ -z "$(lsof -tiTCP:"$p" -sTCP:LISTEN 2>/dev/null)" ]]
  elif command -v ss >/dev/null 2>&1; then
    ! ss -ltn 2>/dev/null | grep -q ":${p} "
  elif command -v netstat >/dev/null 2>&1; then
    ! netstat -ano 2>/dev/null | grep -qiE "TCP.*:${p}\s.*LISTEN"
  else
    return 0  # assume free if no tool available
  fi
}

find_port_pid() {
  local p="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -tiTCP:"$p" -sTCP:LISTEN 2>/dev/null | head -n 1
  elif command -v ss >/dev/null 2>&1; then
    ss -ltnp 2>/dev/null | awk -v port=":${p}" '$4 ~ (port "$") { match($0,/pid=([0-9]+)/,m); if(m[1]) print m[1]; exit }'
  elif command -v netstat >/dev/null 2>&1; then
    netstat -ano 2>/dev/null | awk -v port=":${p}" 'BEGIN{IGNORECASE=1} $1~/^TCP/ && $2~(port"$") && $4~/(LISTEN|LISTENING)/{print $5; exit}'
  fi
}

# ── auto-port selection ──────────────────────────────────────────────────────
if [[ "$auto_port" == true ]]; then
  found_port=""
  for candidate in $(seq 8080 8099); do
    if port_is_free "$candidate"; then
      found_port="$candidate"
      break
    fi
  done
  if [[ -z "$found_port" ]]; then
    echo "AutoPort: no free port found in range 8080-8099." >&2; exit 1
  fi
  echo "AutoPort selected free port=$found_port"
  port="$found_port"
fi

# ── derive health URL from port (unless explicitly overridden) ───────────────
if [[ -z "$health_url" ]]; then
  health_url="http://localhost:${port}/actuator/health"
fi

echo "Project root=$script_dir"
echo "Effective Health URL=$health_url"
echo "Effective Port=$port"

# ── build start command ──────────────────────────────────────────────────────
start_command=(bash "$run_local_script" --port "$port")
[[ "$skip_frontend_build" == true ]] && start_command+=(--skip-frontend-build)
[[ "$no_frontend_redirect" == true ]] && start_command+=(--no-frontend-redirect)

echo "Start command=${start_command[*]}"

# ── already UP? → skip ───────────────────────────────────────────────────────
already_up=false
if response="$(curl -sS --max-time 2 "$health_url" 2>/dev/null || true)"; then
  current_status="$(printf '%s' "$response" | tr -d '\r\n' | extract_status)"
  if [[ "$current_status" == "UP" ]]; then
    already_up=true
  fi
fi

if [[ "$dry_run" == true ]]; then
  if [[ "$already_up" == true ]]; then
    echo 'DryRun: service is already UP. No new process would be started.'
  else
    echo 'DryRun: service is not UP. The command above would be executed.'
  fi
  echo 'DryRun enabled. Service was not started.'
  exit 0
fi

if [[ "$already_up" == true ]]; then
  echo 'Service is already UP. No new process started.'
  exit 0
fi

# ── port conflict check ──────────────────────────────────────────────────────
conflict_pid="$(find_port_pid "$port" || true)"
if [[ -n "$conflict_pid" ]]; then
  proc_name="$(ps -p "$conflict_pid" -o comm= 2>/dev/null || echo "unknown")"
  if [[ "$kill_conflicting" == true ]]; then
    if [[ "$dry_run" == true ]]; then
      echo "DryRun: would kill PID=$conflict_pid ($proc_name) listening on port $port."
    else
      echo "Killing conflicting process PID=$conflict_pid ($proc_name) on port $port..."
      kill "$conflict_pid" 2>/dev/null || kill -9 "$conflict_pid" 2>/dev/null || true
      sleep 1
      if ! port_is_free "$port"; then
        echo "Port $port still busy after kill. Aborting." >&2; exit 1
      fi
      echo "Port $port is now free."
    fi
  else
    echo "ERROR: Port $port is already in use by PID=$conflict_pid ($proc_name)." >&2
    echo "  → Run with --kill-conflicting-port-process to auto-stop it." >&2
    echo "  → Or use --port to pick a different port, or --auto-port to pick automatically." >&2
    exit 1
  fi
fi


# ── launch ───────────────────────────────────────────────────────────────────
if command -v nohup >/dev/null 2>&1; then
  nohup "${start_command[@]}" >/dev/null 2>&1 &
else
  "${start_command[@]}" >/dev/null 2>&1 &
fi

proc_pid=$!
echo "Started local app process. PID=$proc_pid"
printf '%s\n' "$proc_pid" > "$pid_file"
echo "PID file=$pid_file"

bash "$health_script" \
  --url "$health_url" \
  --expected-status UP \
  --retries "$retries" \
  --delay-seconds "$delay_seconds" \
  --timeout-seconds "$timeout_seconds"
