# KIS v2.0 Core - Quick Start Guide

## 템플릿/룰 편집 절차

1. **Templates 수정 전 확인사항**
   - `WRITE_PROTECT_TEMPLATES=1` 시 수정 불가
   - 수정 전 반드시 해시 기록: `.meta/templates_sha256_*.md`
   - NamedRanges.yaml 변경 시 Excel 파일도 함께 수정

2. **Rules 수정 절차**
   ```bash
   # 1. 백업 생성
   cp -r KIS/Rules KIS/Rules.backup.$(date +%Y%m%d)

   # 2. 수정 작업
   vi KIS/Rules/panel_rules.yaml

   # 3. 검증
   python engine/doc_lint_guard.py
   ```

## Evidence 규약

**필수 Evidence 파일**
- `*_evidence.json`: 메트릭 및 상태 정보
- `*.svg`: 시각화 결과 (선택사항)

**생성 위치**: `KIS/Work/current/`

**더미 생성 (테스트용)**
```bash
python tools/evidence_dummy.py enclosure
python tools/evidence_dummy.py placement
```

## Work/current 사용법

**엔진 출력 기본 경로**: `KIS/Work/current/`

**사용 예시**:
```python
# 엔진에서 출력 시
output_path = Path("KIS/Work/current") / "enclosure_result.json"

# Evidence 생성 시
evidence_path = Path("KIS/Work/current") / "enclosure_evidence.json"
```

## Unlock 절차

1. **체크리스트 작성**: `docs/unlock/UNLOCK_CHECKLIST.md`
2. **CEO 서명 생성**: `docs/unlock/CEO_SIGNED.json` (템플릿: `tools/unlock_sign_template.json`)
3. **검증 실행**: `python tools/verify_unlock.py`
4. **Foundation 모드 확인**: `bash scripts/verify_foundation_mode.sh`

## 핵심 명령어

```bash
# FIX-4 엔진 실행
bash scripts/run_fix4.sh

# Foundation 모드 검증
bash scripts/verify_foundation_mode.sh

# Unlock 검증
python tools/verify_unlock.py

# Evidence 생성
python tools/evidence_dummy.py [basename]
```

## 주의사항

⚠️ **FEATURE_PROD_ENABLED=0** 유지 (production 차단)
⚠️ **NO_NETWORK=1** 유지 (외부 네트워크 차단)
⚠️ 엔진 로직 수정 금지 (기존 코드 보존)
⚠️ Templates/Rules 수정 시 반드시 해시 기록

---
Version: 2.0 | Foundation-Only Mode