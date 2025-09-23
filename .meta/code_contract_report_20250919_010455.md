# Code Contract Report
Generated: 2025-09-19 01:04:55

## Engine Contract Compliance

### CLI Interface Check (arg_parser)
| Engine | arg_parser | --work | --templates | Status |
|--------|------------|--------|-------------|--------|
| breaker_critic.py | ✅ | via _util_io | via _util_io | PASS |
| breaker_placer.py | ✅ | via _util_io | via _util_io | PASS |
| cover_tab_writer.py | ✅ | via _util_io | via _util_io | PASS |
| doc_lint_guard.py | ✅ | via _util_io | via _util_io | PASS |
| enclosure_solver.py | ✅ | via _util_io | via _util_io | PASS |
| estimate_formatter.py | ✅ | via _util_io | via _util_io | PASS |
| spatial_assistant.py | ✅ | via _util_io | via _util_io | PASS |

**CLI Compliance: 7/7 (100%)** ✅

### Evidence Generation Pattern
| Engine | make_evidence | SVG Generation | Full Pattern |
|--------|---------------|----------------|--------------|
| breaker_critic.py | ✅ (2) | ✅ (2) | ✅ COMPLIANT |
| breaker_placer.py | ✅ (2) | ❌ (0) | ⚠️ PARTIAL |
| cover_tab_writer.py | ✅ (2) | ✅ (2) | ✅ COMPLIANT |
| doc_lint_guard.py | ✅ (2) | ✅ (2) | ✅ COMPLIANT |
| enclosure_solver.py | ✅ (2) | ❌ (0) | ⚠️ PARTIAL |
| estimate_formatter.py | ✅ (2) | ✅ (2) | ✅ COMPLIANT |
| spatial_assistant.py | ✅ (2) | ✅ (2) | ✅ COMPLIANT |

**Evidence Pattern Compliance: 5/7 (71.4%)**

### Function Signatures (AST)
All main entry functions maintain standard signature:
```python
def function_name(work_dir: Path) -> dict:
    # Returns dict with 'ts' and result data
```

### Output Format Compliance
Standard JSON structure verified:
```json
{
  "ts": timestamp,
  "data": {...},
  "validation": {...},
  "metrics": {...}
}
```

## Contract Violations

### Critical Issues
- None

### Warnings
- breaker_placer.py: Missing SVG generation
- enclosure_solver.py: Missing SVG generation

### Recommendations
1. Add SVG generation to breaker_placer.py
2. Add SVG generation to enclosure_solver.py
3. Consider adding busbar_calc.py and layout_planner.py

## Summary
- **Overall Compliance**: 85.7%
- **CLI Standards**: 100%
- **Evidence Pattern**: 71.4%
- **Function Contracts**: 100%
- **Output Format**: 100%