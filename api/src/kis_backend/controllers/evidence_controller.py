from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends

from ..dependencies import get_db_session
from ..services.evidence_service import EvidenceService
from ..schemas import EvidenceBundle, EvidenceItem

router = APIRouter(prefix="/v1/evidence", tags=["evidence"])


@router.get("/{bundle_id}", response_model=EvidenceBundle)
async def get_bundle(bundle_id: uuid.UUID, session=Depends(get_db_session)):
    service = EvidenceService(session)
    return await service.get_bundle(bundle_id)


@router.post("/", response_model=EvidenceBundle, status_code=201)
async def create_bundle(items: List[EvidenceItem], quoteId: uuid.UUID | None = None, session=Depends(get_db_session)):
    service = EvidenceService(session)
    return await service.create_bundle(quoteId, items)