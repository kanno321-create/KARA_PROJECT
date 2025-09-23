"""FastMCP-style gateway exposing estimator logic."""

from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import polars as pl
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field

from ...Engine.kis_estimator_core.stubs import (
    breaker_critic,
    breaker_placer,
    cover_tab_writer,
    doc_lint_guard,
    enclosure_solver,
    estimate_formatter,
    evidence,
)
from ...Engine.kis_estimator_core.util import templates

app = FastAPI(title="KIS FastMCP Gateway", version="0.1.0-rc2")


class EstimateRequestModel(BaseModel):
    project_id: str
    site: Dict[str, Any]
    loads: List[Dict[str, Any]]
    enclosure: Dict[str, Any]
    ip_min: str
    requested_totals: Dict[str, Any]
    document: Optional[Dict[str, Any]] = None
    brand: Optional[Dict[str, Any]] = None
    case_id: str = Field(default=evidence.CASE_DEFAULT)


class ValidationRequestModel(BaseModel):
    template_path: str | None = None
    expected_hash: str | None = None


class RagQueryModel(BaseModel):
    query: str
    top_k: int = 3


class RagPackModel(BaseModel):
    pack_id: str
    description: str | None = None


def _stage_entry(stage: str, report: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "stage": stage,
        "artifacts": report.get("evidence", []),
        "logs": report.get("logs", []),
        "payload": report.get("payload", {}),
    }


def _raise_pipeline_error(stage: str, exc: Exception, stage_history: List[Dict[str, Any]], metrics: Dict[str, Any]) -> None:
    evidence_list = [{"stage": entry["stage"], "artifacts": entry.get("artifacts", [])} for entry in stage_history]
    logs = [log for entry in stage_history for log in entry.get("logs", [])]
    detail = {
        "failed_step": stage,
        "error": str(exc),
        "evidence": evidence_list,
        "logs": logs,
        "metrics": metrics,
    }
    raise HTTPException(status_code=422, detail=detail)


def _run_pipeline(request: EstimateRequestModel) -> Dict[str, Any]:
    data = request.dict()
    case_id = data.get("case_id", evidence.CASE_DEFAULT)

    stage_reports: List[Dict[str, Any]] = []
    metrics = {"fit_score": None, "phase_balance": None, "lint_errors": None}

    try:
        enclosure_report = enclosure_solver.solve(data, case_id=case_id)
        metrics["fit_score"] = enclosure_report["payload"].get("fit_score")
        stage_reports.append(_stage_entry("enclosure_solver", enclosure_report))
    except Exception as exc:  # [REAL-LOGIC] propagate solver failures with evidence trail
        _raise_pipeline_error("enclosure_solver", exc, stage_reports, metrics)

    try:
        breaker_report = breaker_placer.place(enclosure_report["payload"], data, case_id=case_id)
        critic_report = breaker_critic.review(breaker_report["payload"], case_id=case_id)
    except Exception as exc:
        _raise_pipeline_error("breaker_placer", exc, stage_reports, metrics)

    combined_breaker = {
        "payload": {
            **breaker_report["payload"],
            "critic": critic_report["payload"],
        },
        "evidence": breaker_report["evidence"] + critic_report["evidence"],
        "logs": breaker_report["logs"] + critic_report["logs"],
    }
    metrics["phase_balance"] = combined_breaker["payload"].get("phase_balance")
    stage_reports.append(_stage_entry("breaker_placer", combined_breaker))

    try:
        formatter_report = estimate_formatter.format_estimate(data, combined_breaker["payload"], case_id=case_id)
    except Exception as exc:
        _raise_pipeline_error("estimate_formatter", exc, stage_reports, metrics)
    stage_reports.append(_stage_entry("estimate_formatter", formatter_report))

    try:
        cover_report = cover_tab_writer.generate(formatter_report["payload"], case_id=case_id)
    except Exception as exc:
        _raise_pipeline_error("cover_tab_writer", exc, stage_reports, metrics)
    stage_reports.append(_stage_entry("cover_tab_writer", cover_report))

    try:
        lint_report = doc_lint_guard.inspect(formatter_report["payload"], cover_report["payload"], case_id=case_id)
    except Exception as exc:
        _raise_pipeline_error("doc_lint_guard", exc, stage_reports, metrics)
    stage_reports.append(_stage_entry("doc_lint_guard", lint_report))

    lint_payload = lint_report.get("payload", {})
    metrics["lint_errors"] = lint_payload.get("lint_errors")

    evidence_list: List[Dict[str, Any]] = [
        {"stage": entry["stage"], "artifacts": entry["artifacts"]}
        for entry in stage_reports
    ]
    logs: List[str] = [log for entry in stage_reports for log in entry["logs"]]

    if lint_payload.get("lint_errors", 0) > 0:
        detail = {
            "failed_step": "doc_lint_guard",
            "lint": lint_payload,
            "metrics": metrics,
            "evidence": evidence_list,
            "logs": logs,
        }
        raise HTTPException(status_code=422, detail=detail)

    response = {
        "project_id": data["project_id"],
        "export_ok": True,
        "totals": formatter_report["payload"].get("totals", {}),
        "evidence": evidence_list,
        "logs": logs,
        "next": ["/v1/validate", "/v1/rag/pack"],
        "metrics": metrics,
    }
    return response


@app.get("/v1/health")
def health() -> Dict[str, Any]:
    return {"ok": True, "ts": datetime.utcnow().isoformat() + "Z"}


@app.post("/v1/estimate")
def estimate(request: EstimateRequestModel) -> Dict[str, Any]:
    return _run_pipeline(request)


@app.post("/v1/validate")
def validate(request: ValidationRequestModel) -> Dict[str, Any]:
    registry_report = templates.validate_templates()
    template_report = None
    if request.template_path:
        template_report = templates.validate_template(Path(request.template_path), request.expected_hash)

    payload = {
        "registry": registry_report,
        "template": template_report,
        "sandbox": templates.sandbox_ruleset_summary(),
    }
    tables = {
        "registry_files": pl.DataFrame(registry_report.get("files", []))
    }
    artefacts = evidence.write_stage("validate", payload, case_id=evidence.CASE_DEFAULT, tables=tables)
    return {
        "status": "pass" if registry_report["summary"].get("range_issues", 0) == 0 else "warn",
        "evidence": artefacts,
        "payload": payload,
    }


@app.post("/v1/rag/query")
def rag_query(request: RagQueryModel) -> Dict[str, Any]:
    payload = {
        "query": request.query,
        "top_k": request.top_k,
        "results": [
            {"pack_id": "kb-main", "score": 0.64, "snippet": "Stubbed MCP knowledge result"}
        ],
    }
    artefacts = evidence.write_stage("rag_query", payload, case_id=evidence.CASE_DEFAULT)
    return {
        "status": "pass",
        "payload": payload,
        "evidence": artefacts,
    }


@app.post("/v1/rag/pack")
def rag_pack(request: RagPackModel) -> Dict[str, Any]:
    payload = {
        "pack_id": request.pack_id,
        "description": request.description or "",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "items": ["template-guides", "breaker-reference"],
    }
    artefacts = evidence.write_stage("rag_pack", payload, case_id=evidence.CASE_DEFAULT)
    return {
        "status": "pass",
        "payload": payload,
        "evidence": artefacts,
    }


def _selftest() -> None:
    """Exercise key endpoints with a deterministic payload."""
    client = TestClient(app)
    sample_request = {
        "project_id": "2025-SELFTEST",
        "site": {"country": "KR", "voltage_class": "LV"},
        "loads": [
            {"id": "L1", "kva": 15.0, "phase": "A", "width_unit": 0.4, "heat_w": 120},
            {"id": "L2", "kva": 18.0, "phase": "B", "width_unit": 0.4, "heat_w": 130},
            {"id": "L3", "kva": 14.0, "phase": "C", "width_unit": 0.4, "heat_w": 110},
        ],
        "enclosure": {"required_w": 600, "required_h": 2000, "required_d": 400},
        "ip_min": "IP54",
        "requested_totals": {"currency": "KRW"},
        "document": {"client": "KIS QA", "project_name": "Self Test", "project_number": "KIS-SELF", "date": datetime.utcnow().date().isoformat()},
        "brand": {"primary_color": "003366", "logo_ref": "assets/logo.svg", "font_size": 11},
    }
    estimate_response = client.post("/v1/estimate", json=sample_request)
    estimate_response.raise_for_status()
    client.post("/v1/validate", json={}).raise_for_status()
    print("Selftest OK: /v1/estimate, /v1/validate")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="KIS FastMCP Gateway helper")
    parser.add_argument("--selftest", action="store_true", help="Run pipeline smoke test")
    args = parser.parse_args()
    if args.selftest:
        _selftest()
    else:
        parser.print_help()
