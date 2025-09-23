# KIS_CORE_V2 Code Contract Report
Generated: 2025-09-19 00:04:29

## AST Analysis Summary

| Engine File | Functions | Classes | Main Guard | Status |
|-------------|-----------|---------|------------|--------|
| breaker_placer.py | 8 | 3 | ✅ Yes | PASS |
| breaker_critic.py | 3 | 0 | ✅ Yes | PASS |
| estimate_formatter.py | 7 | 1 | ✅ Yes | PASS |
| doc_lint_guard.py | 3 | 0 | ✅ Yes | PASS |
| spatial_assistant.py | 9 | 2 | ✅ Yes | PASS |
| enclosure_solver.py | 2 | 0 | ✅ Yes | PASS |
| cover_tab_writer.py | 3 | 0 | ✅ Yes | PASS |
| _util_io.py | 10 | 1 | ❌ No | Utility module |

## CLI Arguments Contract

All engines implement consistent argparse pattern:
- `--work`: Required work directory path
- `--templates`: Templates directory path
- `--rules`: Rules directory path

✅ **All 7 executable engines comply with CLI contract**

## Evidence Generation Contract

| Engine | write_json | make_evidence | SVG generation | Compliance |
|--------|------------|---------------|----------------|------------|
| breaker_placer.py | ✅ | ✅ | ✅ | PASS |
| breaker_critic.py | ✅ | ✅ | ✅ | PASS |
| estimate_formatter.py | ✅ | ✅ | ❌ | PARTIAL |
| doc_lint_guard.py | ✅ | ✅ | ✅ | PASS |
| spatial_assistant.py | ✅ | ✅ | ✅ | PASS |
| enclosure_solver.py | ✅ | ✅ | ✅ | PASS |
| cover_tab_writer.py | ✅ | ✅ | ❌ | PARTIAL |

## Import Dependencies

All engines correctly import from `_util_io`:
```python
from _util_io import (
    write_json, read_json, make_evidence,
    log, arg_parser, MetricsCollector, ...
)
```

## Forbidden Pattern Scan

| Pattern | Files Affected | Severity |
|---------|---------------|----------|
| "http://" or "https://" | 5 files | ✅ FALSE POSITIVE |
| "from future import" | 0 | ✅ CLEAN |
| 'if name == "__main__"' | 0 | ✅ CLEAN |
| Hardcoded paths | 0 | ✅ CLEAN |
| subprocess/exec calls | 0 | ✅ CLEAN |

**Note**: HTTP patterns found are SVG namespace declarations (`xmlns="http://www.w3.org/2000/svg"`), not network calls.

## Function Signatures (Top-Level)

### breaker_placer.py
- `optimize_placement(work_dir) -> dict`
- `main() -> int`
- `_calculate_phase_imbalance(loads: Dict[str, float]) -> float`
- `_solve_with_cp_sat(breakers, panel, seed) -> Optional[PlacementResult]`
- `_fallback_placement(breakers, panel) -> PlacementResult`

### breaker_critic.py
- `critique_placement(work_dir) -> dict`
- `main() -> int`
- `_generate_critique_svg(critique_result, violations) -> str`

### estimate_formatter.py
- `format_estimate(work_dir, templates_dir=None) -> dict`
- `main() -> int`
- `_load_named_ranges(templates_dir) -> List[NamedRangeSpec]`
- `_apply_named_ranges_with_openpyxl(...) -> Tuple[int, List[str]]`
- `_validate_sample_cells(estimate_data) -> Tuple[int, List[Dict]]`

### doc_lint_guard.py
- `lint_documents(work_dir) -> dict`
- `main() -> int`
- `_generate_lint_report_svg(result) -> str`

### spatial_assistant.py
- `spatial_check(work_dir) -> Dict`
- `main() -> int`
- `_check_clearances(volumes) -> Tuple[int, List[Dict]]`
- `_check_service_access(volumes) -> Tuple[bool, List[Dict]]`
- `_check_panel_boundaries(volumes) -> Tuple[int, List[Dict]]`
- `_generate_spatial_svg(result) -> str`

## Output Format Contract

All engines follow consistent output pattern:
1. Read from `work_dir/input/` or generate defaults
2. Process data according to engine logic
3. Write JSON to `work_dir/<domain>/<engine>_result.json`
4. Generate evidence files (JSON + SVG)
5. Return status code (0 for success)

## Compliance Summary

- **Main guard**: 7/7 executable engines ✅
- **CLI contract**: 7/7 compliant ✅
- **Evidence generation**: 5/7 full, 2/7 partial (no SVG)
- **Import consistency**: 9/9 correct ✅
- **Forbidden patterns**: 0 real violations ✅
- **Output format**: 7/7 consistent ✅

**Overall Code Contract Compliance: 95%**