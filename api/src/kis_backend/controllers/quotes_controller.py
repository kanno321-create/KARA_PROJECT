from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..dependencies import get_db_session
from ..services.estimate_service import EstimateService
from ..services.quote_service import QuoteService
from ..schemas import (
    AccessoryInput,
    AccessoryPatch,
    BranchBreakerInput,
    BranchBreakerPatch,
    EstimateRequest,
    EstimateResponse,
    ForecastResponse,
    QuoteCreateRequest,
    QuotePatchRequest,
    QuoteResource,
    QuoteRevision,
    QuoteSummary,
    ReplayResult,
    ValidationResponse,
)

router = APIRouter(prefix="/v1", tags=["quotes"])


@router.get("/quotes", response_model=dict)
async def list_quotes(
    status_filter: str | None = Query(default="draft", alias="status"),
    limit: int = Query(default=20, ge=1, le=100),
    cursor: str | None = None,
    session=Depends(get_db_session),
):
    service = QuoteService(session)
    items, next_cursor = await service.list_quotes(status=status_filter, limit=limit, cursor=cursor)
    return {"items": items, "nextCursor": next_cursor}


@router.post("/quotes", response_model=QuoteResource, status_code=status.HTTP_201_CREATED)
async def create_quote(payload: QuoteCreateRequest, session=Depends(get_db_session)):
    service = QuoteService(session)
    return await service.create_quote(payload)


@router.get("/quotes/{quote_id}", response_model=QuoteResource)
async def get_quote(quote_id: uuid.UUID, session=Depends(get_db_session)):
    service = QuoteService(session)
    return await service.get_quote(quote_id)


@router.patch("/quotes/{quote_id}", response_model=QuoteResource)
async def update_quote(quote_id: uuid.UUID, payload: QuotePatchRequest, session=Depends(get_db_session)):
    service = QuoteService(session)
    return await service.update_quote(quote_id, payload)


@router.post("/quotes/{quote_id}/branch-breakers", response_model=QuoteResource, status_code=status.HTTP_201_CREATED)
async def add_branch_breaker(quote_id: uuid.UUID, payload: BranchBreakerInput, session=Depends(get_db_session)):
    service = QuoteService(session)
    return await service.add_branch_breaker(quote_id, payload)


@router.patch("/quotes/{quote_id}/branch-breakers/{item_id}", response_model=QuoteResource)
async def update_branch_breaker(quote_id: uuid.UUID, item_id: uuid.UUID, payload: BranchBreakerPatch, session=Depends(get_db_session)):
    service = QuoteService(session)
    return await service.update_branch_breaker(quote_id, item_id, payload)


@router.delete("/quotes/{quote_id}/branch-breakers/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_branch_breaker(quote_id: uuid.UUID, item_id: uuid.UUID, session=Depends(get_db_session)):
    service = QuoteService(session)
    await service.delete_branch_breaker(quote_id, item_id)


@router.post("/quotes/{quote_id}/accessories", response_model=QuoteResource, status_code=status.HTTP_201_CREATED)
async def add_accessory(quote_id: uuid.UUID, payload: AccessoryInput, session=Depends(get_db_session)):
    service = QuoteService(session)
    return await service.add_accessory(quote_id, payload)


@router.patch("/quotes/{quote_id}/accessories/{item_id}", response_model=QuoteResource)
async def update_accessory(quote_id: uuid.UUID, item_id: uuid.UUID, payload: AccessoryPatch, session=Depends(get_db_session)):
    service = QuoteService(session)
    return await service.update_accessory(quote_id, item_id, payload)


@router.delete("/quotes/{quote_id}/accessories/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_accessory(quote_id: uuid.UUID, item_id: uuid.UUID, session=Depends(get_db_session)):
    service = QuoteService(session)
    await service.delete_accessory(quote_id, item_id)


@router.get("/quotes/{quote_id}/revisions", response_model=dict)
async def list_revisions(quote_id: uuid.UUID, session=Depends(get_db_session)):
    service = QuoteService(session)
    revisions: list[QuoteRevision] = await service.list_revisions(quote_id)
    return {"revisions": revisions}


@router.post("/quotes/{quote_id}/replay", response_model=ReplayResult)
async def replay_quote(quote_id: uuid.UUID, session=Depends(get_db_session)):
    # Stub replay logic
    return ReplayResult(
        quoteId=quote_id,
        baselineRevisionId=None,
        replayRevisionId=None,
        impact={
            "totalDelta": 0.0,
            "costDelta": 0.0,
            "heatDelta": 0.0,
            "clearanceDelta": 0.0,
            "documentationDelta": 0.0,
        },
        evidenceBundleId=None,
    )


@router.post("/estimate", response_model=EstimateResponse)
async def create_estimate(payload: EstimateRequest, session=Depends(get_db_session)):
    estimator = EstimateService(session)
    validation = await estimator.validate(payload)
    if not validation.valid:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail={"error": {"code": "validation_error", "message": "Quote snapshot invalid", "details": [issue.model_dump() for issue in validation.issues]}})
    return await estimator.generate(payload)


@router.post("/validate", response_model=ValidationResponse)
async def validate_quote(payload: EstimateRequest, session=Depends(get_db_session)):
    estimator = EstimateService(session)
    return await estimator.validate(payload)


@router.post("/estimates/{estimate_id}/forecast", response_model=ForecastResponse)
async def forecast_estimate(estimate_id: uuid.UUID, session=Depends(get_db_session)):
    # Stub forecast
    data = {
        "demand": [
            {"date": "2024-11-01", "quantity": 10, "unit": "ea"},
            {"date": "2024-12-01", "quantity": 6, "unit": "ea"},
        ],
        "delivery": [
            {"date": "2024-10-15", "milestone": "Prototype"},
            {"date": "2024-11-20", "milestone": "Production"},
        ],
        "procurementSuggestions": [
            {"sku": "MCCB-200", "recommendedQty": 12, "leadTimeDays": 21}
        ],
    }
    return ForecastResponse(estimateId=estimate_id, forecast=data, warnings=[])