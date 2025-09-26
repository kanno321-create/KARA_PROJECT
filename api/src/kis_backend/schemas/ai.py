from __future__ import annotations

import datetime as dt
import uuid
from typing import List, Optional

from pydantic import BaseModel


class MessageAttachment(BaseModel):
    id: Optional[uuid.UUID] = None
    filename: str
    contentType: str
    sizeBytes: int
    evidenceBundleId: Optional[uuid.UUID] = None


class ChatPrompt(BaseModel):
    id: uuid.UUID
    title: str
    prompt: str
    category: Optional[str] = None
    createdAt: dt.datetime


class ChatPromptList(BaseModel):
    prompts: List[ChatPrompt]


class ChatMessageRequest(BaseModel):
    sessionId: Optional[uuid.UUID] = None
    channel: str
    message: str
    attachments: List[MessageAttachment] = []
    dedupKey: Optional[str] = None


class ChatAsyncAccepted(BaseModel):
    sessionId: uuid.UUID
    requestId: str
    estimatedLatencyMs: int


class EvidenceRef(BaseModel):
    bundleId: Optional[uuid.UUID]
    itemId: Optional[str]
    label: Optional[str]
    url: Optional[str]


class PolicyPlanNode(BaseModel):
    id: str
    label: str
    status: str
    predictedPassProbability: Optional[float]


class PolicyPlanEdge(BaseModel):
    from_: str
    to: str

    model_config = {
        "populate_by_name": True,
        "alias_generator": lambda field_name: "from" if field_name == "from_" else field_name,
    }


class PolicyPlanSummary(BaseModel):
    nodes: List[PolicyPlanNode]
    edges: List[PolicyPlanEdge]
    warnings: List[str] = []


class RiskBadge(BaseModel):
    level: str
    predictedGatePassRate: Optional[float]
    blockers: List[str] = []


class ChatMessageResponse(BaseModel):
    sessionId: uuid.UUID
    reply: str
    actions: List[dict] = []
    evidenceRefs: List[EvidenceRef] = []
    planTree: Optional[PolicyPlanSummary] = None
    meta: dict = {}


class ManagerMessageRequest(BaseModel):
    sessionId: Optional[uuid.UUID] = None
    message: str
    context: dict = {}
    enableRiskPreview: bool = True
    enableEvidenceDrawer: bool = True


class ManagerMessageResponse(BaseModel):
    sessionId: uuid.UUID
    reply: str
    riskBadge: Optional[RiskBadge]
    evidenceBundleId: Optional[uuid.UUID]
    queueUpdate: Optional[dict]
    meta: dict = {}


class FileAnalysisTicket(BaseModel):
    analysisId: uuid.UUID
    status: str
    traceId: Optional[str]
    receivedFiles: int


class FileAnalysisStatus(BaseModel):
    analysisId: uuid.UUID
    status: str
    autoFillPayload: Optional[dict]
    evidenceBundleId: Optional[uuid.UUID]
    messages: List[str] = []
    errors: List[str] = []
