"""Contract test stub for /v1/health (expected to fail until implementation)."""
import json
from pathlib import Path

import pytest

CONTRACT_PATH = Path(__file__).resolve().parents[1] / "health.openapi.json"


def test_health_contract_not_implemented():
    spec = json.loads(CONTRACT_PATH.read_text())
    assert spec["paths"].get("/v1/health"), "Missing health path definition"
    pytest.fail("/v1/health implementation pending; ensure uptime reporting before merging")
