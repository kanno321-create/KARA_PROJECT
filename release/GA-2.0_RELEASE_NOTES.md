# KIS Core GA-2.0 Release Notes

## Highlights
- Elevated enclosure, breaker placement, and lint guards to production-grade Polars/DuckDB/OR-Tools pipelines.
- FastMCP gateway hardened with staged metrics, evidence capture, and sandbox-aware validation.
- Template registry enforcement and evidence bundling aligned with Desktop Guard and License/Cost policies.

## KPI
- fit_score_avg: 0.804
- phase_balance_avg: 0.009
- lint_zero_count: 20/20
- regression_cases: 20/20 pass

## Endpoints
- /v1/estimate
- /v1/validate
- /v1/rag/query
- /v1/rag/pack
- /v1/health

## Breaking & Deprecations
- None

## Operational Guards
- Desktop Guard: enforce
- License/Cost Guard: toggle (enabled by default)
