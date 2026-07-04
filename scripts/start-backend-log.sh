#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/log"

mkdir -p "$LOG_DIR"

cd "$ROOT_DIR/backend"
.venv/bin/uvicorn main:app --reload --host 0.0.0.0 2>&1 | tee "$LOG_DIR/backend.log"
