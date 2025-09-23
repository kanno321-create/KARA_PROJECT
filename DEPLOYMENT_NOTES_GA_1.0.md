# KIS Estimator GA 1.0.0 - 운영 배포 노트

## 📌 프리즈된 아티팩트 해시 (고정값)

```
dist/GA/KIS_Estimator_GA_1.0.zip:
SHA256: 0de4aaa84955cdda9c18f90e18ad2c017191f02d14f75bc11cb40f0d0ee4d451

dist/GA/DEPLOY_MANIFEST.json:
SHA256: d5ca39db9e764539cfa7ceb4490f68738e34bd2509e094599d6b8a38854b27a1
```

## 🚀 배포 절차

### 1. 아티팩트 배치

#### 배포 경로 (Windows)
```
C:\apps\kis\KIS_Estimator_GA_1.0\
```

#### 압축 해제 후 필수 파일 확인
- `deploy/fastmcp/server.mock.py`
- `scripts/mock_gateway.py`
- `scripts/evidence_bundler.py`
- `deploy/fastmcp/openapi_estimate_v1.yaml`
- `tests/regression/seeds/regression_seeds_v2.jsonl`
- `deploy/fastmcp/payload_samples/mock_scenarios_v1.json`

### 2. 환경변수 및 정책 설정

```powershell
# PowerShell 환경변수 설정
$env:RBAC_EVIDENCE = "ADMIN_ONLY"
$env:PORT = "8787"
$env:SSL = "RECOMMENDED"
$env:MIXED_EXCEPTIONS_MONTHLY = "2"
$env:KIS_ENV = "PRODUCTION"
```

### 3. 서비스 기동

#### 개발/테스트 환경
```powershell
cd C:\apps\kis\KIS_Estimator_GA_1.0
python -u deploy/fastmcp/server.mock.py
```

#### 운영 환경 (Windows Service)
```powershell
# NSSM을 사용한 서비스 등록
nssm install KIS_Estimator_GA "C:\Python\python.exe"
nssm set KIS_Estimator_GA AppDirectory "C:\apps\kis\KIS_Estimator_GA_1.0"
nssm set KIS_Estimator_GA AppParameters "-u deploy/fastmcp/server.mock.py"
nssm set KIS_Estimator_GA Start SERVICE_AUTO_START
nssm start KIS_Estimator_GA
```

### 4. 배포 직후 스모크 테스트 (3종)

#### Health Check
```powershell
# PowerShell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8787/v1/health

# Expected: {"ok": true, "ts": "2025-09-23T..."}
```

#### Create Estimate (정상 케이스)
```bash
curl -X POST http://127.0.0.1:8787/v1/estimate/create \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "SANGDO",
    "form": "ECONOMIC",
    "installation": {"location": "INDOOR", "mount": "FLUSH"},
    "device": {"type": "MCCB"},
    "main": {"af": 600, "poles": "3P"},
    "branches": [{"af": 100, "poles": "3P", "qty": 1}],
    "accessories": {"enabled": false, "items": []}
  }'

# Expected: 200 OK with enclosure dimensions
```

#### Evidence Bundle (실제 ZIP 반환)
```bash
curl http://127.0.0.1:8787/v1/estimate/ABC123/evidence

# Expected: 200 OK with base64 encoded ZIP bundle
```

### 5. 회귀 테스트 재확인 (선택사항)
```powershell
cd C:\apps\kis\KIS_Estimator_GA_1.0
python tests/regression/run_regression.py

# Expected: pass=40/40
```

## 📊 SLO (Service Level Objectives)

### 핵심 지표
- **응답시간**: p95 ≤ 30ms
- **오류율**: < 0.5%
- **처리시간**: TAT 중앙값 ≤ 2분
- **자동처리율**: ≥ 70%

### 로깅 구조
```
logs/
├── app_{YYYYMMDD}.log          # 애플리케이션 로그
├── evidence/
│   ├── {trace_id}_bundle.zip   # Evidence 번들
│   └── {trace_id}_sha256.txt   # SHA256 체크섬
└── audit/
    └── rbac_{YYYYMMDD}.log      # RBAC 감사 로그
```

### 대시보드 모니터링 지표
- `http_2xx_count` / `http_4xx_count` / `http_5xx_count`
- `latency_p95_ms`
- `evidence_zip_bytes_avg`
- `mixed_exceptions_used_monthly`

## 🔒 RBAC 권한 체계

### 엔드포인트별 권한
| Endpoint | 일반 사용자 | 관리자 |
|----------|------------|--------|
| `/v1/health` | ✅ | ✅ |
| `/v1/estimate/create` | ✅ | ✅ |
| `/v1/estimate/validate` | ✅ | ✅ |
| `/v1/estimate/{id}/evidence` | 메타데이터만 | 전체 ZIP 다운로드 |

### 권한 검증 (관리자 토큰 예시)
```bash
# 관리자 권한으로 Evidence 다운로드
curl http://127.0.0.1:8787/v1/estimate/ABC123/evidence \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

## 📢 배포 커뮤니케이션

### 배포 완료 메시지 템플릿
```
[KIS Estimator GA 1.0.0 배포 완료]

- 버전: GA-1.0.0
- 배포 시간: 2025-09-23 12:00:00 KST
- 서버: prod-kis-01
- 포트: 8787
- 아티팩트 SHA256: 0de4aaa8...0ee4d451
- MANIFEST SHA256: d5ca39db...854b27a1
- 승인자: CEO
- 상태: ACTIVE

모니터링 대시보드: http://monitor.kis.local/estimator
```

## 🔄 핫스탠바이 및 모니터링

### 1시간 집중 모니터링 기준
- **알람 트리거**:
  - 5xx 에러 > 5회/분
  - p95 > 50ms (5분 지속)
  - MIXED 월 한도 초과
  - 메모리 사용률 > 80%

### 모니터링 명령어
```powershell
# 포트 상태 확인
netstat -an | findstr :8787

# 프로세스 확인
tasklist | findstr python

# 로그 실시간 확인
Get-Content logs\app_20250923.log -Wait
```

## ⚠️ 롤백 플랜 (3분 이내)

### 롤백 트리거
- 스모크 테스트 실패
- 회귀 테스트 실패
- 5xx 에러 급증
- p95 > 200ms 지속

### 롤백 절차
```powershell
# 1. 현재 프로세스 종료
nssm stop KIS_Estimator_GA
taskkill /F /IM python.exe

# 2. 포트 해제 확인
netstat -an | findstr :8787

# 3. 이전 안정판으로 복구
cd C:\apps\kis\KIS_Estimator_GA_0.9
nssm start KIS_Estimator_GA_0.9

# 4. 스모크 테스트 재확인
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8787/v1/health
```

### 롤백 후 조치
- JIRA 이슈 생성
- 증거 수집: 로그, Evidence ZIP, SHA256
- 근본 원인 분석
- 핫픽스 계획 수립

## 🔐 보안 및 감사

### Evidence 보관 정책
- **30일**: 전체 ZIP 파일 보관
- **90일**: 메타데이터 및 SHA256만 보관
- **90일 초과**: 아카이빙 후 삭제

### 감사 로그 필수 항목
```json
{
  "timestamp": "2025-09-23T12:00:00",
  "endpoint": "/v1/estimate/{id}/evidence",
  "user_id": "admin_001",
  "client_ip": "192.168.1.100",
  "trace_id": "TRC-ABC123-1234567890",
  "sha256": "0de4aaa8...0ee4d451",
  "action": "DOWNLOAD",
  "status": "SUCCESS"
}
```

### OpenAPI 해시 검증
```powershell
# OpenAPI 명세 변경 감지
$expected = "8e1452e052578a21daf423e6ea1974ca4a5332b10b17d9b2a310945261d1c6b0"
$actual = (Get-FileHash deploy\fastmcp\openapi_estimate_v1.yaml -Algorithm SHA256).Hash

if ($actual -ne $expected) {
    Write-Error "OpenAPI spec changed! Re-run gate validation"
    exit 1
}
```

## 📈 향후 개선 계획

### Phase 1 (1개월)
- Nginx 리버스 프록시 + TLS 설정
- Autoscaling (2-4 인스턴스)
- Prometheus 메트릭 수집

### Phase 2 (3개월)
- 표준형 증빙 워크플로우
- PDF 자동 생성 및 첨부
- MIXED 한도 실시간 대시보드

### Phase 3 (6개월)
- GraphQL API 추가
- 다국어 지원 (EN, CN, JP)
- AI 기반 이상 감지

---

**문서 작성일**: 2025-09-23
**작성자**: KIS DevOps Team
**승인자**: CEO
**버전**: 1.0.0