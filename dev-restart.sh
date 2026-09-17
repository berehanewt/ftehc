#!/usr/bin/env bash
set -euo pipefail

# ── defaults ─────────────────────────────────────────────────────────────────
port=8080
auto_port=false
health_url=""
retries=60
delay_seconds=2
timeout_seconds=5
dry_run=false
skip_frontend_build=false
no_frontend_redirect=false
kill_conflicting=false

usage() {
  cat <<'EOF'
Usage: ./dev-restart.sh [options]

Stops any running local app instance then starts a fresh one.

Options:
  --port N                         App server port. Default: 8080
  --auto-port                      Scan 8080–8099 and pick the first free port after stop.
  --health-url URL                 Override health endpoint URL entirely.
  --retries N                      Health check retries after start. Default: 60
  --delay-seconds N                Delay between retries. Default: 2
  --timeout-seconds N              HTTP timeout per attempt. Default: 5
  --skip-frontend-build            Skip Angular rebuild.
  --no-frontend-redirect           Serve UI from backend port instead of redirecting to 4200.
  --kill-conflicting-port-process  Auto-stop any stale process on the selected port.
  --dry-run                        Print what would run without changing anything.
  -h, --help                       Show this help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)             port="$2";            shift 2 ;;
    --auto-port)        auto_port=true;       shift   ;;
    --health-url)       health_url="$2";      shift 2 ;;
    --retries)          retries="$2";         shift 2 ;;
    --delay-seconds)    delay_seconds="$2";   shift 2 ;;
    --timeout-seconds)  timeout_seconds="$2"; shift 2 ;;
    --skip-frontend-build)           skip_frontend_build=true;  shift ;;
    --no-frontend-redirect)          no_frontend_redirect=true; shift ;;
    --kill-conflicting-port-process) kill_conflicting=true;     shift ;;
    --dry-run)          dry_run=true;         shift   ;;
    -h|--help)          usage; exit 0         ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 1 ;;
  esac
done

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Project root=$script_dir"

# ── stop existing instance ────────────────────────────────────────────────────
down_args=(--force-by-port --port "$port")
[[ "$dry_run" == true ]] && down_args+=(--dry-run)
echo "Planned stop=bash \"$script_dir/dev-down.sh\" ${down_args[*]}"
bash "$script_dir/dev-down.sh" "${down_args[@]}"

# ── start fresh ───────────────────────────────────────────────────────────────
up_args=(--port "$port")
[[ "$auto_port"           == true ]] && up_args+=(--auto-port)
[[ -n "$health_url"              ]] && up_args+=(--health-url "$health_url")
[[ "$skip_frontend_build" == true ]] && up_args+=(--skip-frontend-build)
[[ "$no_frontend_redirect" == true ]] && up_args+=(--no-frontend-redirect)
[[ "$kill_conflicting"    == true ]] && up_args+=(--kill-conflicting-port-process)
[[ "$dry_run"             == true ]] && up_args+=(--dry-run)
up_args+=(--retries "$retries" --delay-seconds "$delay_seconds" --timeout-seconds "$timeout_seconds")

echo "Planned start=bash \"$script_dir/dev-up.sh\" ${up_args[*]}"

bash "$script_dir/dev-up.sh" "${up_args[@]}"

