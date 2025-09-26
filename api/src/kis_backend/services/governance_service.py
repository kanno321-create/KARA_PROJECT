from __future__ import annotations

import uuid
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from ..models.core import PolicyAgreement
from ..repositories.agent_queue_repository import AgentQueueRepository
from ..repositories.approval_repository import ApprovalRepository
from ..repositories.knowledge_repository import KnowledgeRepository
from ..repositories.settings_repository import BreakerSettingsRepository
from ..utils.time import utc_now
from ..schemas import (
    AgentQueueCard,
    AgentQueueCardPatch,
    ApprovalDecision,
    ApprovalRequestCreate,
    ApprovalRequestResource,
    BreakerSettings,
    BreakerSettingsUpdate,
    KnowledgePack,
    KnowledgePackUpsert,
    PolicyAgreementRequest,
    PolicyAgreementResponse,
    PolicyPlanRequest,
    PolicyPlanResponse,
    PolicyPlanSummary,
    RiskBadge,
)


class GovernanceService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.breakers = BreakerSettingsRepository(session)
        self.knowledge = KnowledgeRepository(session)
        self.approvals = ApprovalRepository(session)
        self.queue = AgentQueueRepository(session)

    async def get_breaker_settings(self) -> BreakerSettings:
        return await self.breakers.get()

    async def update_breaker_settings(self, payload: BreakerSettingsUpdate, *, actor_role: str) -> BreakerSettings:
        return await self.breakers.update(payload, actor_role=actor_role)

    async def list_knowledge_packs(self) -> List[KnowledgePack]:
        return await self.knowledge.list_packs()

    async def create_knowledge_pack(self, payload: KnowledgePackUpsert, *, actor_role: str, actor_id: str) -> KnowledgePack:
        return await self.knowledge.create_pack(payload, actor_role=actor_role, actor_id=actor_id)

    async def update_knowledge_pack(self, pack_id: uuid.UUID, payload: KnowledgePackUpsert, *, actor_role: str, actor_id: str) -> KnowledgePack:
        return await self.knowledge.update_pack(pack_id, payload, actor_role=actor_role, actor_id=actor_id)

    async def create_approval_request(self, payload: ApprovalRequestCreate) -> ApprovalRequestResource:
        return await self.approvals.create_request(payload)

    async def submit_approval_decision(self, request_id: uuid.UUID, payload: ApprovalDecision) -> ApprovalRequestResource:
        return await self.approvals.apply_decision(request_id, payload)

    async def list_agent_queue(self) -> List[AgentQueueCard]:
        return await self.queue.list_cards()

    async def update_agent_queue(self, card_id: uuid.UUID, patch: AgentQueueCardPatch) -> AgentQueueCard:
        return await self.queue.upsert_card(card_id, patch)

    async def compile_policy_plan(self, payload: PolicyPlanRequest) -> PolicyPlanResponse:
        nodes = [
            {"id": "start", "label": "Analyze instruction", "status": "ready", "predictedPassProbability": 0.9},
            {"id": "gate", "label": "Quality gate", "status": "pending", "predictedPassProbability": 0.82},
        ]
        edges = [{"from": "start", "to": "gate"}]
        plan_id = uuid.uuid4()
        summary = PolicyPlanSummary(nodes=nodes, edges=edges, warnings=["Ensure evidence bundle linked"])
        risk_badge = RiskBadge(level="medium", predictedGatePassRate=0.82, blockers=["missing_evidence"])
        return PolicyPlanResponse(planId=plan_id, planTree=summary, riskBadge=risk_badge)

    async def create_policy_agreement(self, payload: PolicyAgreementRequest) -> PolicyAgreementResponse:
        agreement = PolicyAgreement(
            plan_id=payload.planId,
            approvers=payload.approvedBy,
            locked=payload.lock,
            notes=payload.notes,
            signed_at=utc_now(),
        )
        self.session.add(agreement)
        await self.session.flush()
        return PolicyAgreementResponse(agreementId=agreement.id, planId=agreement.plan_id, locked=agreement.locked, signedAt=agreement.signed_at)

