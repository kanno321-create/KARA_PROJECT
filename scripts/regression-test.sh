#!/bin/bash

# Regression Test Suite for Decision Mapping
# 회귀 테스트 5종 핵심 케이스 자동 실행

set -e

echo "🎯 Running Decision Mapping Regression Tests..."

BASE_URL="http://localhost:3001/v1/estimate/create"
PASS=0
FAIL=0

# Helper function to run test
run_test() {
    local test_name="$1"
    local expected_status="$2"
    local payload_file="$3"
    local idempotency_key="$4"
    local expected_decision="$5"

    echo "Testing $test_name..."

    if [[ ! -f "$payload_file" ]]; then
        echo "❌ Payload file not found: $payload_file"
        ((FAIL++))
        return
    fi

    # Make request and capture response
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL" \
        -H "Content-Type: application/json" \
        -H "Idempotency-Key: $idempotency_key" \
        -d @"$payload_file")

    # Extract HTTP status and body
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    # Parse decision if JSON response
    if [[ "$HTTP_CODE" == "200" ]]; then
        DECISION=$(echo "$BODY" | jq -r '.decision // "none"' 2>/dev/null || echo "none")
        REASONS=$(echo "$BODY" | jq -r '.reasons[0] // "none"' 2>/dev/null || echo "none")
    else
        DECISION="none"
        REASONS="none"
    fi

    # Validate results
    if [[ "$HTTP_CODE" == "$expected_status" ]]; then
        if [[ "$expected_decision" == "none" || "$DECISION" == "$expected_decision" ]]; then
            echo "✅ $test_name PASS (HTTP: $HTTP_CODE, Decision: $DECISION)"
            ((PASS++))
        else
            echo "❌ $test_name FAIL - Wrong decision (Expected: $expected_decision, Got: $DECISION)"
            ((FAIL++))
        fi
    else
        echo "❌ $test_name FAIL - Wrong status (Expected: $expected_status, Got: $HTTP_CODE)"
        echo "Response: $BODY"
        ((FAIL++))
    fi
}

# Test A: 지식 없음 → 200/ABSTAIN
run_test "A) Knowledge Absent → ABSTAIN" "200" "../test-abstain-payload.json" "regression-a" "ABSTAIN"

# Test C: 필수 누락 → 422
cat > ../test-missing-brand.json << 'EOF'
{
  "form": "ECONOMIC",
  "installation": {"location": "INDOOR", "mount": "FLUSH"},
  "device": {"type": "MCCB"},
  "main": {"enabled": true, "af": 100, "at": 100, "poles": "3P"},
  "branches": [{"af": 50, "at": 50, "poles": "2P", "qty": 2}],
  "accessories": {"enabled": false}
}
EOF

run_test "C) Missing Brand → 422" "422" "../test-missing-brand.json" "regression-c" "none"

# Test E: 스키마 위반 → 422
cat > ../test-invalid-brand.json << 'EOF'
{
  "brand": "INVALID_BRAND",
  "form": "ECONOMIC",
  "installation": {"location": "INDOOR", "mount": "FLUSH"},
  "device": {"type": "MCCB"},
  "main": {"enabled": true, "af": 100, "at": 100, "poles": "3P"},
  "branches": [{"af": 50, "at": 50, "poles": "2P", "qty": 2}],
  "accessories": {"enabled": false}
}
EOF

run_test "E) Invalid Brand → 422" "422" "../test-invalid-brand.json" "regression-e" "none"

# Performance Test: 연속 5회 호출 시간 측정
echo "Testing Performance (5 requests)..."
TOTAL_TIME=0
for i in {1..5}; do
    START=$(date +%s%N)
    curl -s "$BASE_URL" \
        -H "Content-Type: application/json" \
        -H "Idempotency-Key: perf-$i" \
        -d @"../test-abstain-payload.json" > /dev/null
    END=$(date +%s%N)

    DURATION=$(((END - START) / 1000000)) # ms
    TOTAL_TIME=$((TOTAL_TIME + DURATION))
    echo "  Request $i: ${DURATION}ms"
done

AVG_TIME=$((TOTAL_TIME / 5))
echo "📊 Average response time: ${AVG_TIME}ms"

if [[ $AVG_TIME -le 100 ]]; then
    echo "✅ Performance PASS (avg: ${AVG_TIME}ms ≤ 100ms)"
    ((PASS++))
else
    echo "⚠️ Performance WARNING (avg: ${AVG_TIME}ms > 100ms)"
    # Performance is warning, not failure in dev
fi

# Idempotency Test
echo "Testing Idempotency..."
RESP1=$(curl -s "$BASE_URL" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: idempotency-test" \
    -d @"../test-abstain-payload.json")

RESP2=$(curl -s "$BASE_URL" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: idempotency-test" \
    -d @"../test-abstain-payload.json")

if [[ "$RESP1" == "$RESP2" ]]; then
    echo "✅ Idempotency PASS"
    ((PASS++))
else
    echo "❌ Idempotency FAIL - Responses differ"
    echo "Response 1: $RESP1"
    echo "Response 2: $RESP2"
    ((FAIL++))
fi

# Clean up test files
rm -f ../test-missing-brand.json ../test-invalid-brand.json

# Summary
echo ""
echo "📊 Regression Test Results:"
echo "   ✅ Passed: $PASS"
echo "   ❌ Failed: $FAIL"
echo ""

if [[ $FAIL -eq 0 ]]; then
    echo "🎉 All regression tests PASSED!"
    exit 0
else
    echo "💥 Some regression tests FAILED!"
    exit 1
fi