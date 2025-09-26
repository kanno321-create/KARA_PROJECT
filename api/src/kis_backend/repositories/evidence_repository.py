from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from ..exceptions import not_found
from ..models.core import EvidenceBundle
from ..schemas import EvidenceBundle as EvidenceBundleSchema, EvidenceItem
from ..utils.time import utc_now


class EvidenceRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_bundle(self, quote_id: uuid.UUID | None, items: list[EvidenceItem]) -> EvidenceBundleSchema:
        bundle = EvidenceBundle(
            quote_id=quote_id,
            items=[item.model_dump() for item in items],
            created_at=utc_now(),
        )
        self.session.add(bundle)
        await self.session.flush()
        return self._to_schema(bundle)

    async def get_bundle(self, bundle_id: uuid.UUID) -> EvidenceBundleSchema:
        bundle = await self.session.get(EvidenceBundle, bundle_id)
        if not bundle:
            raise not_found("evidence_bundle", str(bundle_id))
        return self._to_schema(bundle)

    def _to_schema(self, bundle: EvidenceBundle) -> EvidenceBundleSchema:
        return EvidenceBundleSchema(
            bundleId=bundle.id,
            quoteId=bundle.quote_id,
            items=[EvidenceItem(**item) for item in bundle.items],
            createdAt=bundle.created_at,
        )
