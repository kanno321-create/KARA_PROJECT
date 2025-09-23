# 03_Roles_RACI.md

## RACI 매트릭스 (RACI Matrix)

### 역할 정의 (Role Definitions)

#### 인간 역할 (Human Roles)
- **KARA (이충원)**: 프로젝트 총괄, 최종 의사결정권자
- **Lead Architect**: 기술 아키텍처 설계 및 승인
- **Product Manager**: 제품 요구사항 정의 및 우선순위
- **Development Team**: 개발 실행 및 구현
- **QA Engineer**: 품질 보증 및 테스트 실행
- **DevOps Engineer**: 인프라 구성 및 배포

#### AI 에이전트 역할 (AI Agent Roles)
- **Claude Code**: 코드 생성, 리뷰, 리팩터링, 문서 작성
- **Sonnet**: 복잡한 분석, 아키텍처 설계, 문제 해결
- **Codex**: 코드 완성, 테스트 생성, API 문서 자동화
- **MCP Servers**: 외부 시스템 연동, 데이터 처리, 자동화

### RACI 정의 (RACI Definitions)
- **R (Responsible)**: 실행 담당
- **A (Accountable)**: 최종 책임
- **C (Consulted)**: 사전 협의
- **I (Informed)**: 결과 통보

## 프로젝트 단계별 RACI

### 1. 요구사항 분석 (Requirements Analysis)

| 활동 | KARA | Lead Arch | PM | Dev Team | QA | DevOps | Claude Code | Sonnet | Codex | MCP |
|------|------|-----------|----|---------|----|--------|-------------|--------|-------|-----|
| 비즈니스 요구사항 정의 | A | C | R | I | I | I | C | C | I | I |
| 기술 요구사항 분석 | C | A | C | R | C | C | R | A | C | I |
| 제약사항 식별 | A | R | R | C | C | C | C | R | I | I |
| 우선순위 결정 | A | C | R | I | I | I | I | C | I | I |

### 2. 설계 (Design)

| 활동 | KARA | Lead Arch | PM | Dev Team | QA | DevOps | Claude Code | Sonnet | Codex | MCP |
|------|------|-----------|----|---------|----|--------|-------------|--------|-------|-----|
| 시스템 아키텍처 | A | A | C | C | I | C | C | R | I | C |
| API 설계 | C | A | C | R | C | I | R | R | R | I |
| 데이터베이스 설계 | C | A | I | R | I | C | R | R | C | I |
| UI/UX 설계 | C | C | A | R | C | I | R | C | C | I |
| 보안 아키텍처 | A | A | I | C | I | R | C | R | I | I |

### 3. 개발 (Development)

| 활동 | KARA | Lead Arch | PM | Dev Team | QA | DevOps | Claude Code | Sonnet | Codex | MCP |
|------|------|-----------|----|---------|----|--------|-------------|--------|-------|-----|
| 코드 개발 | I | C | I | A | I | I | R | C | R | I |
| 코드 리뷰 | I | R | I | R | I | I | R | R | C | I |
| 단위 테스트 작성 | I | I | I | R | C | I | R | C | R | I |
| API 구현 | I | C | C | A | I | I | R | C | R | C |
| 통합 개발 | I | C | C | R | I | C | C | C | C | R |

### 4. 테스트 (Testing)

| 활동 | KARA | Lead Arch | PM | Dev Team | QA | DevOps | Claude Code | Sonnet | Codex | MCP |
|------|------|-----------|----|---------|----|--------|-------------|--------|-------|-----|
| 테스트 계획 수립 | C | C | C | C | A | I | C | C | I | I |
| 기능 테스트 | I | I | C | C | A | I | C | I | R | C |
| 성능 테스트 | C | C | C | C | A | R | I | C | I | C |
| 보안 테스트 | A | C | I | I | A | R | I | C | I | I |
| 사용자 테스트 | A | I | A | I | R | I | I | I | I | I |

### 5. 배포 (Deployment)

| 활동 | KARA | Lead Arch | PM | Dev Team | QA | DevOps | Claude Code | Sonnet | Codex | MCP |
|------|------|-----------|----|---------|----|--------|-------------|--------|-------|-----|
| 배포 계획 | A | C | C | I | I | A | I | C | I | I |
| 인프라 구성 | C | C | I | C | I | A | I | C | I | R |
| 배포 실행 | C | I | C | R | I | A | C | I | C | R |
| 모니터링 설정 | I | C | I | C | I | A | I | C | I | R |
| 롤백 계획 | C | C | C | C | I | A | I | C | I | C |

## AI 에이전트별 상세 역할

### Claude Code
**주요 책임**:
- 코드 생성 및 리팩터링
- 코드 리뷰 및 품질 개선
- 문서 자동 생성
- 테스트 케이스 작성

**승인 권한**:
- 코드 스타일 및 컨벤션 결정
- 리팩터링 방향 결정
- 문서 구조 및 내용 결정

**협력 방식**:
- KARA와 주간 진행상황 공유
- Lead Architect와 기술적 의사결정 협의
- Development Team과 실시간 협력

### Sonnet
**주요 책임**:
- 복잡한 시스템 분석
- 아키텍처 패턴 설계
- 성능 최적화 전략
- 문제 해결 및 디버깅

**승인 권한**:
- 아키텍처 패턴 선택
- 기술 스택 결정 참여
- 성능 기준 설정

**협력 방식**:
- Lead Architect와 설계 검토
- Claude Code와 구현 방향 논의
- QA와 테스트 전략 수립

### Codex
**주요 책임**:
- 자동 코드 완성
- API 문서 생성
- 테스트 자동화
- 코드 패턴 분석

**승인 권한**:
- 코드 완성 패턴 결정
- API 문서 형식 결정
- 자동화 도구 선택

**협력 방식**:
- Development Team과 일일 작업
- Claude Code와 코드 품질 논의
- MCP Servers와 통합 작업

### MCP Servers
**주요 책임**:
- 외부 시스템 연동
- 데이터 변환 및 처리
- 자동화 워크플로우
- 실시간 모니터링

**승인 권한**:
- 연동 방식 결정
- 데이터 변환 규칙 설정
- 모니터링 지표 정의

**협력 방식**:
- DevOps와 인프라 연동
- All AI Agents와 데이터 공유
- QA와 통합 테스트 지원

## 의사결정 프로세스

### Level 1: 전략적 의사결정
- **결정자**: KARA (이충원)
- **대상**: 프로젝트 방향, 예산, 일정, 핵심 기능
- **프로세스**: 제안 → 분석 → 승인
- **소요시간**: 1-3일

### Level 2: 기술적 의사결정
- **결정자**: Lead Architect
- **대상**: 아키텍처, 기술 스택, 보안 정책
- **프로세스**: 기술 검토 → AI 에이전트 협의 → 승인
- **소요시간**: 1-2일

### Level 3: 구현 의사결정
- **결정자**: Development Team + AI Agents
- **대상**: 코드 구조, 알고리즘, 라이브러리 선택
- **프로세스**: 실시간 협의 → 구현 → 리뷰
- **소요시간**: 몇 시간 내

### Level 4: 운영 의사결정
- **결정자**: DevOps + MCP Servers
- **대상**: 배포, 모니터링, 자동화
- **프로세스**: 자동 판단 → 필요시 에스컬레이션
- **소요시간**: 실시간

## 커뮤니케이션 매트릭스

### 일일 (Daily)
- **Development Team ↔ AI Agents**: 실시간 협력
- **QA ↔ Testing Agents**: 테스트 결과 공유
- **DevOps ↔ MCP Servers**: 인프라 상태 모니터링

### 주간 (Weekly)
- **KARA ↔ All Teams**: 진행상황 리뷰
- **Lead Architect ↔ Sonnet**: 아키텍처 검토
- **PM ↔ All Stakeholders**: 마일스톤 점검

### 월간 (Monthly)
- **전체 이해관계자**: 프로젝트 전체 리뷰
- **AI Agents Performance**: 효율성 및 품질 평가
- **Process Improvement**: 프로세스 개선사항 논의

---
*문서 버전: 1.0*  
*최종 수정: 2025-09-22*  
*승인자: 이충원 (대표이사)*