#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/log"

mkdir -p "$LOG_DIR"

cleanup() {
  local pids
  pids="$(jobs -p)"
  if [[ -n "$pids" ]]; then
    kill $pids 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT

echo "Starting backend. Log: $LOG_DIR/backend.log"
(
  cd "$ROOT_DIR/backend"
  .venv/bin/uvicorn main:app --reload --host 0.0.0.0
) 2>&1 | tee "$LOG_DIR/backend.log" &

echo "Starting frontend. Log: $LOG_DIR/frontend.log"
cd "$ROOT_DIR/frontend"
script -q "$LOG_DIR/frontend.log" npx expo start --tunnel
