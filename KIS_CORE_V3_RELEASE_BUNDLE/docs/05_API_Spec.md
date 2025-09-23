# 05_API_Spec.md

## API 명세서 (API Specification)

### 기본 정보 (Basic Information)

- **Base URL**: `https://api.kis-core.com/v1`
- **Protocol**: HTTPS only
- **Authentication**: Bearer Token (JWT)
- **Content-Type**: `application/json`
- **API Version**: v1.0.0

### 공통 헤더 (Common Headers)

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Request-ID: <unique_request_id>
X-Client-Version: <client_version>
Accept: application/json
```

## 핵심 API 엔드포인트 (Core API Endpoints)

### 1. 견적 API (Estimate API)

#### POST /v1/estimate - 견적 생성

**요청 (Request)**:
```json
{
  "customerId": "cust_12345",
  "projectName": "산업용 로봇 설치 프로젝트",
  "projectType": "INDUSTRIAL_AUTOMATION",
  "urgency": "NORMAL",
  "estimateItems": [
    {
      "category": "HARDWARE",
      "itemCode": "ROBOT_ARM_001",
      "itemName": "6축 산업용 로봇 암",
      "quantity": 2,
      "unitType": "EA",
      "specifications": {
        "payload": "10kg",
        "reach": "1200mm",
        "accuracy": "±0.1mm"
      },
      "requirements": [
        "IP65 방진방수",
        "CE 인증 필수"
      ]
    },
    {
      "category": "SOFTWARE",
      "itemCode": "CONTROL_SW_001",
      "itemName": "로봇 제어 소프트웨어",
      "quantity": 1,
      "unitType": "LICENSE",
      "specifications": {
        "version": "v2.5",
        "language": "Korean/English"
      }
    },
    {
      "category": "SERVICE",
      "itemCode": "INSTALL_SVC_001",
      "itemName": "설치 및 시운전 서비스",
      "quantity": 40,
      "unitType": "HOUR",
      "requirements": [
        "현장 기술자 2명",
        "평일 작업 선호"
      ]
    }
  ],
  "deliveryLocation": {
    "address": "경기도 성남시 분당구 판교역로 166",
    "postalCode": "13494",
    "contactPerson": "김엔지니어",
    "phone": "031-1234-5678"
  },
  "timeline": {
    "estimateDeadline": "2025-10-15T23:59:59Z",
    "projectStartDate": "2025-11-01T09:00:00Z",
    "projectEndDate": "2025-12-31T18:00:00Z"
  },
  "budgetRange": {
    "min": 50000000,
    "max": 100000000,
    "currency": "KRW"
  },
  "specialRequirements": [
    "기존 PLC 시스템과 연동 필요",
    "3D 시뮬레이션 데모 제공",
    "1년 무상 A/S 포함"
  ]
}
```

**응답 (Response)**:
```json
{
  "success": true,
  "data": {
    "estimateId": "est_67890",
    "estimateNumber": "EST-2025-001234",
    "status": "PROCESSING",
    "createdAt": "2025-09-22T10:30:00Z",
    "estimatedCompletionTime": "2025-09-22T12:30:00Z",
    "summary": {
      "totalItems": 3,
      "estimatedValue": {
        "subtotal": 87500000,
        "tax": 8750000,
        "total": 96250000,
        "currency": "KRW"
      },
      "confidence": 0.89,
      "riskFactors": [
        "Custom integration required",
        "Tight timeline"
      ]
    },
    "aiInsights": {
      "priceOptimization": "10% cost reduction possible with alternative components",
      "marketComparison": "15% below market average",
      "recommendedMargin": 0.18
    }
  },
  "meta": {
    "requestId": "req_abc123",
    "processingTime": 1.23,
    "apiVersion": "v1.0.0"
  }
}
```

### 2. 견적 검증 API (Validation API)

#### POST /v1/validate - 견적 검증

**요청 (Request)**:
```json
{
  "estimateId": "est_67890",
  "validationType": "COMPREHENSIVE",
  "checkpoints": [
    "PRICE_ACCURACY",
    "TECHNICAL_FEASIBILITY",
    "TIMELINE_REALITY",
    "COMPLIANCE_CHECK"
  ],
  "validationLevel": "DETAILED"
}
```

**응답 (Response)**:
```json
{
  "success": true,
  "data": {
    "validationId": "val_54321",
    "estimateId": "est_67890",
    "validationStatus": "COMPLETED",
    "overallScore": 94,
    "validationResults": [
      {
        "checkpoint": "PRICE_ACCURACY",
        "status": "PASS",
        "score": 96,
        "details": "Price within 3% of market benchmark",
        "confidence": 0.94
      },
      {
        "checkpoint": "TECHNICAL_FEASIBILITY",
        "status": "PASS",
        "score": 92,
        "details": "All components compatible and available",
        "warnings": ["Lead time for ROBOT_ARM_001 is 8-10 weeks"]
      },
      {
        "checkpoint": "TIMELINE_REALITY",
        "status": "WARNING",
        "score": 85,
        "details": "Timeline is aggressive but achievable",
        "recommendations": ["Consider 2-week buffer for integration testing"]
      },
      {
        "checkpoint": "COMPLIANCE_CHECK",
        "status": "PASS",
        "score": 98,
        "details": "All regulatory requirements met"
      }
    ],
    "recommendations": [
      {
        "type": "OPTIMIZATION",
        "priority": "HIGH",
        "description": "Consider bulk discount for hardware items",
        "potentialSavings": 2500000
      },
      {
        "type": "RISK_MITIGATION",
        "priority": "MEDIUM",
        "description": "Establish backup supplier for critical components"
      }
    ],
    "complianceChecks": {
      "safetyStandards": "PASS",
      "environmentalRegulations": "PASS",
      "qualityCertifications": "PASS"
    }
  },
  "meta": {
    "validatedAt": "2025-09-22T11:15:00Z",
    "validationDuration": 2.15,
    "aiModelVersion": "v2.3.1"
  }
}
```

### 3. 헬스 체크 API (Health Check API)

#### GET /v1/health - 시스템 상태 확인

**응답 (Response)**:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-22T10:30:00Z",
  "version": "v1.0.0",
  "services": {
    "estimator": {
      "status": "healthy",
      "responseTime": 45,
      "lastCheck": "2025-09-22T10:29:50Z"
    },
    "ai_engine": {
      "status": "healthy",
      "responseTime": 120,
      "lastCheck": "2025-09-22T10:29:55Z",
      "modelVersion": "v2.3.1"
    },
    "database": {
      "status": "healthy",
      "responseTime": 12,
      "connections": {
        "active": 15,
        "idle": 5,
        "max": 100
      }
    },
    "cache": {
      "status": "healthy",
      "responseTime": 3,
      "hitRate": 0.89,
      "memoryUsage": 0.67
    }
  },
  "metrics": {
    "requestsPerMinute": 45,
    "averageResponseTime": 156,
    "errorRate": 0.001,
    "uptime": 2592000
  }
}
```

## 추가 API 엔드포인트 (Additional API Endpoints)

### 견적 관리 (Estimate Management)

```http
GET    /v1/estimates              # 견적 목록 조회
GET    /v1/estimates/{id}         # 특정 견적 조회
PUT    /v1/estimates/{id}         # 견적 수정
DELETE /v1/estimates/{id}         # 견적 삭제
POST   /v1/estimates/{id}/approve # 견적 승인
POST   /v1/estimates/{id}/reject  # 견적 거부
GET    /v1/estimates/{id}/history # 견적 이력 조회
POST   /v1/estimates/{id}/copy    # 견적 복사
```

### 템플릿 관리 (Template Management)

```http
GET    /v1/templates              # 템플릿 목록
GET    /v1/templates/{id}         # 템플릿 조회
POST   /v1/templates              # 템플릿 생성
PUT    /v1/templates/{id}         # 템플릿 수정
DELETE /v1/templates/{id}         # 템플릿 삭제
```

### AI 분석 (AI Analytics)

```http
POST   /v1/ai/predict             # AI 예측 요청
POST   /v1/ai/analyze             # 데이터 분석
GET    /v1/ai/insights            # AI 인사이트 조회
POST   /v1/ai/feedback            # AI 피드백 제출
```

### 파일 처리 (File Processing)

```http
POST   /v1/files/upload           # 파일 업로드
GET    /v1/files/{id}             # 파일 다운로드
POST   /v1/ocr/process            # OCR 처리
GET    /v1/ocr/results/{id}       # OCR 결과 조회
```

## 에러 응답 (Error Responses)

### 표준 에러 형식

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": [
      {
        "field": "customerId",
        "code": "REQUIRED",
        "message": "Customer ID is required"
      },
      {
        "field": "estimateItems[0].quantity",
        "code": "MIN_VALUE",
        "message": "Quantity must be greater than 0"
      }
    ],
    "timestamp": "2025-09-22T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### HTTP 상태 코드

| 코드 | 의미 | 설명 |
|------|------|------|
| 200 | OK | 요청 성공 |
| 201 | Created | 리소스 생성 성공 |
| 400 | Bad Request | 잘못된 요청 |
| 401 | Unauthorized | 인증 실패 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스 없음 |
| 409 | Conflict | 리소스 충돌 |
| 422 | Unprocessable Entity | 처리 불가능한 요청 |
| 429 | Too Many Requests | 요청 제한 초과 |
| 500 | Internal Server Error | 서버 내부 오류 |
| 503 | Service Unavailable | 서비스 일시 중단 |

## 인증 및 보안 (Authentication & Security)

### JWT 토큰 구조

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_12345",
    "iat": 1726996200,
    "exp": 1727000800,
    "iss": "kis-core-auth",
    "aud": "kis-core-api",
    "roles": ["estimator", "manager"],
    "permissions": ["estimate:create", "estimate:read"]
  }
}
```

### Rate Limiting

| 엔드포인트 | 제한 | 기간 |
|------------|------|------|
| `/v1/estimate` | 100 requests | 15분 |
| `/v1/validate` | 50 requests | 15분 |
| `/v1/ai/*` | 30 requests | 15분 |
| `/v1/health` | 1000 requests | 1분 |

## API 사용 예시 (Usage Examples)

### SDK 사용 예시 (JavaScript)

```javascript
const KisClient = require('@kis-core/api-client');

const client = new KisClient({
  baseURL: 'https://api.kis-core.com/v1',
  apiKey: 'your-api-key',
  timeout: 30000
});

// 견적 생성
const estimate = await client.estimates.create({
  customerId: 'cust_12345',
  projectName: '산업용 로봇 설치',
  estimateItems: [/* ... */]
});

// 견적 검증
const validation = await client.validate({
  estimateId: estimate.estimateId,
  validationType: 'COMPREHENSIVE'
});

console.log('Validation Score:', validation.overallScore);
```

### cURL 예시

```bash
# 견적 생성
curl -X POST https://api.kis-core.com/v1/estimate \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @estimate_request.json

# 헬스 체크
curl -X GET https://api.kis-core.com/v1/health \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## 성능 지표 (Performance Metrics)

### SLA 목표
- **응답 시간**: p95 ≤ 2100ms
- **가용성**: 99.5% uptime
- **처리량**: 1000 req/min
- **에러율**: < 0.1%

### 모니터링 메트릭
- Request count per endpoint
- Response time percentiles
- Error rate by status code
- Active connections
- Queue depth

---
*문서 버전: 1.0*  
*최종 수정: 2025-09-22*  
*승인자: 이충원 (대표이사)*