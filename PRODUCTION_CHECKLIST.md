# ✅ KIS Estimator GA 1.0.0 - 운영 체크리스트

## 🔴 필수 4가지 - 모두 완료!

### 1️⃣ 서비스 기동 ✅
```powershell
# 운영 환경에서는 Service 모드로 실행
.\scripts\deploy_production.ps1 -ServiceMode
```
**현재 상태**: 포트 8787에서 실행 중

### 2️⃣ 스모크 3종 확인 ✅
- ✅ **Health**: GET /v1/health → 200 OK (2025-09-23T11:43:13)
- ✅ **Create**: POST /v1/estimate/create → 200 OK (enclosure 생성 확인)
- ✅ **Validate**: POST /v1/estimate/validate → 422 (POLES_MISMATCH 의도적 오류)

### 3️⃣ RBAC 정책 적용 ✅
```
환경변수: RBAC_EVIDENCE=ADMIN_ONLY
Evidence ZIP: 2016 bytes, SHA256 시작: 8470dd4f15e9e422...
```
**권한 분리**: 일반 사용자는 메타데이터만, 관리자는 전체 ZIP 다운로드

### 4️⃣ 기본 모니터링 ✅
```
로그 위치: logs/app_20250923.log
Evidence 저장: logs/evidence/
```

**핵심 지표 모니터링**:
- **p95 ≤ 30ms**: 현재 정상 ✅
- **5xx 비율 < 0.5%**: 현재 0% ✅

---

## 🚨 문제 시 즉시 롤백 (3분)

```powershell
.\scripts\rollback_production.ps1 -Force
```

**롤백 트리거 조건**:
- 5xx > 10/분 (3분 지속)
- p95 > 200ms (5분 지속)
- 메모리 누수 감지
- 보안 취약점 발견

---

## 📊 실시간 모니터링 명령

### PowerShell 모니터링 대시보드
```powershell
# 실시간 대시보드 실행 (30초 간격)
.\scripts\monitor_production.ps1 -ContinuousMode -IntervalSeconds 30
```

### 간단한 상태 체크
```bash
# Health 체크
curl http://127.0.0.1:8787/v1/health

# 로그 확인 (최근 50줄)
tail -n 50 logs/app_20250923.log
```

---

## 📝 운영 상태 요약

| 항목 | 상태 | 값 |
|------|------|---|
| **서비스** | 🟢 실행 중 | 포트 8787 |
| **Health Check** | ✅ 정상 | 200 OK |
| **Create API** | ✅ 정상 | 200 OK |
| **Validate API** | ✅ 정상 | 422 (의도적) |
| **RBAC** | ✅ 적용 | ADMIN_ONLY |
| **P95 지연시간** | ✅ 정상 | < 30ms |
| **오류율** | ✅ 정상 | 0% |
| **로그** | ✅ 기록 중 | logs/ |

---

## 🔔 알람 설정 권장

```yaml
Critical:
  - 5xx > 5/분 → 즉시 알림
  - p95 > 50ms (5분) → 경고
  - MIXED 월 2건 초과 → 차단

Warning:
  - p95 > 30ms (10분) → 점검
  - 메모리 > 80% → 모니터링 강화
```

---

**최종 확인**: 2025-09-23 11:43
**상태**: 🟢 **운영 준비 완료**
**담당**: KIS DevOps Team