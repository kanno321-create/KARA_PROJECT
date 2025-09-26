from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from ..repositories.quote_repository import QuoteRepository, DuplicateDedupKeyError
from ..utils.time import utc_iso


class QuoteService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = QuoteRepository(session)

    async def create_quote(self, payload: dict) -> tuple[dict, Optional[str]]:
        dedup = payload.get('dedup_key')
        if dedup:
            existing = await self.repo.get_by_dedup(dedup)
            if existing:
                return {}, 'duplicate'
        try:
            quote = await self.repo.create(payload=payload)
        except DuplicateDedupKeyError:
            return {}, 'duplicate'
        return self._serialize(quote), None

    async def get_quote(self, quote_id: uuid.UUID) -> Optional[dict]:
        quote = await self.repo.get(quote_id)
        if not quote:
            return None
        return self._serialize(quote)

    def _serialize(self, quote) -> dict:
        return {
            'quoteId': str(quote.id),
            'title': quote.title,
            'status': quote.status,
            'dedupKey': quote.dedup_key,
            'createdAt': utc_iso(quote.created_at),
            'updatedAt': utc_iso(quote.updated_at),
        }
