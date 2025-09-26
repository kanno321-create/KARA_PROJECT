from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from ..models.core import MailDraft, MailSession
from ..schemas import MailDraftResponse, MailImportResponse
from ..utils.time import utc_now


class MailRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_session(self, *, message_id: str, quote_id: Optional[uuid.UUID], metadata: dict) -> MailImportResponse:
        session = MailSession(message_id=message_id, quote_id=quote_id, metadata=metadata)
        self.session.add(session)
        await self.session.flush()
        return MailImportResponse(sessionId=session.session_id, quoteId=quote_id, createdAt=session.created_at)

    async def create_draft(self, *, quote_id: uuid.UUID, session_id: Optional[uuid.UUID], mjml: str, warnings: list[str]) -> MailDraftResponse:
        draft = MailDraft(quote_id=quote_id, session_id=session_id, mjml=mjml, warnings=warnings, created_at=utc_now())
        self.session.add(draft)
        await self.session.flush()
        return MailDraftResponse(draftId=draft.id, mjml=draft.mjml, warnings=draft.warnings)
