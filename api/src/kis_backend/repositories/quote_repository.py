from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.quote import Quote
from ..utils.time import utc_now


class QuoteRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, *, payload: dict) -> Quote:
        quote = Quote(**payload)
        now = utc_now()
        quote.created_at = now
        quote.updated_at = now
        self.session.add(quote)
        try:
            await self.session.flush()
        except IntegrityError as exc:
            raise DuplicateDedupKeyError from exc
        return quote

    async def get(self, quote_id: uuid.UUID) -> Optional[Quote]:
        return await self.session.get(Quote, quote_id)

    async def get_by_dedup(self, dedup_key: str) -> Optional[Quote]:
        stmt = select(Quote).where(Quote.dedup_key == dedup_key)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()


class DuplicateDedupKeyError(Exception):
    pass
