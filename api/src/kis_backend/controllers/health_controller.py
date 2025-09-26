from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from ..database import get_db
from ..utils.time import utc_iso

router = APIRouter(prefix="/v1", tags=["health"])


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    """Health check including a lightweight DB connectivity probe (Spec Kit requirement)."""
    try:
        # DB ping (lightweight readiness query)
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {
        "status": "ok",
        "timestamp": utc_iso(),
        "version": "0.3.0",
        "database": db_status
    }




