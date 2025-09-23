<!-- NO-EVIDENCE-NO-ACTION | NO-SOLO | POLICY-FIRST -->
# Feature Specification: Estimate-Only End-to-End Flow

**Feature Branch**: `[001-estimate-e2e]`  
**Created**: 2025-09-21  
**Status**: Draft  
**Input**: User description: "Codex must deliver a canon Spec-Kit configuration so the Estimator AI reproduces identical estimate-only outcomes across environments."

## Execution Flow (main)
```
1. Parse user description from Input
2. Extract key concepts from description
3. For each unclear aspect:
   -> Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
5. Generate Functional Requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
8. Return: SUCCESS (spec ready for planning)
```

---

## 📋Quick Guidelines
- 🎯Focus on WHAT users need and WHY
- 🚫Avoid HOW to implement (no tech stack, APIs, code structure)
- ✍️ Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., authentication scope), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User roles and approval chains
   - Data retention or archival timelines
   - Performance targets and concurrency limits
   - Audit and access trails
   - External system dependencies
   - Localization and currency handling

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
Operations lead uses the AI 매니저 탭 to curate knowledge snapshots, triggers 견적서 탭 to build panel-based quotes, and verifies FIX-4 gates before handing off audit-ready documentation.

### Acceptance Scenarios
1. **Given** the AI 매니저 탭 holds the latest canon knowledge ZIP, **When** the user requests `/v1/estimate` for a project containing multiple 분전반 blocks, **Then** the system produces separated estimate outputs with evidence triplets referenced for each block and updates 합계/소계 instantly.
2. **Given** a saved 견적 draft, **When** the user invokes `/v1/validate`, **Then** Gate-1~4 statuses are returned with remediation advice and the 12-line QC report template is populated without manual edits.

### Edge Cases
- 분전반 탭 구성이 3개 이상일 때 2번 탭(고압반)을 무시하고 1번/3번 탭만 계산해야 하는 경우.
- 견적서 탭에서 동일 분전반에 속한 소계 행이 누락되거나 "합계" 표기가 다른 언어로 제공되는 입력.
- 제품 카탈로그 스냅샷이 최신이지만 대표 서명이 미확인인 상태에서 룰 변경이 요청되는 상황.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: 시스템은 AI 매니저, 견적서, 차단기 선택, 외함 선택, 부속자재, 마그네트, 미리보기, 운영·로그 8개 탭 SoR을 변형 없이 보여야 한다.
- **FR-002**: 견적서 탭은 분전반 블록을 분리 저장하며 선택 항목마다 모델명·규격을 자동 노출하고 합계/소계를 즉시 재계산해야 한다.
- **FR-003**: `/v1/estimate` 응답에는 각 라인아이템과 함께 JSON+SVG(or PNG)+logs 증거 경로가 반드시 포함돼야 한다.
- **FR-004**: `/v1/validate`는 FIX-4 각 게이트의 PASS/FAIL, 권고, 드리프트 정보를 제공해야 한다.
- **FR-005**: `/v1/health`는 서비스 가용 상태와 타임스탬프를 반환해야 한다.
- **FR-006**: 디자인 검증 결과는 Polisher ≥95, WCAG AA 충족 여부를 명시해야 한다.
- **FR-007**: 로그 시스템은 모든 선택, 계산, 게이트 평가 이벤트를 구조화 JSON으로 저장해야 한다.
- **FR-008**: 회귀 시드 20개는 외함/배치/양식/표지 카테고리별 다섯 개씩 제공되어야 하며 기대 게이트 값을 포함해야 한다.
- **FR-009**: 증거 번들 생성은 산출물과 동일 이름 규칙 `<phase>_<name>`을 적용한 JSON, SVG/PNG, logs JSON 3종을 동시 생성하도록 지정해야 한다.
- **FR-010**: [NEEDS CLARIFICATION: 인증 방식 및 접근 제어 요구 사항을 정의해야 하는지 여부]
- **FR-011**: [NEEDS CLARIFICATION: 견적 데이터의 보관 기간과 감사 로그 유지 기간]
- **FR-012**: [NEEDS CLARIFICATION: 예상 동시 사용자 수와 피크 부하 목표]

### Key Entities *(include if feature involves data)*
- **EstimateRequest**: 프로젝트 정보, 분전반 블록, 자재 선택 옵션, 게이트 평가 플래그 포함.
- **EstimateResponse**: 라인아이템, 소계/합계, 증거 경로, 미리보기 토큰, QC 리포트 상태.
- **ValidationReport**: FIX-4 결과, 드리프트 목록, 권고 조치, 증거 경로.
- **KnowledgeSnapshot**: 카탈로그 버전, 룰 해시, 대표 서명 상태.
- **RegressionSeed**: 카테고리, 입력 시나리오, 기대 게이트 값.

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

---
