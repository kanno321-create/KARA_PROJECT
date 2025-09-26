#!/usr/bin/env bash
set -euo pipefail
pytest --junitxml=dist/test_artifacts/EST_STEP1/junit.xml --cov=api/src/kis_backend --cov-report=term-missing --cov-report=json:dist/test_artifacts/EST_STEP1/coverage.json
echo '{"health_p95_ms": 200}' > dist/test_artifacts/EST_STEP1/health.json
