"""Time utilities for MCP orchestrator."""
from __future__ import annotations

from datetime import datetime, timezone

__all__ = ["utc_now", "utc_iso"]

def utc_now() -> datetime:
    """Return current time in UTC with tzinfo."""
    return datetime.now(timezone.utc)

def utc_iso(dt: datetime | None = None) -> str:
    """Serialize to ISO8601 string with Z suffix."""
    value = dt or utc_now()
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    else:
        value = value.astimezone(timezone.utc)
    text = value.isoformat(timespec="microseconds")
    return text.replace("+00:00", "Z")
