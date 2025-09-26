from __future__ import annotations

import datetime as dt
import uuid
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from ..models.core import FileGuardAudit
from ..repositories.file_guard_repository import FileGuardRepository
from ..repositories.mail_repository import MailRepository
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

WHITELIST = FileGuardWhitelist(
    readOnlyPaths=["/KIS/Templates"],
    writablePaths=["/KIS/Work"],
    allowedExtensions=[".pdf", ".xls", ".dwg", ".json"],
    allowedCommands=["ls", "cp", "python"]
)


class IntegrationService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.file_guard = FileGuardRepository(session)
        self.mail = MailRepository(session)

    async def get_whitelist(self) -> FileGuardWhitelist:
        return WHITELIST

    async def record_guard_event(self, payload: FileGuardAuditEvent) -> str:
        event = FileGuardAudit(
            action=payload.action,
            path=payload.path,
            allowed=payload.allowed,
            reason=payload.reason,
            timestamp=payload.timestamp,
        )
        await self.file_guard.record_event(event)
        return str(event.id)

    async def dispatch_quote(self, payload: QuoteDispatchRequest, quote_id: uuid.UUID) -> QuoteDispatchResponse:
        trace_id = str(uuid.uuid4())
        preview = f"Dispatch via {payload.channel} to {', '.join(payload.recipients or ['default'])}"
        return QuoteDispatchResponse(dispatchId=uuid.uuid4(), status="queued", preview=preview, traceId=trace_id)

    async def import_mail(self, payload: MailImportRequest) -> MailImportResponse:
        metadata = {"from": payload.from_, "to": payload.to}
        return await self.mail.create_session(message_id=payload.messageId, quote_id=None, metadata=metadata)

    async def create_mail_draft(self, payload: MailDraftRequest) -> MailDraftResponse:
        mjml = f"<mjml><mj-body><mj-section><mj-column><mj-text>Quote {payload.quoteId} summary</mj-text></mj-column></mj-section></mj-body></mjml>"
        warnings: List[str] = []
        return await self.mail.create_draft(quote_id=payload.quoteId, session_id=payload.sessionId, mjml=mjml, warnings=warnings)
