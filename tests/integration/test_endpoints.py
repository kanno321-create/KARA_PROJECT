# tests/integration/test_endpoints.py
# Integration tests for KIS Estimate API endpoints
from __future__ import annotations
import json, time, unittest
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

BASE_URL = "http://127.0.0.1:8787"

class TestEstimateAPI(unittest.TestCase):
    """통합 테스트: 견적 API 엔드포인트"""

    def test_health_check(self):
        """헬스 체크 엔드포인트 테스트"""
        req = Request(f"{BASE_URL}/v1/health", method="GET")
        with urlopen(req, timeout=5) as r:
            self.assertEqual(r.getcode(), 200)
            data = json.loads(r.read().decode("utf-8"))
            self.assertTrue(data.get("ok"))
            self.assertIn("ts", data)

    def test_create_estimate_success(self):
        """견적 생성 성공 케이스"""
        payload = {
            "brand": "LS",
            "form": "ECONOMIC",
            "installation": {"location": "INDOOR", "mount": "FLUSH"},
            "device": {"type": "MCCB"},
            "main": {"af": 100, "poles": "3P"},
            "branches": [{"af": 100, "poles": "3P", "qty": 4}],
            "accessories": {"enabled": False, "items": []}
        }

        data = json.dumps(payload).encode("utf-8")
        req = Request(f"{BASE_URL}/v1/estimate/create", data=data,
                     headers={"Content-Type": "application/json"})

        with urlopen(req, timeout=5) as r:
            self.assertEqual(r.getcode(), 200)
            result = json.loads(r.read().decode("utf-8"))
            self.assertIn("enclosure", result)
            self.assertIn("evidence", result)
            self.assertEqual(result["enclosure"]["form"], "ECONOMIC")

    def test_create_estimate_duplicate(self):
        """중복 견적 409 에러 테스트"""
        payload = {
            "brand": "SANGDO",
            "form": "ECONOMIC",
            "installation": {"location": "INDOOR", "mount": "FLUSH"},
            "device": {"type": "MCCB"},
            "main": {"model": "SBS-603", "af": 600, "poles": "3P"},
            "branches": [{"af": 100, "poles": "3P", "qty": 1}],
            "accessories": {"enabled": False, "items": []},
            "meta": {"dedup_key": "dedup:ab12cd34"}
        }

        data = json.dumps(payload).encode("utf-8")
        req = Request(f"{BASE_URL}/v1/estimate/create", data=data,
                     headers={"Content-Type": "application/json"})

        try:
            with urlopen(req, timeout=5) as r:
                self.fail("Expected HTTPError 409")
        except HTTPError as e:
            self.assertEqual(e.code, 409)
            error = json.loads(e.read().decode("utf-8"))
            self.assertEqual(error["error"]["code"], "DUPLICATE_REQUEST")

    def test_validate_estimate_invalid_poles(self):
        """유효하지 않은 극수 422 에러 테스트"""
        payload = {
            "brand": "SANGDO",
            "form": "ECONOMIC",
            "installation": {"location": "INDOOR", "mount": "FLUSH"},
            "device": {"type": "MCCB"},
            "main": {"model": "SBS-603", "af": 600, "poles": "3P"},
            "branches": [{"af": 100, "poles": "5P", "qty": 1}],
            "accessories": {"enabled": False, "items": []}
        }

        data = json.dumps(payload).encode("utf-8")
        req = Request(f"{BASE_URL}/v1/estimate/validate", data=data,
                     headers={"Content-Type": "application/json"})

        try:
            with urlopen(req, timeout=5) as r:
                self.fail("Expected HTTPError 422")
        except HTTPError as e:
            self.assertEqual(e.code, 422)
            error = json.loads(e.read().decode("utf-8"))
            self.assertEqual(error["error"]["code"], "POLES_MISMATCH")

    def test_get_evidence(self):
        """증거 조회 엔드포인트 테스트"""
        req = Request(f"{BASE_URL}/v1/estimate/test123/evidence", method="GET")
        with urlopen(req, timeout=5) as r:
            self.assertEqual(r.getcode(), 200)
            data = json.loads(r.read().decode("utf-8"))
            self.assertIn("bundle", data)
            self.assertIn("inputs_snapshot", data)

    def test_performance_metrics(self):
        """성능 메트릭 수집 테스트"""
        latencies = []

        for _ in range(10):
            start = time.time()
            req = Request(f"{BASE_URL}/v1/health", method="GET")
            with urlopen(req, timeout=5) as r:
                _ = r.read()
            latencies.append((time.time() - start) * 1000)

        avg_latency = sum(latencies) / len(latencies)
        self.assertLess(avg_latency, 100, f"평균 응답시간 {avg_latency:.2f}ms > 100ms")

        print(f"\n성능 메트릭:")
        print(f"  평균 응답시간: {avg_latency:.2f}ms")
        print(f"  최소: {min(latencies):.2f}ms")
        print(f"  최대: {max(latencies):.2f}ms")

if __name__ == "__main__":
    # 테스트 실행
    unittest.main(verbosity=2)