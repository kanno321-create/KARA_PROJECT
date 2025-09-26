"""Gate evaluation for orchestrator."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .utils.fs import ensure_dir, write_json

def evaluate(*, job_id: str, artifacts_dir: str | Path) -> dict[str, Any]:
    artifacts_path = Path(artifacts_dir)
    metrics_path = artifacts_path / "metrics.json"
    if not metrics_path.exists():
        result = {
            "jobId": job_id,
            "status": "BLOCKER",
            "reason": "metrics.json missing",
            "checks": {},
        }
        output_path = artifacts_path / f"gate_result_{job_id}.json"
        write_json(output_path, result)
        return result
    metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
    checks = {check: bool(metrics.get(check, False)) for check in metrics.get("checks", metrics)}
    overall = all(checks.values()) if checks else False
    result = {
        "jobId": job_id,
        "status": "PASS" if overall else "BLOCKER",
        "checks": checks,
        "details": metrics.get("details", {}),
    }
    output_path = artifacts_path / f"gate_result_{job_id}.json"
    write_json(output_path, result)
    return result
