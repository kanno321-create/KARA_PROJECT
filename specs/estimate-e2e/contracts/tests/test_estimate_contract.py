"""Contract test stub for /v1/estimate (expected to fail until implementation)."""
import json
from pathlib import Path

import pytest

CONTRACT_PATH = Path(__file__).resolve().parents[1] / "estimate.openapi.json"


def test_estimate_contract_not_implemented():
    # NO-EVIDENCE-NO-ACTION: fail fast until service implements schema validation
    spec = json.loads(CONTRACT_PATH.read_text())
    assert spec["paths"].get("/v1/estimate"), "Missing estimate path definition"
    pytest.fail("/v1/estimate implementation pending; ensure contract enforcement before merging")
