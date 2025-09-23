<!-- NO-EVIDENCE-NO-ACTION | NO-SOLO | POLICY-FIRST -->
# Tasks: Estimate-Only End-to-End Flow

**Input**: Design documents from `/specs/estimate-e2e/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
2. Load optional design documents:
   -> data-model.md, contracts/, research.md, quickstart.md
3. Generate tasks by category (Setup → Tests → Core → Integration → Polish)
4. Apply task rules (tests first, [P] for independent files)
5. Number tasks sequentially (T001...)
6. Validate completeness (contracts, entities, preview)
```

## Phase 3.1: Setup
- [ ] T001 Create evidence scaffolding under `evidence/` with logs subfolder and naming convention guide.
- [ ] T002 Register knowledge snapshot metadata tables in `src/schemas/v1/knowledge.py`.
- [ ] T003 [P] Seed regression manifest template at `tests/regression/test_regression_manifest.py` referencing 20 seeds.

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
- [ ] T004 [P] Finalize `/v1/estimate` contract tests in `specs/estimate-e2e/contracts/tests/test_estimate_contract.py` and assert current failure state.
- [ ] T005 [P] Finalize `/v1/validate` contract tests in `specs/estimate-e2e/contracts/tests/test_validate_contract.py` and assert current failure state.
- [ ] T006 [P] Finalize `/v1/health` contract tests in `specs/estimate-e2e/contracts/tests/test_health_contract.py` and assert current failure state.
- [ ] T007 Implement schemathesis suite `tests/contract/test_estimate_schema.py` to load OpenAPI and expect failure.
- [ ] T008 Create Playwright preview test `tests/integration/test_preview_tabs.spec.ts` that captures evidence stubs and expect missing implementation failure.
- [ ] T009 Build regression harness `tests/regression/test_seed_replay.py` loading `/regression/seeds/*.json` and assert placeholder failure.

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T010 Implement `/v1/estimate` handler in `src/api/estimate.py` with evidence triplet generation.
- [ ] T011 Implement estimation engine logic in `src/services/estimation_engine.py` honoring panel parsing rules.
- [ ] T012 Implement `/v1/validate` handler in `src/api/validate.py` performing FIX-4 checks.
- [ ] T013 Implement validation engine with Polisher/A11y scoring in `src/services/validation_engine.py`.
- [ ] T014 Implement `/v1/health` handler in `src/api/health.py` returning timestamp payload.
- [ ] T015 Develop evidence manager in `src/services/evidence_manager.py` synchronizing JSON/SVG/log outputs.
- [ ] T016 Wire UI tab models in `src/ui/tabs/index.ts` to auto-expose SKU/규격 and block sums.

## Phase 3.4: Integration
- [ ] T017 Connect knowledge snapshot store in `src/services/knowledge_service.py` enforcing approval flow.
- [ ] T018 Integrate regression replay scheduler in `src/services/regression_runner.py` with manifest output.
- [ ] T019 Implement logging pipeline in `src/services/logging_bridge.py` to persist structured events.
- [ ] T020 Add Playwright orchestration in `tests/integration/test_evidence_capture.spec.ts` ensuring triplets saved.

## Phase 3.5: Polish
- [ ] T021 [P] Optimize performance metrics and record p95 in `tests/performance/test_latency.py`.
- [ ] T022 [P] Document QC automation in `docs/estimate-e2e/qc-automation.md` referencing quickstart.
- [ ] T023 Produce final SHA256 manifest script `scripts/evidence/manifest.py` and accompanying tests.
- [ ] T024 Run full regression suite and store outputs under `/evidence/phase6_regression*`.
- [ ] T025 Finalize 12-line QC report exporter at `src/services/qc_reporter.py` (ensures exact formatting).

## Dependencies
- T001 precedes all evidence-related tasks.
- T004–T009 must complete (and fail) before starting T010–T016.
- T011 depends on T010 scaffolding.
- T016 depends on data models from T011.
- Integration tasks T017–T020 require core services (T010–T016).
- Polish tasks T021–T025 run after integration success.

## Parallel Example
```
# Run these in parallel after setup:
T004, T005, T006  # independent contract tests
T007, T008        # different files, can execute concurrently
```

## Validation Checklist
- [ ] Every contract has failing test coverage
- [ ] Every entity mapped to implementation tasks
- [ ] All [P] tasks touch independent files
- [ ] Tasks include explicit file paths
- [ ] Evidence and QC automation tasks defined

