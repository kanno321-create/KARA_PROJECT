from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/v1", tags=["ai-manager"])


@router.post("/ai/route")
async def route_ai(payload: dict):
    return {
        "intent": payload.get("intent", "estimate"),
        "next": "estimate" if payload.get("intent") == "estimate" else "manual_review",
        "meta": {"confidence": 0.42},
    }
