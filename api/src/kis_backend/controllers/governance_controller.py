from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends

from ..dependencies import get_db_session
from ..services.governance_service import GovernanceService
from ..utils.auth import get_current_role
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
)

router = APIRouter(prefix="/v1", tags=["governance"])


@router.get("/settings/breakers", response_model=BreakerSettings)
async def get_breaker_settings(session=Depends(get_db_session)):
    service = GovernanceService(session)
    return await service.get_breaker_settings()


@router.put("/settings/breakers", response_model=BreakerSettings)
async def update_breaker_settings(payload: BreakerSettingsUpdate, role: str = Depends(get_current_role), session=Depends(get_db_session)):
    service = GovernanceService(session)
    return await service.update_breaker_settings(payload, actor_role=role)


@router.get("/knowledge/packs", response_model=dict)
async def list_knowledge_packs(session=Depends(get_db_session)):
    service = GovernanceService(session)
    packs: list[KnowledgePack] = await service.list_knowledge_packs()
    return {"items": packs}


@router.post("/knowledge/packs", response_model=KnowledgePack, status_code=201)
async def create_knowledge_pack(payload: KnowledgePackUpsert, role: str = Depends(get_current_role), session=Depends(get_db_session)):
    service = GovernanceService(session)
    return await service.create_knowledge_pack(payload, actor_role=role, actor_id="system")


@router.put("/knowledge/packs/{pack_id}", response_model=KnowledgePack)
async def update_knowledge_pack(pack_id: uuid.UUID, payload: KnowledgePackUpsert, role: str = Depends(get_current_role), session=Depends(get_db_session)):
    service = GovernanceService(session)
    return await service.update_knowledge_pack(pack_id, payload, actor_role=role, actor_id="system")


@router.post("/approvals/requests", response_model=ApprovalRequestResource, status_code=201)
async def create_approval_request(payload: ApprovalRequestCreate, session=Depends(get_db_session)):
    service = GovernanceService(session)
    return await service.create_approval_request(payload)


@router.post("/approvals/{request_id}/decisions", response_model=ApprovalRequestResource)
async def submit_approval_decision(request_id: uuid.UUID, payload: ApprovalDecision, session=Depends(get_db_session)):
    service = GovernanceService(session)
    return await service.submit_approval_decision(request_id, payload)


@router.get("/agent-queue", response_model=dict)
async def list_agent_queue(session=Depends(get_db_session)):
    service = GovernanceService(session)
    cards: list[AgentQueueCard] = await service.list_agent_queue()
    return {"cards": cards}


@router.patch("/agent-queue/{card_id}", response_model=AgentQueueCard)
async def update_agent_queue(card_id: uuid.UUID, payload: AgentQueueCardPatch, session=Depends(get_db_session)):
    service = GovernanceService(session)
    return await service.update_agent_queue(card_id, payload)


@router.post("/policy/plan-tree", response_model=PolicyPlanResponse)
async def create_plan_tree(payload: PolicyPlanRequest, session=Depends(get_db_session)):
    service = GovernanceService(session)
    return await service.compile_policy_plan(payload)


@router.post("/policy/agreements", response_model=PolicyAgreementResponse, status_code=201)
async def create_policy_agreement(payload: PolicyAgreementRequest, session=Depends(get_db_session)):
    service = GovernanceService(session)
    return await service.create_policy_agreement(payload)