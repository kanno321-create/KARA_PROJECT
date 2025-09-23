# 04_Architecture.md

## 시스템 아키텍처 개요 (System Architecture Overview)

### 고수준 아키텍처 (High-Level Architecture)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Layer  │    │  Gateway Layer  │    │ Service Layer   │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Web UI    │ │◄──►│ │ API Gateway │ │◄──►│ │ Estimator   │ │
│ │  (React)    │ │    │ │  (Express)  │ │    │ │   Service   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Mobile    │ │◄──►│ │Load Balancer│ │◄──►│ │   ERP-AI    │ │
│ │ Web Browser │ │    │ │   (Nginx)   │ │    │ │   Service   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲                        │
                                │                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Security Layer │    │   Data Layer    │
                       │                 │    │                 │
                       │ ┌─────────────┐ │    │ ┌─────────────┐ │
                       │ │    Auth     │ │    │ │ PostgreSQL  │ │
                       │ │  Service    │ │    │ │  (Primary)  │ │
                       │ └─────────────┘ │    │ └─────────────┘ │
                       │                 │    │                 │
                       │ ┌─────────────┐ │    │ ┌─────────────┐ │
                       │ │   Rate      │ │    │ │    Redis    │ │
                       │ │ Limiting    │ │    │ │   (Cache)   │ │
                       │ └─────────────┘ │    │ └─────────────┘ │
                       └─────────────────┘    └─────────────────┘
```

## 서비스 분리 아키텍처 (Service Separation Architecture)

### Estimator Service (견적 서비스)
**책임 영역**:
- 견적 생성 및 계산 로직
- 견적 템플릿 관리
- 견적 이력 추적
- 견적 승인 워크플로우

**기술 스택**:
- Runtime: Node.js 18+ / Express.js
- Database: PostgreSQL (견적 데이터)
- Cache: Redis (계산 결과 캐시)
- Queue: Redis Bull (배경 작업)

**API 엔드포인트**:
```
POST   /v1/estimates          # 견적 생성
GET    /v1/estimates/:id      # 견적 조회
PUT    /v1/estimates/:id      # 견적 수정
DELETE /v1/estimates/:id      # 견적 삭제
POST   /v1/estimates/:id/approve # 견적 승인
GET    /v1/estimates/templates    # 템플릿 목록
```

### ERP-AI Service (ERP AI 서비스)
**책임 영역**:
- AI 모델 추론 및 예측
- 기존 ERP 시스템 연동
- 데이터 분석 및 인사이트
- OCR 문서 처리

**기술 스택**:
- Runtime: Python 3.11+ / FastAPI
- ML Framework: TensorFlow/PyTorch
- Database: PostgreSQL (분석 데이터)
- Queue: Celery (ML 작업)

**API 엔드포인트**:
```
POST   /v1/ai/predict        # AI 예측 요청
POST   /v1/ai/analyze        # 데이터 분석
POST   /v1/ocr/process       # OCR 문서 처리
GET    /v1/erp/sync          # ERP 동기화 상태
POST   /v1/erp/import        # ERP 데이터 가져오기
```

## 게이트웨이 아키텍처 (Gateway Architecture)

### API Gateway 기능
- **라우팅**: 서비스별 요청 라우팅
- **인증/인가**: JWT 토큰 검증
- **Rate Limiting**: API 호출 제한
- **로그 수집**: 중앙화된 로깅
- **캐시**: 응답 캐시 관리

### 게이트웨이 설정
```javascript
// Gateway Configuration
const routes = {
  '/api/v1/estimates/*': 'http://estimator-service:3001',
  '/api/v1/ai/*': 'http://erp-ai-service:8000',
  '/api/v1/auth/*': 'http://auth-service:3002',
  '/api/v1/health': 'http://gateway:3000/health'
};

const rateLimits = {
  '/api/v1/estimates': { max: 100, window: '15m' },
  '/api/v1/ai': { max: 50, window: '15m' },
  '/api/v1/auth': { max: 20, window: '15m' }
};
```

## 데이터 경계 (Data Boundaries)

### 데이터베이스 분리 전략

#### Estimator Database
```sql
-- 견적 관련 테이블
TABLES:
- estimates (견적 기본 정보)
- estimate_items (견적 항목)
- estimate_templates (견적 템플릿)
- estimate_approvals (승인 정보)
- customers (고객 정보)
- products (제품 정보)
```

#### ERP-AI Database
```sql
-- AI/분석 관련 테이블
TABLES:
- ml_models (ML 모델 메타데이터)
- predictions (예측 결과)
- training_data (학습 데이터)
- analytics_events (분석 이벤트)
- erp_sync_logs (ERP 동기화 로그)
- document_processing (문서 처리 이력)
```

#### Shared Database
```sql
-- 공통 테이블
TABLES:
- users (사용자 정보)
- roles (역할 정보)
- permissions (권한 정보)
- audit_logs (감사 로그)
- system_configs (시스템 설정)
```

### 데이터 동기화 전략
- **Event-Driven**: Kafka/Redis Streams를 통한 이벤트 기반 동기화
- **Batch Sync**: 일괄 동기화 (일일/주간)
- **Real-time**: WebSocket을 통한 실시간 동기화

## 보안 아키텍처 (Security Architecture)

### 인증/인가 계층
```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                         │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Network Security (VPC, Firewall, WAF)             │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: API Gateway (Rate Limiting, Input Validation)     │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: Authentication (JWT, OAuth 2.0, MFA)              │
├─────────────────────────────────────────────────────────────┤
│ Layer 4: Authorization (RBAC, Resource-based)              │
├─────────────────────────────────────────────────────────────┤
│ Layer 5: Application Security (Input Sanitization, OWASP)  │
├─────────────────────────────────────────────────────────────┤
│ Layer 6: Data Security (Encryption, Masking, Auditing)     │
└─────────────────────────────────────────────────────────────┘
```

### 보안 정책
- **Encryption at Rest**: AES-256
- **Encryption in Transit**: TLS 1.3
- **Key Management**: Azure Key Vault / AWS KMS
- **Secrets Management**: HashiCorp Vault
- **Access Control**: Zero Trust Architecture

## 배포 아키텍처 (Deployment Architecture)

### 컨테이너화 전략
```yaml
# Docker Compose Structure
services:
  # Frontend
  web-ui:
    image: kis-web-ui:latest
    ports: ["80:80", "443:443"]
  
  # Gateway
  api-gateway:
    image: kis-gateway:latest
    ports: ["3000:3000"]
  
  # Services
  estimator-service:
    image: kis-estimator:latest
    ports: ["3001:3001"]
  
  erp-ai-service:
    image: kis-erp-ai:latest
    ports: ["8000:8000"]
  
  # Databases
  postgresql:
    image: postgres:15
    volumes: ["./data:/var/lib/postgresql/data"]
  
  redis:
    image: redis:7-alpine
    volumes: ["./redis-data:/data"]
```

### 클라우드 아키텍처
```
┌─────────────────────────────────────────────────────────────┐
│                    Cloud Infrastructure                    │
├─────────────────────────────────────────────────────────────┤
│ CDN (CloudFront/CloudFlare) → Static Assets                │
├─────────────────────────────────────────────────────────────┤
│ Load Balancer (ALB/NLB) → Traffic Distribution             │
├─────────────────────────────────────────────────────────────┤
│ Auto Scaling Group → Dynamic Scaling                       │
├─────────────────────────────────────────────────────────────┤
│ EKS/AKS Cluster → Container Orchestration                  │
├─────────────────────────────────────────────────────────────┤
│ RDS/PostgreSQL → Managed Database                          │
├─────────────────────────────────────────────────────────────┤
│ ElastiCache/Redis → Managed Cache                          │
├─────────────────────────────────────────────────────────────┤
│ S3/Blob Storage → Object Storage                           │
└─────────────────────────────────────────────────────────────┘
```

## 모니터링 및 관측성 (Monitoring & Observability)

### 메트릭 수집
- **Application Metrics**: Prometheus + Grafana
- **Infrastructure Metrics**: CloudWatch/Azure Monitor
- **Business Metrics**: Custom Dashboard
- **Real-time Alerts**: PagerDuty/Slack Integration

### 로깅 전략
```javascript
// Structured Logging Format
{
  "timestamp": "2025-09-22T10:30:00Z",
  "level": "INFO",
  "service": "estimator-service",
  "traceId": "abc123",
  "spanId": "def456",
  "userId": "user123",
  "action": "create_estimate",
  "estimateId": "est789",
  "duration": 1250,
  "success": true
}
```

### 분산 추적
- **Jaeger/Zipkin**: 마이크로서비스 간 추적
- **OpenTelemetry**: 표준 텔레메트리 수집
- **APM Tools**: New Relic/DataDog 통합

## 성능 최적화 (Performance Optimization)

### 캐시 전략
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │   CDN Cache     │    │  Application    │
│   Cache         │    │   (Static)      │    │   Cache         │
│   (LocalStorage)│    │   TTL: 24h      │    │   (Redis)       │
│   TTL: 1h       │    │                 │    │   TTL: 15m      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                               │
                    ┌─────────────────┐
                    │   Database      │
                    │   Query Cache   │
                    │   TTL: 5m       │
                    └─────────────────┘
```

### 데이터베이스 최적화
- **Read Replicas**: 읽기 전용 복제본
- **Connection Pooling**: 연결 풀 관리
- **Query Optimization**: 인덱스 최적화
- **Partitioning**: 테이블 분할

## 확장성 설계 (Scalability Design)

### 수평 확장 전략
- **Stateless Services**: 무상태 서비스 설계
- **Database Sharding**: 데이터베이스 샤딩
- **Message Queues**: 비동기 처리
- **Event Sourcing**: 이벤트 기반 아키텍처

### 부하 분산
```yaml
# Load Balancing Configuration
upstream estimator_service {
  least_conn;
  server estimator-1:3001 weight=3;
  server estimator-2:3001 weight=2;
  server estimator-3:3001 weight=1;
}

upstream erp_ai_service {
  ip_hash;
  server erp-ai-1:8000;
  server erp-ai-2:8000;
  server erp-ai-3:8000;
}
```

## 재해 복구 (Disaster Recovery)

### 백업 전략
- **Database Backup**: 일일 전체, 시간별 증분
- **File Backup**: S3 Cross-Region Replication
- **Configuration Backup**: Git Repository
- **Secrets Backup**: Encrypted Vault Backup

### 복구 절차
1. **RTO Target**: 4시간 이내
2. **RPO Target**: 1시간 이내
3. **Failover Process**: 자동 장애 조치
4. **Data Validation**: 복구 후 데이터 검증

---
*문서 버전: 1.0*  
*최종 수정: 2025-09-22*  
*승인자: 이충원 (대표이사)*