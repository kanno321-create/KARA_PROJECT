<!-- NO-EVIDENCE-NO-ACTION | NO-SOLO | POLICY-FIRST -->
# Implementation Plan: Estimate-Only End-to-End Flow

**Branch**: `[001-estimate-e2e]` | **Date**: 2025-09-21 | **Spec**: specs/estimate-e2e/spec.md  
**Input**: Feature specification from `/specs/estimate-e2e/spec.md`

## Summary
Estimator AI must deliver uniform quote results for electrical distribution panels by enforcing 8-tab SoR UX, FIX-4 gates, evidence triplets, and regression-ready artifacts so any environment reproduces identical `/v1/estimate`, `/v1/validate`, and `/v1/health` behaviors.

## Technical Context
**Language/Version**: Python 3.11, TypeScript UI harness [POLICY-FIRST keeps backend+frontend aligned]  
**Primary Dependencies**: FastAPI, Pydantic, React, Playwright (for evidence capture)  
**Storage**: PostgreSQL for knowledge metadata, Object storage for evidence triplets  
**Testing**: Pytest, schemathesis, Playwright visual checks  
**Target Platform**: Containerized Linux services + browser automation runner  
**Performance Goals**: p95 < 2000 ms target (budget < 2500 ms SLA)  
**Constraints**: NO-EVIDENCE-NO-ACTION, NO-SOLO approvals, evidence triplets required, Polisher ≥95, WCAG AA  
**Scale/Scope**: 150 concurrent estimate sessions, 20 regression seeds replay per release

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ Article I Library-First: Components remain modular (Estimator core + Evidence service + Knowledge service).  
- ✅ Article II CLI/Interface: `/v1/*` endpoints expose text/JSON contracts; CLI wrappers planned.  
- ✅ Article III Test-First: All implementation postponed until contract tests defined.  
- ✅ Article VII Simplicity: Single repo structure (Option 1) suffices; no extra projects proposed.  
- ✅ Article VIII Anti-Abstraction: Direct framework usage; no custom HTTP layer.  
- ✅ Article IX Integration-First: Contract + integration tests planned with live services.  
- ✅ Approval Flow: Knowledge changes require regression + signature per spec.  

Re-check after Phase 1: ✅ All above remain satisfied.

## Project Structure

### Documentation (this feature)
```
specs/estimate-e2e/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/tasks command)
```

### Source Code (repository root)
```
src/
├── api/
│   ├── estimate.py
│   ├── validate.py
│   └── health.py
├── services/
│   ├── estimation_engine.py
│   ├── validation_engine.py
│   └── evidence_manager.py
├── ui/
│   ├── tabs/
│   └── preview/
└── schemas/
    └── v1/

tests/
├── contract/
├── integration/
└── regression/
```

**Structure Decision**: ✅ Use single-project layout (Option 1). UI assets reside in `src/ui` without separate project.

## Phase 0: Outline & Research
All ambiguities resolved in `research.md`. Key follow-ups baked into KnowledgeSnapshot governance and evidence storage decisions.

Outputs:
- `specs/estimate-e2e/research.md`
- Updated ambiguity tracker (none remaining).

## Phase 1: Design & Contracts
1. **Data Model**: Completed in `data-model.md`, covering EstimateRequest, DistributionPanelBlock, MaterialSelection, EvidenceBundle, ValidationReport, KnowledgeSnapshot, RegressionSeed.
2. **Contracts**:
   - `contracts/estimate.openapi.json`: Canon schema for `/v1/estimate` (request/response). Failing schemathesis tests stubbed.
   - `contracts/validate.openapi.json`: Schema for `/v1/validate` with FIX-4 payload.
   - `contracts/health.openapi.json`: Schema for `/v1/health` minimal response.
   - `contracts/tests/test_estimate_contract.py` (expected FAIL until implementation).
   - `contracts/tests/test_validate_contract.py` (expected FAIL).
   - `contracts/tests/test_health_contract.py` (expected FAIL).
3. **Quickstart**: `quickstart.md` documents click-by-click execution, evidence capture, QC report generation.
4. **Agent Context**: Update Codex prompts via `.specify/scripts/powershell/update-agent-context.ps1 -AgentType codex` after plan approval to sync active technologies.

## Phase 2: Task Planning Approach
- Load `.specify/templates/tasks-template.md`.
- Generate Setup tasks for environment scaffolding, evidence directories, schema baselines.
- Tests First: create failing contract tests, Playwright scripts, regression harness before implementation.
- Parallelization: `[P]` for tasks touching distinct files (`contracts/tests/*.py`, regression seed generator).
- Implementation tasks deferred until tests exist and fail (TDD red state confirmed).

## Phase 3+: Future Implementation
- Phase 3: `/tasks` command to create executable tasks.md.
- Phase 4: Implement estimation logic + validation gates.
- Phase 5: Run regression, collect evidence, generate QC report.
- Phase 6: Approval + release tagging with knowledge snapshot signature.

## Complexity Tracking
| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| *(none)* | - | - |

## Progress Tracking
**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

