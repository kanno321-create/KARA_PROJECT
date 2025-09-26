from __future__ import annotations

import uuid
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..exceptions import not_found
from ..models.core import AgentQueueCard
from ..schemas import AgentQueueCard as AgentQueueCardSchema, AgentQueueCardPatch
from ..utils.time import utc_now


class AgentQueueRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_cards(self) -> List[AgentQueueCardSchema]:
        stmt = select(AgentQueueCard).order_by(AgentQueueCard.updated_at.desc())
        rows = (await self.session.execute(stmt)).scalars().all()
        if not rows:
            seed = AgentQueueCard(title="Initial review", status="inbox", gate_pass_probability=0.62, cost_toggle_used=False)
            self.session.add(seed)
            await self.session.flush()
            rows = [seed]
        return [self._to_schema(row) for row in rows]

    async def upsert_card(self, card_id: uuid.UUID, patch: AgentQueueCardPatch) -> AgentQueueCardSchema:
        card = await self.session.get(AgentQueueCard, card_id)
        if not card:
            raise not_found("agent_queue_card", str(card_id))
        if patch.status is not None:
            card.status = patch.status
        if patch.costToggleUsed is not None:
            card.cost_toggle_used = patch.costToggleUsed
        if patch.notes is not None:
            card.notes = patch.notes
        card.updated_at = utc_now()
        await self.session.flush()
        return self._to_schema(card)

    def _to_schema(self, card: AgentQueueCard) -> AgentQueueCardSchema:
        return AgentQueueCardSchema(
            cardId=card.id,
            title=card.title,
            status=card.status,
            gatePassProbability=card.gate_pass_probability,
            costToggleUsed=card.cost_toggle_used,
            evidenceBundleId=card.evidence_bundle_id,
            quoteId=card.quote_id,
            updatedAt=card.updated_at,
        )
