"""Run regression across canned cases via FastMCP gateway."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from statistics import mean

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
PARENT = ROOT.parent
if str(PARENT) not in sys.path:
    sys.path.insert(0, str(PARENT))

from KIS.Engine.kis_estimator_core.util import io  # noqa: E402
from KIS.Tools.gateway.fastmcp_gateway import app  # noqa: E402

client = TestClient(app)


def _verify_metrics(case_id: str, metrics: dict[str, float]) -> None:
    if metrics.get("fit_score", 0.0) < 0.80:
        raise AssertionError(f"[{case_id}] fit_score below threshold: {metrics.get('fit_score')}")
    if metrics.get("phase_balance", 1.0) > 0.05:
        raise AssertionError(f"[{case_id}] phase_balance above threshold: {metrics.get('phase_balance')}")
    if metrics.get("lint_errors", 1) != 0:
        raise AssertionError(f"[{case_id}] lint errors present: {metrics.get('lint_errors')}")


def run_case(case_path: Path) -> dict[str, float]:
    payload = json.loads(case_path.read_text(encoding="utf-8-sig"))
    response = client.post("/v1/estimate", json=payload)
    if response.status_code != 200:
        detail = response.json()
        raise RuntimeError(f"Regression case failed ({case_path.name}): {detail}")
    body = response.json()
    metrics = body.get("metrics", {})
    _verify_metrics(payload.get("project_id", case_path.stem), metrics)
    return metrics


def main() -> None:
    cases_dir = ROOT / "tests" / "regression"
    case_paths = sorted(cases_dir.glob("cases_*.json"))
    if len(case_paths) != 20:
        raise RuntimeError("Expected 20 regression cases")

    collected: list[dict[str, float]] = []
    for case_path in case_paths:
        metrics = run_case(case_path)
        collected.append(metrics)

    fit_scores = [item.get("fit_score", 0.0) for item in collected]
    balances = [item.get("phase_balance", 0.0) for item in collected]
    lint_errors = [item.get("lint_errors", 0) for item in collected]

    summary = {
        "cases": len(collected),
        "fit_score_avg": round(mean(fit_scores), 4),
        "phase_balance_avg": round(mean(balances), 4),
        "lint_zero_count": lint_errors.count(0),
    }

    output_path = ROOT / "Work" / "2025-0001" / "logs" / "regression_metrics.json"
    io.write_json(output_path, summary)  # [REAL-LOGIC] Persist regression KPIs for release packaging

    print("Regression suite completed: 20/20 cases")


if __name__ == "__main__":
    main()
