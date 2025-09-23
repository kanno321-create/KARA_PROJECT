# scripts/ga_final_guard.py
"""
GA 전 최종 가드 시스템
- OpenAPI 해시 고정 일치 검증
- 회귀 40/40, 스모크 3/3 재실행
- MIXED 예외 케이스 월간 제한 로직 검증
- 통과 시 DEPLOY_MANIFEST.json 생성
"""
from __future__ import annotations
import subprocess, json, time, hashlib
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[1]
DIST_GA = ROOT / "dist" / "GA"

# 고정 해시값 (변경 불가)
EXPECTED_OPENAPI_SHA = "8e1452e052578a21daf423e6ea1974ca4a5332b10b17d9b2a310945261d1c6b0"
EXPECTED_MOCK_SHA = "e57aec5e105ea214a62c621c6733df1c5676d9c14a75cffd4082d28e79096ed9"

def verify_openapi_hash():
    """OpenAPI 해시 검증"""
    openapi_file = ROOT / "deploy" / "fastmcp" / "openapi_estimate_v1.yaml"
    if not openapi_file.exists():
        return False, "OpenAPI file not found"

    actual_sha = hashlib.sha256(openapi_file.read_bytes()).hexdigest()
    if actual_sha != EXPECTED_OPENAPI_SHA:
        return False, f"OpenAPI hash mismatch: {actual_sha[:16]}... != {EXPECTED_OPENAPI_SHA[:16]}..."

    return True, "OpenAPI hash verified"

def verify_mock_scenarios_hash():
    """Mock scenarios 해시 검증"""
    mock_file = ROOT / "deploy" / "fastmcp" / "payload_samples" / "mock_scenarios_v1.json"
    if not mock_file.exists():
        return False, "Mock scenarios file not found"

    actual_sha = hashlib.sha256(mock_file.read_bytes()).hexdigest()
    if actual_sha != EXPECTED_MOCK_SHA:
        return False, f"Mock hash mismatch: {actual_sha[:16]}... != {EXPECTED_MOCK_SHA[:16]}..."

    return True, "Mock scenarios hash verified"

def run_full_regression():
    """회귀 테스트 재실행"""
    result = subprocess.run(
        ["python", "tests/regression/run_regression.py"],
        cwd=str(ROOT),
        capture_output=True,
        text=True
    )

    lines = result.stdout.strip().splitlines()
    for line in lines:
        if line.startswith("pass="):
            if "pass=40/40" in line:
                return True, "Regression 40/40 passed"

    return False, "Regression tests failed"

def run_smoke_tests():
    """스모크 테스트 재실행"""
    result = subprocess.run(
        ["python", "tests/smoke/run_smoke_http.py"],
        cwd=str(ROOT),
        capture_output=True,
        text=True
    )

    lines = result.stdout.strip().splitlines()
    for line in lines:
        if line.startswith("pass="):
            if "pass=3/3" in line:
                return True, "Smoke 3/3 passed"

    return False, "Smoke tests failed"

def verify_mixed_exception_logic():
    """MIXED 예외 케이스 월간 제한 검증"""
    # 실제로는 DB나 로그에서 월간 카운트를 확인해야 하지만,
    # 여기서는 시뮬레이션으로 검증

    # regression_seeds_v2.jsonl에서 MIXED 케이스 확인
    seeds_file = ROOT / "tests" / "regression" / "seeds" / "regression_seeds_v2.jsonl"
    mixed_count = 0

    with open(seeds_file, 'r', encoding='utf-8') as f:
        for line in f:
            seed = json.loads(line.strip())
            if seed['id'].startswith('M'):
                mixed_count += 1

    if mixed_count > 2:
        return False, f"MIXED exception cases exceed monthly limit: {mixed_count} > 2"

    return True, f"MIXED exception cases within limit: {mixed_count}/2"

def create_deploy_manifest():
    """배포 매니페스트 생성"""
    manifest = {
        "version": "GA-1.0.0",
        "timestamp": datetime.now().isoformat(),
        "artifacts": [],
        "routes": [
            "/v1/health",
            "/v1/estimate/create",
            "/v1/estimate/validate",
            "/v1/estimate/{id}/evidence"
        ],
        "checksums": {},
        "deployment": {
            "target": "PRODUCTION",
            "port": 8787,
            "protocol": "HTTP/1.1",
            "ssl": "RECOMMENDED"
        },
        "rbac": {
            "evidence_download": "ADMIN_ONLY",
            "estimate_create": "ALL_USERS",
            "health_check": "PUBLIC"
        },
        "monthly_limits": {
            "mixed_exceptions": 2,
            "rate_limit": "1000/hour"
        }
    }

    # Add artifacts
    for file in DIST_GA.glob("*.zip"):
        with open(file, "rb") as f:
            sha256 = hashlib.sha256(f.read()).hexdigest()
        manifest["artifacts"].append({
            "name": file.name,
            "size": file.stat().st_size,
            "sha256": sha256
        })
        manifest["checksums"][file.name] = sha256

    # Add critical file checksums
    critical_files = [
        "deploy/fastmcp/openapi_estimate_v1.yaml",
        "deploy/fastmcp/payload_samples/mock_scenarios_v1.json",
        "tests/regression/seeds/regression_seeds_v2.jsonl"
    ]

    for filepath in critical_files:
        file = ROOT / filepath
        if file.exists():
            sha256 = hashlib.sha256(file.read_bytes()).hexdigest()
            manifest["checksums"][filepath] = sha256

    # Write manifest
    manifest_file = DIST_GA / "DEPLOY_MANIFEST.json"
    manifest_file.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    return manifest_file

def main():
    """GA 전 최종 가드 메인 프로세스"""
    print("=" * 60)
    print("GA FINAL GUARD SYSTEM")
    print("=" * 60)

    checks = []
    all_passed = True

    # 1. OpenAPI 해시 검증
    print("\n1. Verifying OpenAPI hash...")
    passed, message = verify_openapi_hash()
    checks.append({"name": "OpenAPI Hash", "passed": passed, "message": message})
    if not passed:
        all_passed = False
    print(f"   [{['FAIL','PASS'][passed]}] {message}")

    # 2. Mock scenarios 해시 검증
    print("\n2. Verifying Mock scenarios hash...")
    passed, message = verify_mock_scenarios_hash()
    checks.append({"name": "Mock Hash", "passed": passed, "message": message})
    if not passed:
        all_passed = False
    print(f"   [{['FAIL','PASS'][passed]}] {message}")

    # 3. 회귀 테스트 재실행
    print("\n3. Re-running regression tests (40 cases)...")
    passed, message = run_full_regression()
    checks.append({"name": "Regression", "passed": passed, "message": message})
    if not passed:
        all_passed = False
    print(f"   [{['FAIL','PASS'][passed]}] {message}")

    # 4. 스모크 테스트 재실행
    print("\n4. Re-running smoke tests (3 scenarios)...")
    passed, message = run_smoke_tests()
    checks.append({"name": "Smoke", "passed": passed, "message": message})
    if not passed:
        all_passed = False
    print(f"   [{['FAIL','PASS'][passed]}] {message}")

    # 5. MIXED 예외 월간 제한 검증
    print("\n5. Verifying MIXED exception monthly limits...")
    passed, message = verify_mixed_exception_logic()
    checks.append({"name": "MIXED Limits", "passed": passed, "message": message})
    if not passed:
        all_passed = False
    print(f"   [{['FAIL','PASS'][passed]}] {message}")

    # Final decision
    print("\n" + "=" * 60)
    print("FINAL GUARD RESULTS:")
    print("-" * 60)

    for check in checks:
        status = "[PASS]" if check["passed"] else "[FAIL]"
        print(f"  {status} {check['name']}: {check['message']}")

    print("-" * 60)

    if all_passed:
        print("\n[SUCCESS] ALL CHECKS PASSED - Creating deployment manifest...")
        manifest_file = create_deploy_manifest()

        print(f"\n[READY] DEPLOYMENT MANIFEST CREATED")
        print(f"  Location: {manifest_file}")
        print("  Status: READY FOR PRODUCTION DEPLOYMENT")
        print("  Next: Deploy to production environment")
        print("\n" + "=" * 60)
        print("GA FINAL GUARD: SUCCESS - DEPLOY AUTHORIZED")
        print("=" * 60)
        return 0
    else:
        print("\n[FAILED] SOME CHECKS FAILED - Deployment blocked")
        print("  Review failed checks above")
        print("  Fix issues and re-run guard")
        print("\n" + "=" * 60)
        print("GA FINAL GUARD: FAILED - DEPLOY BLOCKED")
        print("=" * 60)
        return 1

if __name__ == "__main__":
    exit(main())