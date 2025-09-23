BEGIN_CODEX_BRIEF
[ROLE] 너는 코드 특화 어시스턴트(Codex)다. 추가 질의 없이 "패치 번들"만 산출한다.
[FOUNDATION] 실행/배포/네트워크 금지. 기존 함수 시그니처/CLI 인자/출력 규약(파일명·포맷) **절대 불변**.
[TARGETS]
  1) engine/breaker_placer.py: OR-Tools CP-SAT로 상균형(≤4.0%), 간극/열 제약, 시드 3회 탐색, JSON+SVG evidence.
  2) engine/breaker_critic.py: 임계치 상수화, 위반 항목 원인/좌표 리포트(JSON)+SVG 하이라이트.
  3) engine/estimate_formatter.py: openpyxl로 NamedRanges 100% 주입, 샘플 5셀 값/서식 보존, lint.errors=0.
  4) engine/doc_lint_guard.py: 필수·넘침·폰트대체 검증, 실패 시 상세 오류 리스트.
  5) engine/spatial_assistant.py: 2.5D 간극/정비공간 점검(파라미터화), 불확실도 플래그.
[CURRENT INTERFACE SNAPSHOT]
<<아래 내용은 KIS_CORE_V2\.meta\interface_map.md 원문 전체>>
----------------(interface_map.md 원문 그대로 삽입)----------------
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
[DELIVERABLE FORMAT]
<<<PATCH_BUNDLE_START>>>
# 파일경로: engine/breaker_placer.py
<함수 본문 중심 패치 — 시그니처/CLI/출력규약 불변>
# 파일경로: engine/breaker_critic.py
<패치>
# 파일경로: engine/estimate_formatter.py
<패치>
# 파일경로: engine/doc_lint_guard.py
<패치>
# 파일경로: engine/spatial_assistant.py
<패치>
<<<PATCH_BUNDLE_END>>>
[SUCCESS CRITERIA] phase_imbalance_pct ≤ 4.0, violations=0, lint.errors=0, evidence 100% 생성.
END_CODEX_BRIEF