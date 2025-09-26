from __future__ import annotations

import uuid
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from ..repositories.evidence_repository import EvidenceRepository
from ..schemas import EvidenceBundle, EvidenceItem


class EvidenceService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = EvidenceRepository(session)

    async def create_bundle(self, quote_id: Optional[uuid.UUID], items: List[EvidenceItem]) -> EvidenceBundle:
        return await self.repo.create_bundle(quote_id, items)

    async def get_bundle(self, bundle_id: uuid.UUID) -> EvidenceBundle:
        return await self.repo.get_bundle(bundle_id)
