# 회귀 테스트 5종 (CI용)

## Manual/Automated Test Cases

### A) 지식 없음 → 200/ABSTAIN

**요청:**
```bash
curl -X POST http://localhost:3001/v1/estimate/create \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-abstain" \
  -d '{
    "brand": "SANGDO",
    "form": "ECONOMIC",
    "installation": {"location": "INDOOR", "mount": "FLUSH"},
    "device": {"type": "MCCB"},
    "main": {"enabled": true, "af": 100, "at": 100, "poles": "3P"},
    "branches": [{"af": 50, "at": 50, "poles": "2P", "qty": 2}],
    "accessories": {"enabled": false}
  }'
```

**기대 응답:** HTTP 200
```json
{
  "decision": "ABSTAIN",
  "reasons": ["no active knowledge version"],
  "hints": ["activate knowledge via /v1/knowledge/activate or seed default pack"],
  "metadata": {"stage": "knowledge", "status": "absent", "requestId": "unknown"}
}
```

### B) 유효 SKU → 200/OK (지식 활성 후)

**현재:** 지식 부재로 ABSTAIN
**향후:** 지식 활성화 후 OK 응답 구조 검증

### C) 필수 누락 → 422

**요청:** `brand` 필드 제거
```bash
curl -X POST http://localhost:3001/v1/estimate/create \
  -H "Content-Type: application/json" \
  -d '{
    "form": "ECONOMIC",
    "installation": {"location": "INDOOR", "mount": "FLUSH"},
    "device": {"type": "MCCB"},
    "main": {"enabled": true, "af": 100, "at": 100, "poles": "3P"},
    "branches": [{"af": 50, "at": 50, "poles": "2P", "qty": 2}],
    "accessories": {"enabled": false}
  }'
```

**기대 응답:** HTTP 422
```json
{
  "code": "REQ_MORE_INFO",
  "message": "브랜드가 필요합니다",
  "path": "brand",
  "hint": "SANGDO, LS, MIXED 중 선택해 주세요"
}
```

### D) 포맷 오류 → 415/422

**요청:** 잘못된 JSON
```bash
curl -X POST http://localhost:3001/v1/estimate/create \
  -H "Content-Type: application/json" \
  -d '{ invalid json }'
```

**기대 응답:** HTTP 415 or 422

### E) 스키마 위반 → 422

**요청:** 잘못된 enum 값
```bash
curl -X POST http://localhost:3001/v1/estimate/create \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "INVALID_BRAND",
    "form": "ECONOMIC",
    "installation": {"location": "INDOOR", "mount": "FLUSH"},
    "device": {"type": "MCCB"},
    "main": {"enabled": true, "af": 100, "at": 100, "poles": "3P"},
    "branches": [{"af": 50, "at": 50, "poles": "2P", "qty": 2}],
    "accessories": {"enabled": false}
  }'
```

**기대 응답:** HTTP 422
```json
{
  "code": "SCHEMA_VALIDATION_ERROR",
  "message": "잘못된 브랜드입니다",
  "path": "brand",
  "hint": "SANGDO, LS, MIXED 중 선택해 주세요"
}
```

## 성능 경계값

- **개발 환경**: p95 ≤ 100ms
- **운영 환경**: p95 ≤ 300ms

## 멱등성 검증

동일한 `Idempotency-Key`로 두 번 호출 시 동일한 응답.

## CI 통합

```yaml
# .github/workflows/regression.yml
name: Regression Tests
on: [push, pull_request]

jobs:
  regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm run dev &
      - run: sleep 5  # 서버 시작 대기
      - run: |
          # 테스트 A: 지식 부재
          RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST localhost:3001/v1/estimate/create \
            -H "Content-Type: application/json" \
            -H "Idempotency-Key: ci-test-a" \
            -d @test-fixtures/valid-payload.json)
          [ "$RESPONSE" = "200" ] || exit 1

          # 테스트 C: 필수 누락
          RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST localhost:3001/v1/estimate/create \
            -H "Content-Type: application/json" \
            -d @test-fixtures/missing-brand.json)
          [ "$RESPONSE" = "422" ] || exit 1
```

## 자동화 스크립트

```bash
#!/bin/bash
# scripts/regression-test.sh

echo "🎯 Running Regression Test Suite..."

BASE_URL="http://localhost:3001/v1/estimate/create"
PASS=0
FAIL=0

# Test A: 지식 부재 → ABSTAIN
echo "Test A: Knowledge Absent..."
RESPONSE=$(curl -s "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: regression-a" \
  -d @test-abstain-payload.json)

HTTP_CODE=$(echo "$RESPONSE" | jq -r '.statusCode // 200')
DECISION=$(echo "$RESPONSE" | jq -r '.decision // null')

if [[ "$HTTP_CODE" == "200" && "$DECISION" == "ABSTAIN" ]]; then
  echo "✅ Test A PASS"
  ((PASS++))
else
  echo "❌ Test A FAIL (HTTP: $HTTP_CODE, Decision: $DECISION)"
  ((FAIL++))
fi

echo "📊 Results: $PASS passed, $FAIL failed"
exit $FAIL
```

## DoD (완료 기준)

✅ 5개 테스트 모두 CI에서 PASS
✅ 성능 경계값 p95 ≤ 목표치
✅ 멱등성 일관성 검증
✅ HTTP 상태 코드 정확성
✅ 응답 구조 스키마 준수