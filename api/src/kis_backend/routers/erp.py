from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/v1", tags=["erp"])


@router.get("/inventory")
async def list_inventory():
    return {"items": []}


@router.post("/inventory/adjustment", status_code=202)
async def adjust_inventory(payload: dict):
    return {"status": "accepted", "traceId": payload.get("traceId")}


@router.post("/inventory/in", status_code=202)
async def inventory_in(payload: dict):
    return {"status": "queued", "received": len(payload.get("items", []))}


@router.post("/inventory/out", status_code=202)
async def inventory_out(payload: dict):
    return {"status": "queued", "received": len(payload.get("items", []))}


@router.post("/erp/journal", status_code=202)
async def create_journal(payload: dict):
    return {"status": "recorded", "journalId": "stub"}
