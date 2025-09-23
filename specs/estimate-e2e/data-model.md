<!-- NO-EVIDENCE-NO-ACTION | NO-SOLO | POLICY-FIRST -->
# Data Model: Estimate-Only Canon

## Overview
Structures describe WHAT data must be captured so policy gates, UI tabs, and evidence bundles remain deterministic across environments.

## Entity: EstimateRequest
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| request_id | UUID | Yes | Unique per invocation; traceable to audit logs |
| project_label | String | Yes | Non-empty, max 120 chars |
| submitted_by | String | Yes | Must match corporate SSO identifier |
| knowledge_snapshot_id | UUID | Yes | Must reference active KnowledgeSnapshot with signature hash |
| distribution_panels | Array<DistributionPanelBlock> | Yes | At least 1 block; each block follows parsing rules |
| pricing_overrides | Array<String> | No | Must reference approved override IDs |
| validation_flags | Object | Yes | Contains booleans for `run_fix4`, `run_regression_sample` |

## Entity: DistributionPanelBlock
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| panel_id | String | Yes | Derived from 견적서 탭 block header |
| source_tab_index | Integer | Yes | 1-based; exclude tab 2 when ≥3 tabs |
| subtotal | Currency | Yes | Must match sum of line items |
| line_items | Array<MaterialSelection> | Yes | ≥1; maintain order from 견적서 |
| evidence_ref | EvidenceBundleRef | Yes | Links to `<phase>_<name>` triplet |

## Entity: MaterialSelection
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| category | Enum | Yes | One of {breaker,enclosure,accessory,magnet} |
| sku | String | Yes | Expose model name + spec on UI selection |
| quantity | Integer | Yes | ≥1; integers only |
| unit_price | Currency | Yes | Matches approved catalog snapshot |
| line_total | Currency | Yes | quantity * unit_price |

## Entity: EvidenceBundle
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| bundle_id | String | Yes | `<phase>_<name>` format |
| json_path | URI | Yes | Ends with `.json`; accessible |
| visual_path | URI | Yes | Ends with `.svg` or `.png` |
| log_path | URI | Yes | Located under `logs/` with `.json` extension |
| sha256 | String | Yes | 64 hex chars; matches files |

## Entity: ValidationReport
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| report_id | UUID | Yes | Unique per validation run |
| fix4_status | Object | Yes | Fields for Gate1..Gate4 each with PASS/FAIL |
| drift | Array<String> | Yes | `[]` allowed for none |
| recommendations | Array<String> | Yes | At least 1 when any gate fails |
| qc_report | String | Yes | 12-line QC text exactly |
| evidence_ref | EvidenceBundleRef | Yes | Triplet for validation |

## Entity: KnowledgeSnapshot
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| snapshot_id | UUID | Yes | Unique |
| version | String | Yes | Semver |
| signed_at | DateTime | Yes | Representative signature timestamp |
| regression_passed | Boolean | Yes | True required before activation |
| catalog_hash | String | Yes | SHA256 of ZIP |

## Entity: RegressionSeed
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| seed_id | String | Yes | Category prefix + increment |
| category | Enum | Yes | {enclosure,batch,form,cover} |
| payload | Object | Yes | Valid EstimateRequest stub |
| expected_gate_scores | Object | Yes | Contains gate1..gate4 expected statuses |
| notes | String | No | Reference scenario details |

## Relationships
- EstimateRequest has many DistributionPanelBlock.
- DistributionPanelBlock owns many MaterialSelection entries.
- EstimateResponse (implicit) references EvidenceBundle triplets per block and aggregate.
- ValidationReport always references original EstimateRequest by request_id.
- KnowledgeSnapshot is referenced by EstimateRequest and ValidationReport.
- RegressionSeed payload uses EstimateRequest schema and expected gates align with ValidationReport structure.

## Validation Rules Summary
1. Evidence bundle triplets must exist before marking any gate PASS (NO-EVIDENCE-NO-ACTION).
2. NO-SOLO: any snapshot activation requires two approvers recorded in KnowledgeSnapshot notes (captured in metadata).
3. POLICY-FIRST: /v1 responses cannot publish unpublished catalog SKUs; cross-check catalog_hash before release.

