# SLO Snapshot
source: slo_collector
ts: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
status: $(jq -r '.status' ops/slo_report.json 2>/dev/null || echo unknown)
