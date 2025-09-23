# Codex Patch Request (Foundation-Only, No Full Overwrite)
## Constraints
- 기존 **함수 시그니처/CLI 인자/출력 규약(파일명/포맷)** 유지.
- 파일 전체 덮어쓰기 지양: 함수 본문 위주로 패치.
- 외부 네트워크/배포 금지. evidence(json+svg) 생성 유지.

## Targets
- breaker_placer: OR-Tools CP-SAT로 상균형(≤4.0%), 간극/열 제약, 시드 탐색(3회).
- breaker_critic: 임계치 상수화, 위반 리포트(JSON)+SVG 하이라이트.
- estimate_formatter: openpyxl 네임드범위 100% 주입, lint.errors=0.
- doc_lint_guard: 필수필드/넘침/폰트대체 검증.
- spatial_assistant: 2.5D 간극/정비공간 점검, 불확실도 플래그.

## Current Interface Snapshot (auto)
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

## Deliverable Format
<<<PATCH_BUNDLE_START>>>
# 파일경로: engine/breaker_placer.py
<함수 본문 중심 패치>
# 파일경로: engine/breaker_critic.py
<패치>
# 파일경로: engine/estimate_formatter.py
<패치>
# 파일경로: engine/doc_lint_guard.py
<패치>
# 파일경로: engine/spatial_assistant.py
<패치>
<<<PATCH_BUNDLE_END>>>
