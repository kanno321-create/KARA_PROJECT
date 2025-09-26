from __future__ import annotations

import datetime as dt
import uuid
from typing import List, Optional

from pydantic import BaseModel

from .ai import PolicyPlanSummary, RiskBadge


class PolicyPlanRequest(BaseModel):
    instruction: str
    context: dict = {}


class PolicyPlanResponse(BaseModel):
    planId: uuid.UUID
    planTree: PolicyPlanSummary
    riskBadge: Optional[RiskBadge]


class PolicyAgreementRequest(BaseModel):
    planId: uuid.UUID
    approvedBy: List[dict]
    lock: bool = True
    notes: Optional[str] = None


class PolicyAgreementResponse(BaseModel):
    agreementId: uuid.UUID
    planId: uuid.UUID
    locked: bool
    signedAt: dt.datetime


class ApprovalRequestCreate(BaseModel):
    quoteId: uuid.UUID
    riskNote: str
    approvers: List[dict]
    dueAt: Optional[dt.datetime] = None


class ApprovalRequestResource(BaseModel):
    requestId: uuid.UUID
    quoteId: uuid.UUID
    riskNote: str
    status: str
    approvers: List[dict]
    createdAt: dt.datetime


class ApprovalDecision(BaseModel):
    decision: str
    rationale: Optional[str] = None
    actor: Optional[dict] = None


class AgentQueueCard(BaseModel):
    cardId: uuid.UUID
    title: str
    status: str
    gatePassProbability: Optional[float]
    costToggleUsed: bool
    evidenceBundleId: Optional[uuid.UUID]
    quoteId: Optional[uuid.UUID]
    updatedAt: dt.datetime


class AgentQueueCardPatch(BaseModel):
    status: Optional[str] = None
    costToggleUsed: Optional[bool] = None
    notes: Optional[str] = None


class BreakerSettings(BaseModel):
    mainBrand: str
    branchBrand: str
    accessoryBrand: str
    updatedAt: dt.datetime
    updatedBy: Optional[str]


class BreakerSettingsUpdate(BaseModel):
    mainBrand: str
    branchBrand: str
    accessoryBrand: str


class KnowledgePack(BaseModel):
    packId: uuid.UUID
    title: str
    rule: str
    counterExamples: List[str]
    tests: List[str]
    hash: str
    version: int
    updatedAt: dt.datetime
    updatedBy: Optional[str]


class KnowledgePackUpsert(BaseModel):
    title: str
    rule: str
    counterExamples: List[str]
    tests: List[str]
    hash: str
