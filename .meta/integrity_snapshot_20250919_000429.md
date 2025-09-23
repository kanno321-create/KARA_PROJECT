# KIS_CORE_V2 Integrity Snapshot
Generated: 2025-09-19 00:04:29

## Engine Files (9 total, 8 required + 1 duplicate)

| File | SHA256 | Size (bytes) | Status |
|------|--------|--------------|--------|
| engine/_util_io.py | 0b992f30c162ad67e2b0ac8bc5365e1c04e1d786110d04b0381367fbc22a0bdd | 3521 | ✅ OK |
| engine/breaker_critic.py | e4969dfc52f9933d7e5e9818153a7b43d9aff12e0828d2a4e7bd22f852347cc6 | 8936 | ✅ OK |
| engine/breaker_placer.py | 6571b32d429dbde6a665cbd8458b4d328a473d3434e071b91a838cc32f6b6af0 | 13178 | ✅ OK |
| engine/cover_tab_writer.py | 184380f8635c1b2656c5a3e3a959fbda63f40a36ddf458645cced271c3b6b6c4 | 5312 | ✅ OK |
| engine/doc_lint_guard.py | aa21d6dfd0af2657b31d64cc2f0e5ad9992393b90c148c3b71bf5c4b7cc24d20 | 12824 | ✅ OK |
| engine/enclosure_solver.py | 17f692b06cd8b4234a1354c1217de89db5afd5bbc217def24399790d84fd39ff | 3591 | ✅ OK |
| engine/engine_util_io.py | c31994b8c6cb9de8a8c0ba3793f53bbce385c54fd45b4631ba23805a334a8670 | 768 | ⚠️ DUPLICATE |
| engine/estimate_formatter.py | e723558ba6012349636ea4ebb566e0862f3b829bb6ed599fa37a8bef3ed6dbfb | 12654 | ✅ OK |
| engine/spatial_assistant.py | c766a9a78ca3c8671663c421d4c155472724e060ec6d8eb826c8b435026f53c3 | 11335 | ✅ OK |

**Note**: engine_util_io.py is a duplicate/orphan file (should use _util_io.py)

## Templates Files

| File | Size | Status |
|------|------|--------|
| KIS/Templates/Cover.xlsx | 2 | ⚠️ Stub file |
| KIS/Templates/Estimate.xlsx | 2 | ⚠️ Stub file |
| KIS/Templates/NamedRanges.yaml | 695 | ✅ Valid (13 ranges) |
| KIS/Templates/sample_estimate_request.xlsx | 462 | ✅ OK |

## Work/current Evidence Files

| Type | Count | Status |
|------|-------|--------|
| SVG files | 7 | ✅ OK |
| *_evidence.json files | 7 | ✅ OK |
| **Total evidence files** | 14 | ✅ Complete pairs |

## Evidence Mapping

| Directory | JSON Output | SVG | Evidence JSON |
|-----------|-------------|-----|---------------|
| cover/ | cover_tab.json | ✅ | ✅ |
| enclosure/ | enclosure_plan.json | ✅ | ✅ |
| format/ | estimate_format.json | ✅ | ✅ |
| lint/ | doc_lint_result.json | ✅ | ✅ |
| placement/ | breaker_placement.json | ✅ | ✅ |
| placement/ | breaker_critic.json | ✅ | ✅ |
| spatial/ | spatial_report.json | ✅ | ✅ |

## Temporary Files

| Type | Count | Location |
|------|-------|----------|
| __pycache__ directories | 1 | Found |
| .pyc files | 1 | Found |

## Integrity Summary

- **Engine files**: 8/8 required present, 1 duplicate found
- **AST parsing**: 9/9 successful
- **Templates**: 2 stub files, 1 valid YAML
- **Evidence generation**: 100% paired (14 files)
- **Temporary files**: Need cleanup (2 items)