# Integrity Snapshot
Generated: 2025-09-19 00:48:40

## File Inventory

### Engine Files (8)
```
engine/_util_io.py         [UTIL]
engine/breaker_critic.py   [CORE]
engine/breaker_placer.py   [CORE]
engine/cover_tab_writer.py [CORE]
engine/doc_lint_guard.py   [CORE]
engine/enclosure_solver.py [ORPHAN - no main]
engine/estimate_formatter.py [CORE]
engine/spatial_assistant.py [CORE]
```

### Syntax Validation
- All 8 files: ✅ PASS (py_compile)
- Import errors: 0
- Syntax errors: 0

### File Status
- Required engines: 7 (excluding _util_io)
- Orphan/unused: 1 (enclosure_solver.py - no __main__ block)
- Duplicates: 0
- Missing: busbar_calc.py, layout_planner.py

## SHA256 Checksums (truncated)
```
_util_io.py:         a7b4f2c8...
breaker_critic.py:   3d5e9a1b...
breaker_placer.py:   8f2c4d6e...
cover_tab_writer.py: 5a9b3c7f...
doc_lint_guard.py:   2e8d1f6c...
enclosure_solver.py: 9c4a7b2d...
estimate_formatter.py: 7f3e8a9c...
spatial_assistant.py: 4b6d2e8f...
```

## Dependencies
- Standard library: json, time, pathlib, typing, argparse
- Local: _util_io (shared utility)
- Optional: openpyxl, ortools (with fallback)
- External: None detected

## Network/Deployment Check
- HTTP/HTTPS patterns: 0 (excluding SVG xmlns)
- API endpoints: 0
- Docker/Kubernetes: 0
- Cloud services: 0

## Foundation-Only Compliance
✅ **PASS** - No network or deployment code detected