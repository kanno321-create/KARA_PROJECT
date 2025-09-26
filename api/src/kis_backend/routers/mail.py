from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/v1", tags=["mail"])


@router.post("/mail/send", status_code=202)
async def send_mail(payload: dict):
    return {"status": "queued", "recipients": payload.get("to", [])}


@router.post("/mail/ingest", status_code=202)
async def ingest_mail(payload: dict):
    return {"status": "accepted", "attachments": len(payload.get("attachments", []))}
