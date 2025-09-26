from __future__ import annotations

from fastapi import Header


async def get_current_role(x_kis_role: str | None = Header(default="KIS_USER", alias="X-KIS-Role")) -> str:
    return x_kis_role or "KIS_USER"