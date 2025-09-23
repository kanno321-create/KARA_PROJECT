<!-- NO-EVIDENCE-NO-ACTION | NO-SOLO | POLICY-FIRST -->
# Quickstart: Estimate-Only Spec Kit Runbook

Follow these steps verbatim to run the estimator workflow, collect evidence triplets, and emit the mandated 12-line QC report.

## Preparation
1. Confirm `.specify` templates are intact (hash match with release archive).
2. Mount canon knowledge ZIP and notarized rulebook into `./memory/`.
3. Verify active KnowledgeSnapshot has regression PASS and signature hash.

## Click-by-Click Execution
1. **AI 매니저 탭**
   - Upload latest knowledge ZIP and confirm catalog timestamp.
   - Record signature hash; capture evidence as `phase0_ai-manager.{json,svg}` and `logs/phase0_ai-manager.json`.
2. **견적서 탭**
   - Import project sheet.
   - Detect 탭 수: if 2, analyze both; if ≥3, skip tab 2 (고압반) and process tabs 1 & 3.
   - For each 분전반 block, use 소계/합계 markers to split blocks, allowing ±2 row tolerance after blank line.
   - Export parsed blocks to `phase1_distribution.json`, capture UI view `phase1_distribution.svg`, log parsing in `logs/phase1_distribution.json`.
3. **차단기 선택 / 외함 선택 / 부속자재 / 마그네트**
   - For each selection, ensure SKU·모델명·규격가 즉시 노출되고 합계가 업데이트됨을 확인.
   - Record snapshots for each category (e.g., `phase2_breaker.json/svg`, etc.) with matching logs.
4. **미리보기 탭**
   - Render 치환 토큰 기반 미리보기.
   - Ensure 커버/양식/치환 규칙이 적용되며 분전반별 합계가 반영됨.
   - Save evidence `phase3_preview.{json,svg}` + logs.
5. **운영·로그 탭**
   - Export structured log (`phase3_ops.json`) and ensure every selection/calculation/gate event is present.
6. **/v1/estimate API**
   - Submit EstimateRequest constructed from parsed panels; expect response with evidence refs for each block.
   - Store response in `phase4_estimate.json`, with illustrative visualization `phase4_estimate.svg`, logs under `logs/phase4_estimate.json`.
7. **/v1/validate API**
   - Send saved estimate for FIX-4 validation.
   - Confirm Gate 1~4 statuses, drift list, and 12-line QC text.
   - Save outputs (`phase5_validate.json/svg`, `logs/phase5_validate.json`).
8. **/v1/health API**
   - Poll `GET /v1/health`; expect `{ "ok": true, "ts": ISO8601 }`.
   - Capture `phase5_health.json` and `phase5_health.svg`, plus logs.
9. **Regression Replay**
   - Execute 20 seeds under `/regression/seeds`, recording pass/fail per gate into `phase6_regression.json` and logs.
10. **Evidence Audit**
    - Verify each step has JSON + SVG/PNG + log triplet.
    - Generate SHA256 manifest `phase6_manifest.json` and store log at `logs/phase6_manifest.json`.
11. **QC Report Emission**
    - Populate 12-line QC report using validation response data.
    - Save as `phase6_qc-report.json` (structured) and `phase6_qc-report.svg` (rendered view), with generation log.

## 12-Line QC Report Template
Use the exact text block in the reporting section; populate metrics from /v1/validate and regression replay.

## Evidence Packaging
- Place all evidence under `/evidence/` maintaining `<phase>_<name>` naming convention.
- Logs must reside in `/evidence/logs/` with identical base name.
- Before handoff, rerun manifest check to ensure zero missing triplets.

## Troubleshooting Gates
- Gate failures require immediate remediation followed by replay; never skip evidence capture (NO-EVIDENCE-NO-ACTION).
- Polisher score <95 triggers design adjustments documented in `phase6_polisher.json` triplet before repeating validation.

