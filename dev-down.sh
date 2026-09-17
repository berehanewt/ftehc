#!/usr/bin/env bash
set -euo pipefail

dry_run=false
force_by_port=false
port=8080

usage() {
  cat <<'EOF'
Usage: ./dev-down.sh [options]

Options:
  --dry-run                    Show what would be stopped without killing it.
  --force-by-port              If no PID file exists, stop the listener on the selected port.
  --port N                     Listener port used with --force-by-port. Default: 8080
  -h, --help                   Show this help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      dry_run=true
      shift
      ;;
    --force-by-port)
      force_by_port=true
      shift
      ;;
    --port)
      port="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pid_file="$project_root/.dev-up.pid"

echo "Project root=$project_root"
if [[ "$force_by_port" == true ]]; then
  echo "Mode=ForceByPort Port=$port"
else
  echo 'Mode=TrackedPid'
fi

kill_pid() {
  local target_pid="$1"
  local target_desc="${2:-PID=$target_pid}"

  if [[ "$dry_run" == true ]]; then
    echo "DryRun: would stop $target_desc"
    echo 'DryRun enabled. Process was not stopped.'
    return 0
  fi

  kill "$target_pid" 2>/dev/null || true
  for _ in {1..10}; do
    if ! kill -0 "$target_pid" 2>/dev/null; then
      return 0
    fi
    sleep 1
  done

  kill -9 "$target_pid" 2>/dev/null || true
}

find_port_pid() {
  local target_port="$1"

  if command -v lsof >/dev/null 2>&1; then
    lsof -tiTCP:"$target_port" -sTCP:LISTEN | head -n 1
    return
  fi

  if command -v netstat >/dev/null 2>&1; then
    netstat -ano 2>/dev/null | awk -v port=":${target_port}" '
      BEGIN { IGNORECASE = 1 }
      $1 ~ /^TCP/ {
        localAddr = $2
        state = $4
        pid = $5
        if (localAddr ~ (port "$") && (state == "LISTENING" || state == "LISTEN")) {
          print pid
          exit
        }
      }
    '
    return
  fi

  if command -v ss >/dev/null 2>&1; then
    ss -ltnp 2>/dev/null | awk -v port=":${target_port}" '
      $4 ~ (port "$") {
        if (match($0, /pid=([0-9]+)/, matchParts)) {
          print matchParts[1]
          exit
        }
      }
    '
  fi
}

if [[ -f "$pid_file" && "$force_by_port" != true ]]; then
  tracked_pid="$(tr -d '[:space:]' < "$pid_file")"
  if [[ ! "$tracked_pid" =~ ^[0-9]+$ ]]; then
    echo "Invalid PID file content in $pid_file: '$tracked_pid'" >&2
    exit 1
  fi

  if ! kill -0 "$tracked_pid" 2>/dev/null; then
    echo "Tracked process PID=$tracked_pid is not running."
    if [[ "$dry_run" == true ]]; then
      echo "DryRun: would remove stale PID file $pid_file"
      echo 'DryRun enabled. PID file was not removed.'
    else
      rm -f "$pid_file"
      echo 'Removed stale PID file.'
    fi
    exit 0
  fi

  echo "Tracked process found: PID=$tracked_pid"
  if [[ "$dry_run" == true ]]; then
    echo "DryRun: would stop tracked PID=$tracked_pid"
    echo "DryRun: would remove PID file $pid_file"
    echo 'DryRun enabled. Process was not stopped.'
    exit 0
  fi

  kill_pid "$tracked_pid" "tracked PID=$tracked_pid"
  rm -f "$pid_file"
  echo "Stopped PID=$tracked_pid and removed PID file."
  exit 0
fi

if [[ "$force_by_port" != true ]]; then
  echo "No PID file found at $pid_file. Nothing to stop."
  echo 'Tip: use --force-by-port to stop listener on a specific port.'
  exit 0
fi

port_pid="$(find_port_pid "$port")"
if [[ -z "$port_pid" ]]; then
  echo "No listening process found on port $port."
  exit 0
fi

echo "Port listener found: Port=$port PID=$port_pid"
kill_pid "$port_pid" "port listener PID=$port_pid on port $port"
if [[ "$dry_run" == true ]]; then
  exit 0
fi
echo "Stopped PID=$port_pid listening on port $port."
