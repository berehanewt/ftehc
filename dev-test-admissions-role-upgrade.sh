#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v powershell.exe >/dev/null 2>&1; then
  echo "powershell.exe not found. Run this script from Git Bash on Windows or use the .ps1 script directly."
  exit 1
fi

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$SCRIPT_DIR/dev-test-admissions-role-upgrade.ps1" "$@"

