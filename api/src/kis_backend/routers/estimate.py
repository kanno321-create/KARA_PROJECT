from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from ..core.database import session_scope
from ..services.quote_service import QuoteService

router = APIRouter(prefix="/v1", tags=["quotes"])


async def get_service():
    async with session_scope() as session:
        yield QuoteService(session)


@router.post("/quotes", status_code=status.HTTP_201_CREATED)
async def create_quote(payload: dict, service: QuoteService = Depends(get_service)):
    data, error = await service.create_quote(
        {
            "title": payload.get("title", "Untitled"),
            "customer_company": payload.get("customerInfo", {}).get("company", ""),
            "customer_contact": payload.get("customerInfo", {}).get("contact", ""),
            "customer_email": payload.get("customerInfo", {}).get("email"),
            "enclosure_type": payload.get("enclosureInfo", {}).get("type", ""),
            "enclosure_material": payload.get("enclosureInfo", {}).get("material", ""),
            "main_breaker_type": payload.get("mainBreakerInfo", {}).get("type", ""),
            "main_breaker_poles": payload.get("mainBreakerInfo", {}).get("poles", ""),
            "main_breaker_capacity": payload.get("mainBreakerInfo", {}).get("capacity", ""),
            "dedup_key": payload.get("dedupKey"),
        }
    )
    if error == "duplicate":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={"error": {"code": "DUPLICATE_KEY", "message": "dedupKey conflict", "meta": {"dedupKey": payload.get("dedupKey")}}})
    return data


@router.get("/quotes/{quote_id}")
async def read_quote(quote_id: uuid.UUID, service: QuoteService = Depends(get_service)):
    data = await service.get_quote(quote_id)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": {"code": "not_found", "message": "Quote not found"}})
    return data
