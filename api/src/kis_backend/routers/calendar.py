from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/v1", tags=["calendar"])

_CAL_EVENTS: list[dict] = []


@router.post("/calendar/events", status_code=201)
async def create_event(payload: dict):
    _CAL_EVENTS.append(payload)
    return {"eventId": f"evt-{len(_CAL_EVENTS)}", "link": payload.get("erpLink")}


@router.get("/calendar/events")
async def list_events():
    return {"events": _CAL_EVENTS}
