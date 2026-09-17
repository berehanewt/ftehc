#!/usr/bin/env bash
set -euo pipefail

dry_run=false
skip_frontend_build=false
port=8080
no_frontend_redirect=false

usage() {
  cat <<'EOF'
Usage: ./run-local.sh [options]

Options:
  --port N                     Server port for Spring Boot. Default: 8080
  --skip-frontend-build        Skip Angular rebuild before Spring Boot starts.
  --no-frontend-redirect       Disable redirect to Angular dev server (serve UI from backend).
  --dry-run                    Print what would run without starting the app.
  -h, --help                   Show this help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)
      port="$2"
      shift 2
      ;;
    --skip-frontend-build)
      skip_frontend_build=true
      shift
      ;;
    --no-frontend-redirect)
      no_frontend_redirect=true
      shift
      ;;
    --dry-run)
      dry_run=true
      shift
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
client_root="$project_root/client"
frontend_static_output="$project_root/target/classes/static"
logs_dir="$project_root/logs"
log_file="$logs_dir/local-app.log"

mkdir -p "$logs_dir"

rotate_log() {
  local max_bytes=$((5 * 1024 * 1024))
  local archives=5

  if [[ ! -f "$log_file" ]]; then
    return
  fi

  local current_size
  current_size=$(wc -c < "$log_file")
  if (( current_size <= max_bytes )); then
    return
  fi

  for (( index=archives; index>=1; index-- )); do
    local previous="$log_file.$index"
    local next="$log_file.$((index + 1))"
    if [[ -f "$previous" ]]; then
      if (( index == archives )); then
        rm -f "$previous"
      else
        mv "$previous" "$next"
      fi
    fi
  done

  mv "$log_file" "$log_file.1"
}

# Build a single -Dspring-boot.run.arguments value (comma-separated)
boot_args="--server.port=${port}"
if [[ "$no_frontend_redirect" == true ]]; then
  boot_args="${boot_args},--app.frontend.dev-url="
fi

if command -v sh >/dev/null 2>&1; then
  mvn_command=(sh "$project_root/mvnw" spring-boot:run -Dspring-boot.run.profiles=local "-Dspring-boot.run.arguments=${boot_args}")
else
  mvn_command=("$project_root/mvnw" spring-boot:run -Dspring-boot.run.profiles=local "-Dspring-boot.run.arguments=${boot_args}")
fi

echo "Working directory=$project_root"
echo "Frontend directory=$client_root"
echo "SkipFrontendBuild=$skip_frontend_build"
echo "Port=$port"
echo "NoFrontendRedirect=$no_frontend_redirect"
echo "Command=${mvn_command[*]}"
echo "Log file=$log_file"

if [[ "$dry_run" == true ]]; then
  echo 'DryRun enabled. Command not executed.'
  exit 0
fi

if [[ "$skip_frontend_build" != true ]]; then
  echo 'Building Angular frontend for backend static hosting...'
  (
    cd "$client_root"
    npm run build
  )
fi

# Only clear stale static output when a fresh build was just done
if [[ "$skip_frontend_build" != true ]] && [[ -d "$frontend_static_output" ]]; then
  echo "Clearing stale static output at $frontend_static_output"
  rm -rf "$frontend_static_output"
fi

rotate_log
echo "Launching Spring Boot. Logs will be appended to $log_file"

exec "${mvn_command[@]}" >> "$log_file" 2>&1
