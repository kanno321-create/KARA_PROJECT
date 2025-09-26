# 견적 API 결정 매핑 테이블

## HTTP 상태 코드별 처리 규칙

### 422 - 스키마/필수 누락 전용
```json
{
  "code": "REQ_MORE_INFO|SCHEMA_VALIDATION_ERROR",
  "message": "구체적인 누락/오류 설명",
  "path": "field.path.to.error",
  "hint": "해결 방법 안내"
}
```

**적용 케이스:**
- 필수 필드 누락: `brand`, `main.af+at`, `branches[].qty` 등
- 스키마 위반: 잘못된 enum 값, 타입 불일치
- 비즈니스 규칙 위반: 3-gate 최소 요구사항 등

### 200 - 도메인 결정 (OK / ABSTAIN / REJECT)

#### OK - 정상 견적 생성
```json
{
  "decision": "OK",
  "estimate": {
    "id": "uuid",
    "brand": "SANGDO",
    "enclosure": { "W": 400, "H": 600, "D": 200 },
    "status": "validated",
    // ... 전체 견적 정보
  }
}
```

#### ABSTAIN - 지식/정보 부족으로 견적 보류
```json
{
  "decision": "ABSTAIN",
  "reasons": [
    "no active knowledge version",
    "unknown SKU pattern",
    "ambiguous specification"
  ],
  "hints": [
    "activate knowledge via /v1/knowledge/activate",
    "provide model number or detailed specifications",
    "contact support for manual review"
  ],
  "metadata": {
    "stage": "knowledge|validation|calculation",
    "status": "absent|insufficient|ambiguous",
    "requestId": "correlation-id"
  }
}
```

**ABSTAIN 케이스:**
- **지식 부재**: `"no active knowledge version"`
- **SKU 미해결**: 모델명/규격 매치 실패
- **모호한 사양**: 충돌하는 요구사항, 불완전한 정보

#### REJECT - 명확한 거부 사유
```json
{
  "decision": "REJECT",
  "reasons": [
    "unsupported product combination",
    "safety regulation violation",
    "discontinued product line"
  ],
  "hints": [
    "try alternative brand/model",
    "consult safety guidelines",
    "check current product catalog"
  ],
  "metadata": {
    "stage": "business_rules",
    "status": "rejected",
    "requestId": "correlation-id"
  }
}
```

### 500 - 엔진 예외 (버그)
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "예상치 못한 시스템 오류가 발생했습니다",
    "requestId": "correlation-id"
  }
}
```

**500 트리거:**
- 데이터베이스 연결 실패
- 외부 API 시스템 장애
- 코드 버그 (null reference, type error)
- 설정 오류, 환경 문제

## 결정 흐름도

```
Request → Pre-Gate Validation → 422 (스키마/필수)
          ↓ PASS
          Business Logic → Knowledge Check → ABSTAIN (지식 부재)
          ↓ PASS            ↓ PASS
          Calculation → OK (성공) | REJECT (비즈니스 규칙)
          ↓ ERROR
          500 (시스템 예외)
```

## 로그 키 표준화

```javascript
// stage: 어느 단계에서 결정되었는지
// decision: 최종 결정 (OK/ABSTAIN/REJECT)
// reason: 구체적 사유
// requestId: 요청 추적 ID
// latency_ms: 응답 시간

logger.info('Decision made', {
  stage: 'knowledge|validation|calculation|business_rules',
  decision: 'OK|ABSTAIN|REJECT',
  reason: 'no_active_knowledge|invalid_schema|calculation_success',
  requestId: req.headers['x-request-id'],
  latency_ms: Date.now() - startTime,
  http_status: 200|422|500
});
```

## 메트릭 카운터

```javascript
// 결정별 카운터
estimate_decision_total{decision="OK"}
estimate_decision_total{decision="ABSTAIN"}
estimate_decision_total{decision="REJECT"}

// 에러별 카운터
estimate_error_total{type="schema_validation", status="422"}
estimate_error_total{type="system_error", status="500"}

// 성능 히스토그램
estimate_duration_seconds{decision="OK", p95=0.1}
```

## DoD (완료 기준)

✅ **일관성**: 동일 입력 → 동일 응답 (HTTP 상태 + 본문 구조)
✅ **추적성**: 모든 결정에 `requestId`, `stage`, `reason` 포함
✅ **관측성**: 로그에서 결정 분포와 오류율 즉시 확인 가능
✅ **명확성**: reasons/hints로 사용자 액션 가이드
✅ **성능**: p95 ≤ 100ms (dev), ≤ 300ms (prod)