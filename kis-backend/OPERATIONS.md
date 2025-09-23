# KIS ERP Operations Runbook

운영 환경에서 KIS 시스템 관리를 위한 실무 가이드

## 📋 목차

1. [시스템 아키텍처](#시스템-아키텍처)
2. [일상 운영](#일상-운영)
3. [지식 관리](#지식-관리)
4. [모니터링 및 알람](#모니터링-및-알람)
5. [장애 대응](#장애-대응)
6. [백업 및 복구](#백업-및-복구)
7. [보안 관리](#보안-관리)
8. [성능 최적화](#성능-최적화)

## 시스템 아키텍처

### 핵심 컴포넌트
- **KIS Backend**: Node.js + Fastify API 서버
- **Database**: SQLite (프로덕션용 PostgreSQL 권장)
- **Knowledge Cache**: 메모리 기반 치수 테이블 캐시
- **Evidence System**: HMAC-SHA256 기반 증거 무결성
- **Admin API**: 지식 관리 및 시스템 제어

### 포트 및 서비스
```
- Main API: 3000 (HTTP)
- Health Check: /health
- API Documentation: /api-docs
- Admin Panel: /v1/knowledge/* (Admin API Key 필요)
```

### 디렉토리 구조
```
/production/
├── kis-backend/           # 애플리케이션 코드
├── data/                  # SQLite 데이터베이스
├── logs/                  # 애플리케이션 로그
├── backups/              # 데이터베이스 백업
├── evidence-samples/     # 증거 수집 샘플
└── knowledge-staging/    # 지식 import 임시 파일
```

## 일상 운영

### 시스템 상태 확인

#### Health Check (매일 아침)
```bash
# 기본 상태 확인
curl http://localhost:3000/health

# 응답 예시:
{
  "status": "healthy",
  "timestamp": "2025-09-24T09:00:00.000Z",
  "uptime": 86400,
  "knowledgeVersion": "v2025-09-24-01",
  "activeTables": 2,
  "totalRows": 1234
}
```

#### 활성 지식 버전 확인
```bash
curl -H "X-API-Key: ${ADMIN_API_KEY}" \
  http://localhost:3000/v1/knowledge/versions/active

# 응답 예시:
{
  "id": 15,
  "label": "v2025-09-24-01",
  "active": true,
  "createdAt": "2025-09-24T08:00:00.000Z",
  "tableCount": 2
}
```

#### 로그 확인
```bash
# 최근 에러 로그 확인
tail -100 /production/logs/kis-backend.log | grep -i error

# 최근 요청 통계
tail -1000 /production/logs/kis-backend.log | grep "POST /v1/estimate/create" | wc -l
```

### 주간 점검 항목

#### 월요일: 지식 버전 상태
```bash
# 모든 지식 버전 나열
curl -H "X-API-Key: ${ADMIN_API_KEY}" \
  http://localhost:3000/v1/knowledge/versions

# 오래된 버전 정리 (30일 이상)
# 수동으로 검토 후 삭제 결정
```

#### 수요일: 데이터베이스 최적화
```bash
# SQLite 데이터베이스 최적화
sqlite3 /production/data/kis.db "VACUUM;"
sqlite3 /production/data/kis.db "ANALYZE;"

# 데이터베이스 크기 확인
du -h /production/data/kis.db
```

#### 금요일: 백업 검증
```bash
# 백업 파일 무결성 확인
sqlite3 /production/backups/kis-backup-$(date +%Y%m%d).db "PRAGMA integrity_check;"
```

## 지식 관리

### 새로운 치수 데이터 추가

#### 1. CSV 파일 준비
```csv
brand,series,model,af,poles,width_mm,height_mm,depth_mm,meta
LS,METASOL,METASOL-600,600,4P,350,275,103,"{\"series\":\"METASOL\",\"type\":\"MCCB\"}"
SANGDO,SD,SD-300,300,3P,250,270,100,"{\"series\":\"SD\",\"type\":\"MCCB\"}"
```

#### 2. 스테이징에 임포트
```bash
# CSV 내용을 JSON으로 변환하여 임포트
curl -X POST http://localhost:3000/v1/knowledge/tables/import \
  -H "X-API-Key: ${ADMIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "csv",
    "content": "brand,series,model,af,poles,width_mm,height_mm,depth_mm,meta\nLS,METASOL,METASOL-600,600,4P,350,275,103,{\"series\":\"METASOL\",\"type\":\"MCCB\"}",
    "versionLabel": "v2025-09-24-02"
  }'
```

#### 3. 검증 수행
```bash
# 스테이징 데이터로 샘플 견적 테스트
curl -X POST http://localhost:3000/v1/knowledge/tables/validate \
  -H "X-API-Key: ${ADMIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "versionLabel": "v2025-09-24-02",
    "sampleSize": 10
  }'

# 모든 샘플이 성공하는지 확인
```

#### 4. 활성화 (Hot Swap)
```bash
# 회귀 테스트와 함께 활성화
curl -X POST http://localhost:3000/v1/knowledge/tables/activate \
  -H "X-API-Key: ${ADMIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "versionLabel": "v2025-09-24-02",
    "runRegression": true
  }'

# 응답에서 hotSwapSuccess: true 및 회귀 테스트 결과 확인
```

#### 5. 활성화 후 검증
```bash
# 새 버전이 활성화되었는지 확인
curl -H "X-API-Key: ${ADMIN_API_KEY}" \
  http://localhost:3000/v1/knowledge/versions/active

# 새 모델로 테스트 견적 생성
curl -X POST http://localhost:3000/v1/estimate/create \
  -H "X-API-Key: ${ADMIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-new-model-$(date +%s)" \
  -d '{
    "brand": "LS",
    "form": "ECONOMIC",
    "installation": {"location": "INDOOR", "mount": "WALL"},
    "device": {"type": "MCCB"},
    "main": {"model": "METASOL-600", "af": 600, "poles": "4P"},
    "branches": [],
    "accessories": {"enabled": false, "items": []}
  }'
```

### 롤백 절차

#### 문제 발생시 이전 버전으로 롤백
```bash
# 이전 활성 버전 확인
curl -H "X-API-Key: ${ADMIN_API_KEY}" \
  http://localhost:3000/v1/knowledge/versions | jq -r '.[] | select(.active == false) | .label' | head -1

# 롤백 수행
curl -X POST http://localhost:3000/v1/knowledge/tables/rollback \
  -H "X-API-Key: ${ADMIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "targetVersionLabel": "v2025-09-24-01",
    "reason": "Production issue: estimate calculation errors"
  }'
```

## 모니터링 및 알람

### 핵심 메트릭

#### API 응답 시간 모니터링
```bash
# 견적 생성 응답 시간 측정
time curl -X POST http://localhost:3000/v1/estimate/create \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: monitor-$(date +%s)" \
  -d @sample-request.json

# 목표: < 2초
```

#### 에러율 모니터링
```bash
# 최근 1시간 에러율 계산
ERROR_COUNT=$(tail -10000 /production/logs/kis-backend.log | grep -c "ERROR")
TOTAL_COUNT=$(tail -10000 /production/logs/kis-backend.log | grep -c "POST\|GET")
ERROR_RATE=$(echo "scale=2; $ERROR_COUNT / $TOTAL_COUNT * 100" | bc)

echo "Error Rate: ${ERROR_RATE}%"
# 목표: < 1%
```

#### 지식 캐시 상태
```bash
# 메모리 사용량 확인
ps aux | grep kis-backend | awk '{print $6}'  # RSS 메모리 (KB)

# 캐시 히트율 (로그에서 추출)
grep "cache_hit" /production/logs/kis-backend.log | tail -1000 | \
  awk '{hit+=$1; total++} END {print "Cache Hit Rate:", (hit/total)*100"%"}'
```

### 알람 설정

#### 임계값 기반 알람
```bash
#!/bin/bash
# /production/scripts/health-check.sh

# API 응답 확인
if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "ALERT: KIS API is down" | mail -s "KIS Alert" admin@company.com
fi

# 디스크 사용량 확인 (85% 이상시 알람)
DISK_USAGE=$(df /production | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "ALERT: Disk usage is ${DISK_USAGE}%" | mail -s "KIS Disk Alert" admin@company.com
fi

# 데이터베이스 크기 확인 (1GB 이상시 알람)
DB_SIZE=$(du -m /production/data/kis.db | awk '{print $1}')
if [ $DB_SIZE -gt 1024 ]; then
    echo "ALERT: Database size is ${DB_SIZE}MB" | mail -s "KIS DB Size Alert" admin@company.com
fi
```

#### Cron 설정
```bash
# crontab -e
# 5분마다 헬스체크
*/5 * * * * /production/scripts/health-check.sh

# 매일 02:00 백업
0 2 * * * /production/scripts/backup.sh

# 매주 일요일 로그 정리
0 3 * * 0 /production/scripts/log-cleanup.sh
```

## 장애 대응

### 일반적인 문제와 해결방법

#### 1. API 응답 없음
```bash
# 프로세스 상태 확인
ps aux | grep kis-backend

# 포트 사용 확인
netstat -tulpn | grep :3000

# 로그 확인
tail -100 /production/logs/kis-backend.log

# 서비스 재시작
pkill -f kis-backend
cd /production/kis-backend && npm start > /production/logs/kis-backend.log 2>&1 &
```

#### 2. 데이터베이스 락 에러
```bash
# SQLite 락 확인
lsof /production/data/kis.db

# 강제 종료 후 재시작
pkill -f kis-backend
sleep 5
cd /production/kis-backend && npm start > /production/logs/kis-backend.log 2>&1 &
```

#### 3. 지식 캐시 문제
```bash
# 캐시 상태 확인
curl -H "X-API-Key: ${ADMIN_API_KEY}" http://localhost:3000/health

# 서버 재시작으로 캐시 재구축
pkill -f kis-backend
sleep 5
cd /production/kis-backend && npm start > /production/logs/kis-backend.log 2>&1 &
```

#### 4. 견적 계산 오류
```bash
# 최근 에러 로그 확인
grep -A 5 -B 5 "NEED_KNOWLEDGE_UPDATE\|BRAND_CONFLICT" /production/logs/kis-backend.log | tail -20

# 문제되는 요청 재현
curl -X POST http://localhost:3000/v1/estimate/create \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: debug-$(date +%s)" \
  -d @problem-request.json
```

### 긴급 상황 대응

#### 심각한 장애 발생시
1. **즉시 조치**
   ```bash
   # 서비스 중단
   pkill -f kis-backend

   # 마지막 정상 백업으로 복구
   cp /production/backups/kis-backup-latest.db /production/data/kis.db

   # 이전 지식 버전으로 롤백 (필요시)
   ```

2. **근본 원인 분석**
   ```bash
   # 전체 로그 분석
   grep -i error /production/logs/kis-backend.log | tail -50

   # 시스템 리소스 확인
   top
   df -h
   free -m
   ```

3. **복구 및 검증**
   ```bash
   # 서비스 재시작
   cd /production/kis-backend && npm start > /production/logs/kis-backend.log 2>&1 &

   # 기본 기능 테스트
   curl http://localhost:3000/health

   # 견적 생성 테스트
   npm run test:integration
   ```

## 백업 및 복구

### 일일 백업

#### 자동 백업 스크립트
```bash
#!/bin/bash
# /production/scripts/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/production/backups"
DB_FILE="/production/data/kis.db"

# 데이터베이스 백업
cp $DB_FILE "$BACKUP_DIR/kis-backup-$DATE.db"

# 압축 및 검증
gzip "$BACKUP_DIR/kis-backup-$DATE.db"
if [ $? -eq 0 ]; then
    echo "$(date): Backup completed successfully - kis-backup-$DATE.db.gz"

    # 최신 백업 심볼릭 링크 업데이트
    ln -sf "kis-backup-$DATE.db.gz" "$BACKUP_DIR/kis-backup-latest.db.gz"

    # 30일 이상 된 백업 삭제
    find $BACKUP_DIR -name "kis-backup-*.db.gz" -mtime +30 -delete
else
    echo "$(date): Backup failed!"
    exit 1
fi

# 로그 파일 백업 (주간)
if [ $(date +%u) -eq 7 ]; then  # 일요일
    tar -czf "$BACKUP_DIR/logs-backup-$DATE.tar.gz" /production/logs/
    find $BACKUP_DIR -name "logs-backup-*.tar.gz" -mtime +90 -delete
fi
```

### 복구 절차

#### 전체 시스템 복구
```bash
# 1. 서비스 중단
pkill -f kis-backend

# 2. 데이터베이스 복구
cd /production/backups
gunzip -c kis-backup-latest.db.gz > /production/data/kis.db

# 3. 무결성 검사
sqlite3 /production/data/kis.db "PRAGMA integrity_check;"

# 4. 서비스 재시작
cd /production/kis-backend
npm start > /production/logs/kis-backend.log 2>&1 &

# 5. 기능 검증
sleep 10
curl http://localhost:3000/health
npm run test:contract
```

#### 특정 시점 복구
```bash
# 특정 날짜 백업 복구
DATE="20250924_080000"
gunzip -c "/production/backups/kis-backup-$DATE.db.gz" > /production/data/kis.db
```

## 보안 관리

### API 키 관리

#### API 키 로테이션 (분기별)
```bash
# 1. 새 API 키 생성
NEW_API_KEY=$(openssl rand -hex 32)

# 2. 환경변수 업데이트
sed -i "s/API_KEY=.*/API_KEY=$NEW_API_KEY/" /production/kis-backend/.env

# 3. 서비스 재시작
pkill -f kis-backend
cd /production/kis-backend && npm start > /production/logs/kis-backend.log 2>&1 &

# 4. 클라이언트에 새 키 배포
echo "New API Key: $NEW_API_KEY"
```

#### Evidence Secret 로테이션 (반기별)
```bash
# 1. 새 시크릿 생성 (256-bit)
NEW_SECRET=$(openssl rand -hex 32)

# 2. 환경변수 업데이트
sed -i "s/EVIDENCE_SECRET=.*/EVIDENCE_SECRET=$NEW_SECRET/" /production/kis-backend/.env

# 3. 서비스 재시작
pkill -f kis-backend
cd /production/kis-backend && npm start > /production/logs/kis-backend.log 2>&1 &

# 4. 기존 Evidence 검증 불가 경고
echo "WARNING: Existing evidence signatures will no longer verify"
```

### 접근 제어

#### 로그 모니터링
```bash
# 의심스러운 API 호출 탐지
grep -i "401\|403\|429" /production/logs/kis-backend.log | tail -20

# 비정상적인 요청량 확인
grep "POST /v1/estimate/create" /production/logs/kis-backend.log | \
  awk '{print $1}' | sort | uniq -c | sort -nr | head -10
```

#### 방화벽 설정 확인
```bash
# 포트 3000이 내부 네트워크만 접근 가능한지 확인
iptables -L INPUT -v -n | grep 3000

# SSH 접근 로그 확인
grep "sshd" /var/log/auth.log | tail -20
```

## 성능 최적화

### 데이터베이스 최적화

#### 정기 유지보수 (주간)
```bash
# SQLite 최적화
sqlite3 /production/data/kis.db <<EOF
PRAGMA optimize;
VACUUM;
ANALYZE;
REINDEX;
EOF

# 테이블별 통계
sqlite3 /production/data/kis.db ".tables" | while read table; do
    echo "Table: $table"
    sqlite3 /production/data/kis.db "SELECT COUNT(*) FROM $table;"
done
```

#### 인덱스 최적화
```bash
# 자주 사용되는 쿼리의 인덱스 확인
sqlite3 /production/data/kis.db "EXPLAIN QUERY PLAN SELECT * FROM Estimate WHERE id = '123';"

# 느린 쿼리 확인 (로그에서)
grep "slow query" /production/logs/kis-backend.log | tail -10
```

### 메모리 최적화

#### 메모리 사용량 모니터링
```bash
# Node.js 메모리 사용량
ps aux | grep kis-backend | awk '{print "RSS:", $6/1024, "MB, VSZ:", $5/1024, "MB"}'

# 메모리 누수 확인 (장시간 실행 후)
echo "Process uptime: $(ps -o etime= -p $(pgrep -f kis-backend))"
```

#### 캐시 최적화
```bash
# 캐시 히트율 개선을 위한 프리로딩
curl -H "X-API-Key: ${ADMIN_API_KEY}" http://localhost:3000/health

# 자주 사용되는 모델 확인
sqlite3 /production/data/kis.db "
SELECT main_model, COUNT(*) as usage_count
FROM Estimate
WHERE created_at > datetime('now', '-30 days')
GROUP BY main_model
ORDER BY usage_count DESC
LIMIT 10;
"
```

### 응답 시간 최적화

#### 병목 지점 분석
```bash
# API 응답 시간 측정
for i in {1..10}; do
    time curl -s -X POST http://localhost:3000/v1/estimate/create \
      -H "X-API-Key: ${API_KEY}" \
      -H "Content-Type: application/json" \
      -H "Idempotency-Key: perf-test-$i" \
      -d @sample-request.json > /dev/null
done

# 결과 분석: 평균 < 2초 목표
```

#### 동시 요청 처리 테스트
```bash
# 10개 동시 요청 테스트
for i in {1..10}; do
    curl -X POST http://localhost:3000/v1/estimate/create \
      -H "X-API-Key: ${API_KEY}" \
      -H "Content-Type: application/json" \
      -H "Idempotency-Key: concurrent-$i" \
      -d @sample-request.json &
done
wait

# 모든 요청이 성공했는지 확인
```

---

## 연락처 및 에스컬레이션

### 긴급 연락처
- **개발팀**: dev-team@company.com
- **시스템 관리자**: sysadmin@company.com
- **24시간 긴급**: +82-10-1234-5678

### 에스컬레이션 매트릭스
1. **Level 1** (5분): 서비스 응답 없음 → 자동 재시작
2. **Level 2** (15분): 재시작 실패 → 시스템 관리자 호출
3. **Level 3** (30분): 복구 실패 → 개발팀 및 관리진 호출

### 문서 업데이트
이 문서는 매월 마지막 금요일에 검토하고 필요시 업데이트합니다.

**최종 업데이트**: 2025-09-24
**다음 검토일**: 2025-10-31