from __future__ import annotations

import uuid
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.core import Estimate
from ..schemas import EstimateItem, EstimateResponse
from ..utils.time import utc_now


class EstimateRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def save_estimate(
        self,
        *,
        quote_id: uuid.UUID,
        items: List[EstimateItem],
        subtotal: float,
        tax: float,
        total: float,
        evidence_bundle_id: uuid.UUID | None,
        meta: dict,
    ) -> EstimateResponse:
        stmt = select(Estimate).where(Estimate.quote_id == quote_id).order_by(Estimate.version.desc())
        last = (await self.session.execute(stmt)).scalars().first()
        version = 1 if last is None else last.version + 1
        estimate = Estimate(
            quote_id=quote_id,
            version=version,
            currency="KRW",
            subtotal=subtotal,
            tax=tax,
            total=total,
            items=[item.model_dump() for item in items],
            evidence_bundle_id=evidence_bundle_id,
            meta=meta,
            created_at=utc_now(),
        )
        self.session.add(estimate)
        await self.session.flush()
        return EstimateResponse(
            quoteId=quote_id,
            estimateId=estimate.id,
            version=estimate.version,
            currency=estimate.currency,
            subtotal=subtotal,
            tax=tax,
            total=total,
            items=items,
            evidenceBundleId=evidence_bundle_id,
            meta=meta,
        )
