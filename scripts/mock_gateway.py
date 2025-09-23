# scripts/mock_gateway.py
# Mock gateway functions for estimate API
import json
import time

def estimate_create(request):
    """Mock estimate creation endpoint"""
    # Check for duplicate key
    meta = request.get("meta", {})
    if meta.get("dedup_key") == "dedup:ab12cd34":
        return {
            "status": 409,
            "error": {
                "code": "DUPLICATE_REQUEST",
                "message": "Equivalent request already exists.",
                "path": "meta.dedup_key",
                "hint": "GET /v1/estimate/{id}/evidence"
            },
            "inputs_snapshot": request
        }

    # Normal response
    return {
        "status": 200,
        "enclosure": {"W": 900, "H": 1800, "D": 400, "form": "ECONOMIC"},
        "inputs_snapshot": request,
        "evidence": {
            "rules_doc": "KIS_Enclosure_Rules.md#input-gates-and-brand-policy",
            "tables": [
                {"source": "LS Metasol MCCB size table", "rows": [{"af": 100, "poles": "3P", "W": 90, "H": 155, "D": 60}]}
            ],
            "brand_policy": "single-brand: LS"
        }
    }

def estimate_validate(request):
    """Mock estimate validation endpoint"""
    # Check for invalid poles
    branches = request.get("branches", [])
    if branches and branches[0].get("poles") == "5P":
        return {
            "status": 422,
            "error": {
                "code": "POLES_MISMATCH",
                "message": "Unsupported poles value.",
                "path": "branches[0].poles",
                "hint": "2P|3P|4P"
            },
            "question": "분기 회로의 극수는 2P, 3P, 4P 중 하나여야 합니다. 어떤 값을 쓰실까요?"
        }

    # Normal validation response
    return {
        "status": 200,
        "valid": True,
        "evidence": {
            "rules_doc": "KIS_Enclosure_Rules.md",
            "tables": [],
            "brand_policy": "validation passed"
        }
    }

def evidence_get(estimate_id):
    """Mock evidence retrieval endpoint - 실제 번들 생성"""
    if estimate_id == "not-found":
        return {"status": 404, "error": {"code": "NOT_FOUND", "message": "Estimate not found"}}

    # Import evidence bundler
    from evidence_bundler import generate_evidence_response

    # Sample request data (실제로는 저장된 데이터 사용)
    test_request = {
        "brand": "LS",
        "form": "ECONOMIC",
        "installation": {"location": "INDOOR", "mount": "FLUSH"},
        "device": {"type": "MCCB"},
        "main": {"af": 100, "poles": "3P"},
        "branches": [{"af": 100, "poles": "3P", "qty": 4}],
        "accessories": {"enabled": False, "items": []}
    }

    response = generate_evidence_response(estimate_id, test_request)
    response["status"] = 200
    return response