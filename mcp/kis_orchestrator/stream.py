"""Event stream utilities (file-based)."""
from __future__ import annotations

from pathlib import Path
from typing import Any

from .utils.fs import append_jsonl, ensure_dir
from .utils.timez import utc_iso

_stream_counters: dict[str, int] = {}

def _next_seq(job_id: str) -> int:
    current = _stream_counters.get(job_id, 0) + 1
    _stream_counters[job_id] = current
    return current

def events_path(base_dir: str | Path, job_id: str) -> Path:
    return ensure_dir(base_dir) / "events.jsonl"

def write_event(*, base_dir: str | Path, job_id: str, trace_id: str | None, event_type: str, detail: dict[str, Any] | None = None) -> None:
    payload = {
        "ts": utc_iso(),
        "jobId": job_id,
        "type": event_type,
        "detail": detail or {},
        "seq": _next_seq(job_id),
    }
    if trace_id:
        payload["traceId"] = trace_id
    append_jsonl(events_path(base_dir, job_id), payload)

def subscribe(*, base_dir: str | Path, job_id: str) -> Path:
    path = events_path(base_dir, job_id)
    ensure_dir(path.parent)
    if not Path(path).exists():
        Path(path).write_text("", encoding="utf-8")
    return path
