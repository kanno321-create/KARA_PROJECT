# Code Contract Report
Generated: 2025-09-19 00:48:40

## Contract Compliance Analysis

### CLI Interface (arg_parser)
| File | arg_parser() | --work | --templates | Status |
|------|--------------|--------|-------------|--------|
| breaker_critic.py | ✅ | via util | via util | PASS |
| breaker_placer.py | ✅ | via util | via util | PASS |
| cover_tab_writer.py | ✅ | via util | via util | PASS |
| doc_lint_guard.py | ✅ | via util | via util | PASS |
| enclosure_solver.py | ❌ | - | - | ORPHAN |
| estimate_formatter.py | ✅ | via util | via util | PASS |
| spatial_assistant.py | ✅ | via util | via util | PASS |

**CLI Compliance: 6/7 (85.7%)**

### Evidence Generation Pattern
| File | make_evidence | SVG Generation | Pattern Compliance |
|------|---------------|----------------|-------------------|
| breaker_critic.py | ✅ | ✅ | ✅ |
| breaker_placer.py | ✅ | ✅ | ✅ |
| cover_tab_writer.py | ✅ | ✅ | ✅ |
| doc_lint_guard.py | ✅ | ✅ | ✅ |
| enclosure_solver.py | ❌ | ❌ | ❌ |
| estimate_formatter.py | ✅ | ✅ | ✅ |
| spatial_assistant.py | ✅ | ❌ | ⚠️ |

**Evidence Compliance: 5/7 fully compliant (71.4%)**

### Function Signatures
All main functions maintain consistent signature:
```python
def main_function(work_dir: Path) -> dict
```

### Output Format
Standard output structure maintained:
```python
{
    "ts": int(time.time()),
    "data": {...},
    "validation": {...}
}
```

## Issues Found

### Critical
- enclosure_solver.py: No __main__ block, orphan file

### Warnings
- spatial_assistant.py: Missing SVG generation
- busbar_calc.py: File not found
- layout_planner.py: File not found

## Summary
- **Contract Compliance**: 71.4%
- **CLI Standards**: 85.7%
- **Evidence Pattern**: 71.4%
- **Foundation-Only**: 100%