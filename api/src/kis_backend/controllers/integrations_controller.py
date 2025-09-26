from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends

from ..dependencies import get_db_session
from ..services.integration_service import IntegrationService
from ..utils.auth import get_current_role
from ..schemas import (
    FileGuardAuditEvent,
    FileGuardWhitelist,
    MailDraftRequest,
    MailDraftResponse,
    MailImportRequest,
    MailImportResponse,
    QuoteDispatchRequest,
    QuoteDispatchResponse,
)

router = APIRouter(prefix="/v1", tags=["integrations"])


@router.get("/file-guard/whitelist", response_model=FileGuardWhitelist)
async def get_whitelist(session=Depends(get_db_session)):
    service = IntegrationService(session)
    return await service.get_whitelist()


@router.post("/file-guard/audit", status_code=202)
async def record_guard_event(payload: FileGuardAuditEvent, session=Depends(get_db_session)):
    service = IntegrationService(session)
    trace_id = await service.record_guard_event(payload)
    return {"traceId": trace_id}


@router.post("/quotes/{quote_id}/dispatch", response_model=QuoteDispatchResponse, status_code=202)
async def dispatch_quote(quote_id: uuid.UUID, payload: QuoteDispatchRequest, role: str = Depends(get_current_role), session=Depends(get_db_session)):
    service = IntegrationService(session)
    return await service.dispatch_quote(payload, quote_id)


@router.post("/integrations/mail/import", response_model=MailImportResponse, status_code=201)
async def import_mail(payload: MailImportRequest, session=Depends(get_db_session)):
    service = IntegrationService(session)
    return await service.import_mail(payload)


@router.post("/integrations/mail/draft", response_model=MailDraftResponse)
async def create_mail_draft(payload: MailDraftRequest, session=Depends(get_db_session)):
    service = IntegrationService(session)
    return await service.create_mail_draft(payload)