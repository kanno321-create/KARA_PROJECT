from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from ..models.core import FileGuardAudit


class FileGuardRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def record_event(self, event: FileGuardAudit) -> None:
        self.session.add(event)
        await self.session.flush()