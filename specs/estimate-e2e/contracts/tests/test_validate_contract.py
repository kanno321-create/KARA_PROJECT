"""Contract test stub for /v1/validate (expected to fail until implementation)."""
import json
from pathlib import Path

import pytest

CONTRACT_PATH = Path(__file__).resolve().parents[1] / "validate.openapi.json"


def test_validate_contract_not_implemented():
    spec = json.loads(CONTRACT_PATH.read_text())
    assert spec["paths"].get("/v1/validate"), "Missing validate path definition"
    pytest.fail("/v1/validate implementation pending; ensure FIX-4 logic before merging")
