# CLAUDE.md — KIS Core v2.0 Constitution (Spec-Driven · Evidence-First · Gate-Enforced)

> 이 문서는 한국산업(KIS) 프로젝트의 **절대 기준(Constitution)** 입니다.  
> **Spec Kit(스펙 킷)** 을 전면 채택하여, *모든 작업*을 “스펙이 원천(SSOT)이고 실행체(Executable)”인 방식으로 수행합니다.  
> **단 한 글자라도 간소화하지 않습니다.** 규칙은 **추가**가 기본이며, 불명확성은 허용하지 않습니다.

---

## 0) 미션 / 범위 / 페르소나

### 0.1 미션(What we build)
- **목표:** 견적(AI Estimator)·ERP-AI·AI 매니저·캘린더·이메일·도면 흐름을 **Spec-Driven Development(SDD)** 로 일관화하여,  
  **FIX-4 파이프라인(외함 → 배치(+Critic) → 양식 → 표지 + Doc Lint)** 를 100% 자동화하고, **증거(Evidence)** 와 **게이트(Gates)** 로 품질을 강제한다.
- **철학:** NO-EVIDENCE-NO-ACTION / NO-SOLO / POLICY-FIRST / TWO-TRACKS(겉은 단순·속은 풍부).
- **분리 원칙:** 견적-AI와 ERP-AI는 **데이터·권한·라우팅**을 완전히 분리한다(교차 침범 금지).

### 0.2 프로젝트 루트/도메인/심볼릭 링크(Windows)
- 루트: `C:\Users\PC\Desktop\KIS_CORE_V2` (이 파일을 배치)  
- MCP 도메인: `C:\Users\PC\Desktop\KIS_CORE_V2\mcp-servers\official-servers\src\everything`  
  - `everything.ts`(약 35KB): MCP **Everything** 서버 구현  
  - `CLAUDE.md`(도메인 규칙 전용): 루트 헌법을 상속, 이 폴더 규칙만 기술
- 심볼릭 링크: `C:\Users\PC\Desktop\KIS_CORE_V2\node_modules\@modelcontextprotocol\server-everything`  
  - **2) MCP 도메인**을 가리키는 symlink. **여기 파일은 절대 수정/생성 금지.**

### 0.3 페르소나/역할
- **KIS 리드 엔지니어(Agent 오케스트레이터)**: Spec→Plan→Tasks→Implement 전체를 규약·증거·게이트로 운영.  
- **Codex/Claude Code(에이전트)**: *항상* 본 헌법을 우선 적용. *절대* 임의행동 금지.  
- **대표이사(최고 권한자)**: 핵심 지식/공식/정책 변경의 **단독 승인권** 보유.

---

## 1) 절대 기준(Absolute Baseline) — **Spec Kit 채택 선언**

1. **Spec Kit 절대 기준:** 이 리포에서 실행되는 **모든 작업**(코드·문서·테스트·빌드·릴리스·데이터 변경)은 **Spec Kit 규격을 ‘절대 기준’**으로 삼는다.  
2. **스펙이 원천(SSOT):** 스펙이 구현과 검증을 **구동**한다. 코드는 스펙의 **구현물**이며, 스펙과 불일치하면 **차단**한다.  
3. **파이프라인 고정:** `/constitution → /specify → /plan → /tasks → /implement` (Plan-then-Execute). 승인 전 **실행 금지**.  
4. **에이전트 호환:** Codex/Claude Code 등 어떤 에이전트든 **동일 스펙**에서 파생. 템플릿 버전 **락**(재현성).  
5. **Windows/WSL2:** Windows에서 동작하되, 빌드·테스트·CI는 **WSL2 권장**(환경 드리프트 최소화).

---

## 2) 최상위 우선순위 / 금지 / 보안

### 2.1 우선순위(Priority of Contexts)
- `CLAUDE.local.md`(개인, 커밋 금지) **>** `subdir/CLAUDE.md`(도메인) **>** 루트 `CLAUDE.md`(헌법).  
- 충돌 시 상위 우선순위를 따른다. **단, 헌법(보안/증거/게이트/분리 원칙)은 무조건 우선**한다.

### 2.2 금지(Do-Not-Touch / Prohibited)
- `/Rules/*`, `/Templates/*`, `/Tests/regression/*` **직접 수정 금지**(전자서명 승인 필요).  
- **배포/Prod 스크립트 자동 실행 금지.** 항상 수동 승인 단계 필요.  
- **외부망 호출 OFF 기본.** Allowlist 없으면 차단.  
- **node_modules symlink 내부 수정 금지.** (특히 `@modelcontextprotocol/server-everything`)  
- 비밀키/고객 데이터/민감정보 **입력 금지**. (엔터프라이즈 계정·학습 옵트아웃을 전제)

### 2.3 보안/프라이버시
- **엔터프라이즈/업무용 계정**으로만 AI 사용. 소비자 플랜 금지.  
- 모델 학습 **옵트아웃** 유지.  
- 로그는 **PII 마스킹**·레벨 표준 준수(TRACE<DEBUG<INFO<WARN<ERROR).

---

## 3) 운영 골격(Operating Sections 4) — 루트/서브 공통

### 3.1 Tech Stack & Versions (버전 필수)
- Frontend: **Next.js 15(App Router)**, TypeScript **5.x(strict)**, Tailwind **3.x**, shadcn/ui  
- Backend: **Python 3.12**, Polars, DuckDB, OR-Tools, FastAPI/Flask(모듈 별도), ezdxf  
- Office/PDF: Excel Runner vX, LibreOffice headless vY  
- Agentic: FastMCP Gateway, Evidence/Regression Harness, Desktop Guard  
- Infra(옵션): Docker/Compose, Postgres, MinIO  
> **버전 미기재 금지.** 버전 불일치로 인한 판단오류를 차단한다.

### 3.2 Dev Rules (Review Canon)
- Lint/Format: **ruff+black / eslint+prettier** — **미통과 시 실행 금지**.  
- Excel 템플릿: **네임드 범위/수식 ‘직접’ 수정 금지**(주입만 허용).  
- 에러 처리: API/IO는 try/except(or Result) 강제, **구체 로그** 남김.  
- 파일 레이아웃: ESM 우선, 파일당 1 Export 원칙(예외는 주석 근거).  
- 성능/품질: Lighthouse ≥ 90(웹), 문서 린트 0, 빌드 경고 0.

### 3.3 Workflow (Plan → Approve → Execute)
- **Plan-then-Execute**: 먼저 계획(목표/단계/도구/산출물/게이트 체크리스트)만 제시, **사람 승인 후** 실행.  
- 결과 메시지는 **Evidence Bundle 링크(경로·해시·타임스탬프)** 를 **항상** 포함.  
- 테스트 프레임워크 고정(jest/pytest 등), 임의 교체 금지.

### 3.4 Special Notes
- TypeScript **any 금지**, default export 지양(사유 주석).  
- 네트워크 **OFF 기본**, 도메인 allowlist가 없으면 거부.  
- 다중 컨텍스트 활성 시 우선순위: `local > subdir > root`.

---

## 4) FIX-4 파이프라인 & 게이트(차단 기준)

### 4.1 순서 고정(Policy-First)
**Enclosure → Breaker(+Critic) → Formatter → Cover → Doc Lint**  
순서 일탈 시 즉시 BLOCK. 중간 단계 스킵 금지.

### 4.2 수치/규칙 (모든 항목 미달 시 BLOCK)
- **ENCLOSURE**: `fit_score ≥ 0.90`, `IP ≥ 44`, 도어 여유 ≥ **30mm**  
- **BREAKER**: 상평형 ≤ **3~5%**(계약값), **간섭/열/간극 위반=0**, Critic 재검증 필수  
- **FORMAT/COVER**: 문서 린트 **0**, 표지 규칙 **100%**, 네임드범위 **손상=0**  
- **DESIGN**: Polisher ≥ **95(A)**, **WCAG AA 100%**  
- **RELEASE**: 회귀 **20/20 PASS**(외함5/배치5/양식5/표지5)

---

## 5) Evidence(증거) — 출력·링크·보관

- 경로 규약: `/output/evidence/{step}/` → `svg|png|json|csv|log`  
- 모든 결과 메시지에 Evidence Drawer 링크(상대경로 + `#sha256:<해시>` + 타임스탬프).  
- 예: `/output/evidence/breaker/heatmap.png#sha256:abcd…`  
- PR 본문에 게이트 리포트·회귀 요약·증거 링크 **자동 첨부**.

---

## 6) Spec Kit 파이프라인 (Slash Commands) — **절대 기준**

> 이 절 차수는 **생략 금지**입니다. 각 단계 산출물/게이트를 통과해야 다음 단계로 이동.

### 6.1 `/constitution` — 팀 원칙/가드레일 고정
- 본 **루트 헌법**(이 문서)을 참조로 **프로젝트 전역의 불변 규칙**을 다시 선언/문맥화.  
- 코드 품질, 테스트 기준, UX·접근성(Polisher/A11y), 성능, 보안/비용, 릴리스 조건 확정.  
- **산출물:** `docs/constitution.md`(핵심 조항 요약), `ops/policies/*.yaml`

### 6.2 `/specify` — 무엇/왜(제품 스펙) 결정 (**스택 미지정**)
- 사용자 스토리, 이벤트 흐름, 도메인 용어, KPI·SLO, 비기능 요구(성능/보안/접근성/감사성).  
- 인터페이스 스펙(예: **OpenAPI** 초안), 스키마/바운더리, **금지/제약**을 명문화.  
- **산출물:** `spec/requirements.md`, `spec/openapi.yaml`, `spec/data/*.proto|sql`

### 6.3 `/plan` — 실행 계획(아키텍처·스택·모듈 분해)
- 기술 스택 확정(예: **FastAPI + SQLModel + Postgres(Docker)**), 레이어·경계, 트랜잭션, RBAC, 로깅, 헬스체크, 관측성(OTel).  
- E2E 흐름과 **FIX-4 파이프라인과의 매핑** 명세, 장애 격리·리트라이·타임아웃·폴백, 캐시/큐/스트리밍.  
- **산출물:** `plan/architecture.md`, `plan/components/*.md`, `plan/adr/*.md`

### 6.4 `/tasks` — 행동 가능한 태스크 세분화
- 컨트롤러/서비스/리포지토리/스키마/테스트/게이트/핸드오프/문서 태스크로 분해.  
- 각 태스크는 **증거 산출**과 **게이트 통과**를 요구(Checklist 포함).  
- **산출물:** `tasks/backlog.md`, `tasks/sprints/*.md`, `tasks/owners.yaml`

### 6.5 `/implement` — 구현·검증·증거 수집
- 계획과 태스크에 따라 구현. 문서/코드/테스트 산출물 간 **증거 연결(해시/로그)** 일치 검증.  
- 실패 시 즉시 **롤백 + 영향 리포트**(원인/대안/재발방지).  
- **산출물:** `src/**`, `tests/**`, `output/evidence/**`, `ops/reports/*.md`

> **Codex 제약 주의:** Codex는 커맨드 인자 커스터마이징이 제한적이므로, **프롬프트 본문에 규격/옵션/게이트를 완전 서술**한다(“인자=0, 본문=100”).

---

## 7) MCP “Everything” 도메인 규칙 (subdir/CLAUDE.md 용 골자)

> 위치: `mcp-servers/official-servers/src/everything/CLAUDE.md` (도메인 전용)

- **Scope:** 이 폴더 내 MCP 서버 개발에만 적용.  
- **명령/리소스 Allowlist:** 파일 I/O는 `/Work` 하위만, 외부망 OFF, 위험 명령 금지.  
- **시간/신뢰성:** 요청 타임아웃, 리트라이(지수 백오프), Circuit Breaker/Rate Limit 규정.  
- **스키마:** 요청/응답 JSON 스키마 **고정**(버전 필드 포함, semver).  
- **테스트:** 핸들러 단위 테스트 + 통합 테스트, **Evidence(json/log)** 첨부 의무.  
- **로깅:** 구조화(ISO8601), Trace-ID/Span-ID, PII 마스킹.  
- **Imports:** `@..\..\..\..\CLAUDE.md`(루트), `@Docs/mcp_everything.md`

---

## 8) Tools & Permissions

- **Always Allow:** Edit, ReadFiles, Git(basic), Bash(화이트리스트), Excel/PDF Export, Evidence Renderer, Regression Harness  
- **MCP 등록:** `.mcp.json`(Gateway/Evidence/Regression/DesignOps/A11y), 선택: Puppeteer, Sentry  
- **Git 워크플로:** `feature/{ticket}` → PR 생성 시 **게이트/증거/회귀 리포트** 자동 첨부

---

## 9) Slash-Commands (KIS 표준 명령)

- `/kis:fix4-e2e "<요청>"` → 외함→배치(+Critic)→양식→표지→Doc Lint(증거 번들 포함)  
- `/kis:diff "A B"` → 견적/배치 **Diff** + 마진 **Waterfall**  
- `/kis:regression:run` → **20 케이스 전수 실행**, 통과율 요약  
- `/design:polish` → Polisher 점수·A11y 검사(AA 100%)

---

## 10) 증거·회귀·릴리스 게이트 (강제)

- **증거(Evidence):** 모든 결과물은 **경로/해시/타임스탬프**와 함께 Evidence Drawer 링크 제공.  
- **회귀(Regression):** 골드셋 20/20 전수. 실패 시 차단·롤백.  
- **릴리스(Release):** 게이트·증거·회귀 **모두 PASS**가 아니면 **배포 금지**.

---

## 11) 문서 계층(Imports) & 길이 제한(토큰 예산 최적화)

- 루트는 **헌법(불변 규칙)**만, 설명/사례는 `@Docs/*.md`로 분리하고 **본문에서 @import**.  
- 하위 `CLAUDE.md`는 **해당 도메인 규칙만**: 간결하지만 **규칙/수치**는 반드시 명문화(축약 금지).  
- **코드블록 내부에서는 `@` import가 무시**되므로, 일반 문서 본문에서 사용할 것.

---

## 12) Onboarding (5분 루틴)

1) `/init` → 생성된 CLAUDE.md를 **본 헌법으로 교체**  
2) `/permissions` → 허용 도구 사전 승인(Gateway/Evidence/Regression 등)  
3) `/constitution` → 팀 규약 재선언(본 문서 요약 반영)  
4) `/specify` → 스펙 작성(요구/정의/OpenAPI 초안)  
5) `/plan` → 아키텍처/스택/게이트/장애격리 정의  
6) `/tasks` → 세분화(증거/게이트 체크리스트 포함)  
7) `/implement` → 구현/테스트/증거 수집 → PR(게이트·회귀 리포트 자동 첨부)

---

## 13) Change-Management / PR 규칙

- 모든 PR은 **게이트/증거/회귀 리포트 첨부**.  
- 실패 시 **즉시 롤백** + 영향 리포트(원인/대안/재발방지).  
- **대표이사 승인** 없이 핵심 지식/공식/정책 변경 금지.

---

## 14) DesignOps 게이트(디자인 라인)

- 브랜드 토큰 **강제**(HEX 직접사용 0).  
- 상태(hover/active/focus/disabled/empty/error) **100% 커버**.  
- **Polisher ≥ 95(A), WCAG AA 100%** 미달 PR은 병합 차단.

---

## 15) 개인 오버라이드 / `.gitignore`

- 루트에 `CLAUDE.local.md.sample` 제공(개인 단축키/취향만).  
- `.gitignore`에 `CLAUDE.local.md` 추가(커밋 금지).  
- 개인 오버라이드가 헌법을 **침범하면 무효**.

---

## 16) Windows/WSL2 운영 주의

- 로컬 Windows 허용, **WSL2 권장**(빌드/테스트/CI 기준 동일화).  
- 경로/개행(CRLF ↔ LF) 혼선 금지(에디터 규칙 고정).  
- 심볼릭 링크 경고: `node_modules\@modelcontextprotocol\server-everything`은 **읽기만**.

---

## 17) Runbook — Plan 템플릿(붙여넣기)

[PLAN]
목표: FIX-4 E2E 1회 드라이런 + Evidence 번들 + 회귀 요약
단계: Enclosure → Breaker(+Critic) → Formatter → Cover → Doc Lint
도구/MCP: Gateway, Evidence, Regression, Excel Runner
산출물: XLSX, PDF, Evidence(svg/png/json/csv/log)
게이트체크: ENC ≥0.90/IP44, BRK 편차≤3~5%, 린트=0, 표지=100%, Polisher≥95, A11y=100%, Regression 20/20

[AFTER APPROVAL → EXECUTE]
/kis:fix4-e2e "요청내용"

yaml
코드 복사

---

## 18) DOD(Definition of Done) — 각 단계 수용 기준

- **/constitution:** 헌법 조항(본 문서) 반영, 금지/보안/게이트 명문화  
- **/specify:** 요구/정의/OpenAPI 초안·스키마·제약 명확, Evidence 요구사항 포함  
- **/plan:** 아키텍처/경계/게이트/장애격리/관측성 상세, 테스트 전략·릴리스 전략 정의  
- **/tasks:** 세분화·소유자 지정, 체크리스트·증거 연결·게이트 통과 조건 명기  
- **/implement:** 코드/테스트/Evidence/문서 일치, 회귀 20/20 PASS, 게이트 전부 PASS

---

## 19) PR 본문 템플릿(붙여넣기)

PR: <모듈/기능 이름>
무엇
스펙/플랜/태스크에 따른 구현 요약

증거(Evidence) 링크, 게이트 결과, 회귀 요약

왜
사용자 가치/리스크/성능/보안/접근성/감사성 근거

어떻게
아키텍처/경계/도구/MCP/에이전트

롤백 플랜 / 영향 분석

체크리스트
 증거 링크 (경로+해시+타임스탬프)

 게이트 모두 PASS (ENC/BRK/DOC/DESIGN/RELEASE)

 회귀 20/20 PASS

 보안/비용/라이선스 확인

markdown
코드 복사

---

## 20) 용어(Glossary)
- **SSOT**: Single Source of Truth(스펙이 원천)  
- **Evidence**: 산출물의 경로·해시·타임스탬프 묶음(검증가능성)  
- **FIX-4**: 외함→배치(+Critic)→양식→표지(+Doc Lint)  
- **Gate**: 수치·규칙 기반 차단장치(미달 시 BLOCK)  
- **Gold Set**: 회귀 20케이스 기준 셋

---

## 21) 마무리 — 위반 시 처리
- 이 헌법을 위반한 변경/행위는 **즉시 BLOCK**한다.  
- 릴리스 라인에서 발견 시 **롤백 + 영향 리포트**를 강제한다.  
- **대표이사 승인** 없이는 헌법 조항 변경 불가.

---

## 22) Imports (프로젝트 지식 연결; 경로 확인 필요)
- 개요/요구: `@README`, `@Docs/SoR.md`  
- 정책/DAG/게이트: `@Rules/policy.mcp.yaml`, `@Docs/fix4.md`  
- 템플릿 해시/네임드범위: `@Templates/registry.md`  
- 회귀·골드셋: `@Tests/regression.md`  
- 디자인 게이트: `@Design/Polisher.md`, `@Design/A11y.md`  
- MCP: `@Docs/mcp_everything.md`  
> **주의:** 코드블록 내부에서는 `@` import가 무시됨. 본문에서만 사용한다.