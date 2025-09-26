#!/usr/bin/env bash
set -euo pipefail
export KIS_DATABASE_URL=${KIS_DATABASE_URL:-sqlite+aiosqlite:///./kis_dev.db}
uvicorn api.src.kis_backend.main:app --host 0.0.0.0 --port "${1:-8080}"
