#!/usr/bin/env bash
set -euo pipefail

url="http://localhost:8080/actuator/health"
expected_status="UP"
retries=10
delay_seconds=2
timeout_seconds=5
dry_run=false

usage() {
  cat <<'EOF'
Usage: ./check-health.sh [options]

Options:
  --url URL                    Health endpoint URL.
  --expected-status STATUS     Expected top-level status. Default: UP
  --retries N                  Number of retries. Default: 10
  --delay-seconds N            Delay between retries. Default: 2
  --timeout-seconds N          HTTP timeout in seconds. Default: 5
  --dry-run                    Print the probe settings without calling the URL.
  -h, --help                   Show this help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)
      url="$2"
      shift 2
      ;;
    --expected-status)
      expected_status="$2"
      shift 2
      ;;
    --retries)
      retries="$2"
      shift 2
      ;;
    --delay-seconds)
      delay_seconds="$2"
      shift 2
      ;;
    --timeout-seconds)
      timeout_seconds="$2"
      shift 2
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

if (( retries < 1 )); then
  echo 'Retries must be at least 1.' >&2
  exit 1
fi

extract_status() {
  sed -nE 's/.*"status"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' | head -n 1
}

echo "Health check: Url=$url ExpectedStatus=$expected_status Retries=$retries DelaySeconds=$delay_seconds TimeoutSeconds=$timeout_seconds"

if [[ "$dry_run" == true ]]; then
  echo 'DryRun enabled. Health endpoint was not called.'
  exit 0
fi

for (( attempt=1; attempt<=retries; attempt++ )); do
  if response="$(curl -sS --max-time "$timeout_seconds" "$url" 2>&1)"; then
    curl_exit=0
  else
    curl_exit=$?
  fi

  if (( curl_exit == 0 )); then
    status="$(printf '%s' "$response" | tr -d '\r\n' | extract_status)"
    echo "Attempt ${attempt}/${retries}: status=${status:-unknown}"
    if [[ "$status" == "$expected_status" ]]; then
      echo "Health is $status."
      exit 0
    fi
  else
    echo "Attempt ${attempt}/${retries} failed: $response"
  fi

  if (( attempt < retries )); then
    sleep "$delay_seconds"
  fi
done

echo "Health check failed. Expected '$expected_status' from $url after $retries attempts." >&2
exit 1
