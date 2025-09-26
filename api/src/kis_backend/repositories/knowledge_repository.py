from __future__ import annotations

import uuid
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..exceptions import forbidden, not_found
from ..models.core import KnowledgePack
from ..schemas import KnowledgePack as KnowledgePackSchema, KnowledgePackUpsert


class KnowledgeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_packs(self) -> List[KnowledgePackSchema]:
        stmt = select(KnowledgePack).order_by(KnowledgePack.updated_at.desc())
        rows = (await self.session.execute(stmt)).scalars().all()
        return [self._to_schema(row) for row in rows]

    async def create_pack(self, payload: KnowledgePackUpsert, *, actor_role: str, actor_id: str = "system") -> KnowledgePackSchema:
        if actor_role != "KIS_ADMIN":
            raise forbidden("Only KIS_ADMIN may create knowledge packs")
        pack = KnowledgePack(
            title=payload.title,
            rule=payload.rule,
            counter_examples=payload.counterExamples,
            tests=payload.tests,
            hash=payload.hash,
            updated_by=actor_id,
        )
        self.session.add(pack)
        await self.session.flush()
        return self._to_schema(pack)

    async def update_pack(self, pack_id: uuid.UUID, payload: KnowledgePackUpsert, *, actor_role: str, actor_id: str = "system") -> KnowledgePackSchema:
        if actor_role != "KIS_ADMIN":
            raise forbidden("Only KIS_ADMIN may update knowledge packs")
        pack = await self.session.get(KnowledgePack, pack_id)
        if not pack:
            raise not_found("knowledge_pack", str(pack_id))
        pack.title = payload.title
        pack.rule = payload.rule
        pack.counter_examples = payload.counterExamples
        pack.tests = payload.tests
        pack.hash = payload.hash
        pack.version += 1
        pack.updated_by = actor_id
        await self.session.flush()
        return self._to_schema(pack)

    def _to_schema(self, pack: KnowledgePack) -> KnowledgePackSchema:
        return KnowledgePackSchema(
            packId=pack.id,
            title=pack.title,
            rule=pack.rule,
            counterExamples=pack.counter_examples,
            tests=pack.tests,
            hash=pack.hash,
            version=pack.version,
            updatedAt=pack.updated_at,
            updatedBy=pack.updated_by,
        )