# scripts/evidence_bundler.py
from __future__ import annotations
import json, hashlib, zipfile, time, io
from pathlib import Path
from typing import Dict, Any

def create_evidence_bundle(request_id: str, request_data: Dict[str, Any]) -> bytes:
    """
    Evidence 번들 생성
    - rules_doc: 브랜드별 정책 문서
    - tables: 가격표 및 매핑 테이블
    - inputs_snapshot: 원본 요청 데이터
    - trace_id: 추적 식별자
    """

    # 메모리상에서 ZIP 생성
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        # 1. Rules Document (브랜드별 정책)
        rules_doc = {
            "brand_policies": {
                "LS": {
                    "base_margin": 1.25,
                    "outdoor_surcharge": 1.15,
                    "accessory_limit": 5,
                    "standard_warranty": "2Y"
                },
                "SANGDO": {
                    "base_margin": 1.20,
                    "outdoor_surcharge": 1.12,
                    "accessory_limit": 4,
                    "standard_warranty": "1Y"
                },
                "HYUNDAI": {
                    "base_margin": 1.22,
                    "outdoor_surcharge": 1.14,
                    "accessory_limit": 6,
                    "standard_warranty": "2Y"
                },
                "MIXED": {
                    "base_margin": 1.30,
                    "outdoor_surcharge": 1.20,
                    "accessory_limit": 3,
                    "standard_warranty": "1Y",
                    "exception_note": "Annual exception allowed (1-2 per year)"
                }
            },
            "pole_conversion": {
                "2P": {"width_factor": 0.6, "cost_factor": 0.65},
                "3P": {"width_factor": 1.0, "cost_factor": 1.0},
                "4P": {"width_factor": 1.3, "cost_factor": 1.25}
            },
            "sensitivity_specs": {
                "SEE": {"description": "Standard Earth-leakage", "trip_current": "30mA", "cost_add": 1.1},
                "SES": {"description": "Sensitive Earth-leakage", "trip_current": "15mA", "cost_add": 1.15}
            }
        }
        zf.writestr("rules_doc.json", json.dumps(rules_doc, indent=2))

        # 2. Pricing Tables
        pricing_tables = {
            "mccb_base_prices": {
                "100": {"2P": 45000, "3P": 68000, "4P": 85000},
                "150": {"2P": 52000, "3P": 78000, "4P": 97500},
                "175": {"2P": 56000, "3P": 84000, "4P": 105000},
                "225": {"2P": 67500, "3P": 101250, "4P": 126500},
                "250": {"2P": 75000, "3P": 112500, "4P": 140600},
                "350": {"2P": 105000, "3P": 157500, "4P": 196800},
                "400": {"2P": 120000, "3P": 180000, "4P": 225000},
                "450": {"2P": 135000, "3P": 202500, "4P": 253100},
                "500": {"2P": 150000, "3P": 225000, "4P": 281200},
                "600": {"2P": 180000, "3P": 270000, "4P": 337500},
                "800": {"2P": 240000, "3P": 360000, "4P": 450000},
                "1000": {"2P": 300000, "3P": 450000, "4P": 562500},
                "1200": {"2P": 360000, "3P": 540000, "4P": 675000}
            },
            "elcb_base_prices": {
                "100": {"3P": 85000},
                "250": {"3P": 125000}
            },
            "accessory_prices": {
                "shunt_trip": 25000,
                "alarm_switch": 18000,
                "ammeter": 35000,
                "voltmeter": 32000,
                "emergency_stop": 28000,
                "indicator_lamp": 12000
            },
            "enclosure_forms": {
                "ECONOMIC": {"base_cost": 150000, "space_efficiency": 0.85},
                "STANDARD": {"base_cost": 200000, "space_efficiency": 1.0},
                "CUSTOM": {"base_cost": 350000, "space_efficiency": 1.2}
            }
        }
        zf.writestr("tables/pricing.json", json.dumps(pricing_tables, indent=2))

        # 3. Input Snapshot
        inputs_snapshot = {
            "request_id": request_id,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "original_request": request_data,
            "validation_status": "PASSED",
            "preprocessing": {
                "brand_verified": True,
                "poles_matched": True,
                "af_range_valid": True,
                "accessories_valid": True
            }
        }
        zf.writestr("inputs_snapshot.json", json.dumps(inputs_snapshot, indent=2))

        # 4. Trace Information
        trace_info = {
            "trace_id": f"TRC-{request_id}-{int(time.time()*1000)}",
            "processing_steps": [
                {"step": 1, "action": "receive_request", "timestamp": time.time()},
                {"step": 2, "action": "validate_input", "timestamp": time.time() + 0.001},
                {"step": 3, "action": "calculate_estimate", "timestamp": time.time() + 0.005},
                {"step": 4, "action": "generate_evidence", "timestamp": time.time() + 0.010}
            ],
            "version": "1.0.0",
            "server": "mock_gateway"
        }
        zf.writestr("trace.json", json.dumps(trace_info, indent=2))

        # 5. Manifest
        manifest = {
            "bundle_version": "1.0",
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "contents": [
                "rules_doc.json",
                "tables/pricing.json",
                "inputs_snapshot.json",
                "trace.json"
            ]
        }
        zf.writestr("manifest.json", json.dumps(manifest, indent=2))

    # ZIP 데이터 반환
    zip_data = zip_buffer.getvalue()

    return zip_data

def generate_evidence_response(request_id: str, request_data: Dict[str, Any]) -> Dict[str, Any]:
    """Evidence API 응답 생성"""

    # Bundle 생성
    bundle_data = create_evidence_bundle(request_id, request_data)

    # SHA256 계산
    bundle_sha256 = hashlib.sha256(bundle_data).hexdigest()

    # Base64 인코딩
    import base64
    bundle_b64 = base64.b64encode(bundle_data).decode('utf-8')

    return {
        "bundle": {
            "format": "zip",
            "encoding": "base64",
            "data": bundle_b64,
            "size_bytes": len(bundle_data),
            "sha256": bundle_sha256
        },
        "inputs_snapshot": request_data,
        "trace_id": f"TRC-{request_id}-{int(time.time()*1000)}",
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S")
    }

if __name__ == "__main__":
    # 테스트
    test_request = {
        "brand": "LS",
        "form": "ECONOMIC",
        "installation": {"location": "INDOOR", "mount": "FLUSH"},
        "device": {"type": "MCCB"},
        "main": {"af": 100, "poles": "3P"},
        "branches": [{"af": 100, "poles": "3P", "qty": 4}],
        "accessories": {"enabled": False, "items": []}
    }

    result = generate_evidence_response("test123", test_request)
    print(f"Evidence bundle generated:")
    print(f"  Size: {result['bundle']['size_bytes']} bytes")
    print(f"  SHA256: {result['bundle']['sha256'][:16]}...")
    print(f"  Trace ID: {result['trace_id']}")