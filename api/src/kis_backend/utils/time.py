from __future__ import annotations

from datetime import datetime, timezone

__all__ = ["utc_now", "ensure_utc", "utc_iso"]

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

def ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)

def utc_iso(value: datetime | None = None) -> str:
    dt = ensure_utc(value or utc_now())
    iso = dt.isoformat(timespec="milliseconds")
    return iso.replace("+00:00", "Z")
