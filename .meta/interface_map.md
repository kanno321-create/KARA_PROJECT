# Interface Map
## engine\_util_io.py
- Functions: __init__(self), timer(self, step_name), save(self, path='.meta/metrics.json'), ensure_dir(p), write_json(p, obj), read_json(p), write_text(p, text), make_evidence(base, data=None, kind='svg'), arg_parser(), log(msg, level='INFO')
- Classes: MetricsCollector
- CLI Args: (none)
- Imports: argparse, contextlib, datetime, json, os, pathlib, sys, time
- Output hints: \.json\", \.svg\", _evidence\.json, with_suffix\(
## engine\breaker_critic.py
- Functions: critique_placement(work_dir), main()
- Classes: (none)
- CLI Args: (none)
- Imports: _util_io, json, pathlib
- Output hints: \.json\", with_suffix\(
## engine\breaker_placer.py
- Functions: optimize_placement(work_dir), main()
- Classes: (none)
- CLI Args: (none)
- Imports: _util_io, json, pathlib, random, time
- Output hints: \.json\", with_suffix\(
## engine\cover_tab_writer.py
- Functions: write_cover(work_dir), check_empty(obj, path=''), main()
- Classes: (none)
- CLI Args: (none)
- Imports: _util_io, json, pathlib, time
- Output hints: \.json\", with_suffix\(
## engine\doc_lint_guard.py
- Functions: lint_documents(work_dir), main()
- Classes: (none)
- CLI Args: (none)
- Imports: _util_io, json, pathlib, time
- Output hints: \.json\", \.svg\", _evidence\.json, with_suffix\(
## engine\enclosure_solver.py
- Functions: calculate_enclosure(work_dir, rules_dir), main()
- Classes: (none)
- CLI Args: (none)
- Imports: _util_io, json, pathlib, random, time
- Output hints: \.json\", with_suffix\(
## engine\engine_util_io.py
- Functions: ensure_dir(p), write_json(p, obj), write_text(p, text), make_evidence(base)
- Classes: (none)
- CLI Args: (none)
- Imports: json, pathlib, time
- Output hints: _evidence\.json, with_suffix\(
## engine\estimate_formatter.py
- Functions: format_estimate(work_dir, templates_dir), main()
- Classes: (none)
- CLI Args: (none)
- Imports: _util_io, json, pathlib, time, yaml
- Output hints: \.json\", with_suffix\(
## engine\spatial_assistant.py
- Functions: main()
- Classes: (none)
- CLI Args: (none)
- Imports: _util_io, pathlib, time
- Output hints: \.json\", with_suffix\(