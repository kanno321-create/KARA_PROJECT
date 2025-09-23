# KIS Enclosure Rules - 대표님 지식 금고

## 핵심 원칙
- **증거 = 대표님의 지식만**: 외부 추정/웹검색/제조사 임의수치 금지
- **모르면 ABSTAIN**: 정확한 질문과 함께 422 NEED_KNOWLEDGE_UPDATE 반환
- **브랜드 단일 원칙**: SANGDO/LS 혼합 금지 (MIXED 명시 시에만 예외)
- **경제형 기본**: 도면 표준형 명시가 없으면 ECONOMIC
- **입력 3게이트**: (1)메인 (2)분기 (3)부속자재 모두 충족 필요

## 입력 게이트 정의

### 게이트 1: 메인 차단기
- 필수 필드: `main.af` 또는 `main.model`
- 필수 필드: `main.poles` (3P, 4P 등)
- MCCB 또는 단자대 용량 지정

### 게이트 2: 분기 차단기
- 필수 필드: `branches[]` 배열 존재
- 각 분기: `af` 또는 `model`
- 각 분기: `poles`
- 각 분기: `qty` (수량)

### 게이트 3: 부속자재
- 필수 필드: `accessories.enabled` (boolean)
- enabled=true 시: `accessories.items[]` 배열과 수량
- enabled=false 시: 모든 부속자재 0 처리

## 브랜드 정책

### 단일 브랜드 원칙
- SANGDO 선택 시: 모든 모델이 SBS/SBE/SES/SEE 계열
- LS 선택 시: 모든 모델이 LS/METASOL 계열
- 위반 시: 422 BRAND_CONFLICT

### 혼합 브랜드 (예외)
- 연 1~2회 특수 케이스
- 반드시 `brand: "MIXED"` 명시
- 설정에서 `allowMixedBrand: true` 필요
- Evidence에 혼합 사유 기록

## 형태 (Form) 정책

### 경제형 (ECONOMIC) - 기본
- 8:2 비율로 대부분 경제형
- 도면에 표준형 명시 없으면 자동 경제형
- 컴팩트한 배치
- 최소 여백

### 표준형 (STANDARD)
- 도면에 명시적 표기 필요
- 여유있는 배치
- 추가 여백 확보

## 설치 위치/방식

### Location (위치)
- INDOOR: 옥내 (기본)
- OUTDOOR: 옥외

### Mount (설치방식)
- FLUSH: 매입 (기본)
- SURFACE: 노출

## MCCB/ELCB 구분

### MCCB (배선용 차단기)
- 상도: SBS, SBE 시리즈
- LS: METASOL 시리즈

### ELCB (누전 차단기)
- 상도: SES, SEE 시리즈 (SBS→SES, SBE→SEE 치수 동일)
- device.type과 모델 시리즈 일치 필요

## 극수 검증
- 2P, 3P, 4P만 허용
- 모델의 가능한 극수와 입력 극수 일치 확인
- 불일치 시: 422 POLES_MISMATCH

## 외함 크기 계산 알고리즘

### 배치 규칙 (경제형)
1. 메인 차단기: 1행 좌측 고정
2. 분기 차단기: 프레임 큰 순 → 극수 많은 순 → 수량 많은 순
3. 가로 배치 우선, 다음 행으로 줄바꿈
4. 동일 프레임끼리 그룹핑

### 크기 산출
- W (가로): 각 행의 최대 가로합
- H (세로): 행 수 × 모듈 높이 + 상하 여백
- D (깊이): 참여 모듈 중 최대 D

### 여백/공차
- 경제형: 최소 여백 (상하 100mm, 좌우 50mm)
- 표준형: 여유 여백 (상하 150mm, 좌우 100mm)

## 금지 항목
- 도어 여유 계산: 금지
- 열 검토: 금지
- 덕트 추정: 금지
- IP 등급 기반 크기 변경: 금지
- 부속자재 false인데 덕트 포함: 금지

## 자주 발생하는 오류

### 옥내/옥외 혼동
- 기본값: INDOOR
- 명시적 지정 필요

### 매입/노출 혼동
- 기본값: FLUSH
- 명시적 지정 필요

### MCCB/ELCB 혼동
- SBS는 MCCB, SES는 ELCB
- device.type과 모델 시리즈 매칭 필요

### 극수 오판
- 3상은 3P 또는 4P
- 단상은 2P

### 경제형/표준형 혼동
- 기본은 경제형
- 표준형은 도면 명시 필요

## 증거 생성 규칙

### rules_doc
- 이 문서의 섹션 앵커 참조
- 예: `KIS_Enclosure_Rules.md#입력-게이트-정의`

### tables
- 사용한 치수표와 정확한 행 식별
- 예: `[{source: "Sangdo_MCCB_dimensions_by_AF_model_poles.csv", rows: ["SBS-603(3P)", "SBS-203(3P)"]}]`

### brand_policy
- "single-brand or explicit MIXED only"

### snapshot
- 정규화된 입력 요청 전체

## ABSTAIN 질문 템플릿

### 치수 부재
"NEED_KNOWLEDGE_UPDATE: [브랜드] [모델]([극수]) 치수 행이 없습니다. width_mm, height_mm, depth_mm를 알려주시면 즉시 반영하겠습니다. (예시: 210,275,103)"

### 게이트 누락
"REQ_MORE_INFO: [게이트명] 정보가 부족합니다. [필요 필드] 입력해 주세요. path: [경로]"

### 타입 불일치
"DEVICE_TYPE_MISMATCH: 모델 [모델명]은 [실제타입] 계열입니다. device.type을 [올바른타입]으로 수정해 주세요."