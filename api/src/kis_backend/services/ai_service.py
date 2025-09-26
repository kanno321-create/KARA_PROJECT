from __future__ import annotations

import random
import uuid
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from ..repositories.evidence_repository import EvidenceRepository
from ..repositories.file_analysis_repository import FileAnalysisRepository
from ..utils.time import utc_now
from ..schemas import (
    ChatAsyncAccepted,
    ChatMessageRequest,
    ChatMessageResponse,
    ChatPrompt,
    EvidenceItem,
    FileAnalysisStatus,
    FileAnalysisTicket,
    ManagerMessageRequest,
    ManagerMessageResponse,
    PolicyPlanSummary,
    RiskBadge,
)

PROMPT_LIBRARY = [
    "Project schedule management",
    "Quote drafting helper",
    "AI workflow checklist",
    "Quality gate checklist",
]


class AIService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.files = FileAnalysisRepository(session)
        self.evidence = EvidenceRepository(session)

    async def _commit(self) -> None:
        try:
            await self.session.commit()
        except Exception:
            await self._rollback()
            raise

    async def _rollback(self) -> None:
        await self.session.rollback()

    async def list_prompts(self, persona: str, limit: int) -> List[ChatPrompt]:
        now = utc_now()
        prompts = [
            ChatPrompt(id=uuid.uuid4(), title=text, prompt=text, category=persona, createdAt=now)
            for text in PROMPT_LIBRARY[:limit]
        ]
        return prompts

    async def send_chat_message(self, request: ChatMessageRequest) -> ChatMessageResponse:
        reply = self._synthesize_reply(request.message)
        evidence = [
            EvidenceItem(
                itemId=str(uuid.uuid4()),
                kind="note",
                uri="https://example.com",
                description="Generated evidence stub",
            )
        ]
        bundle = await self.evidence.create_bundle(None, evidence)
        return ChatMessageResponse(
            sessionId=request.sessionId or uuid.uuid4(),
            reply=reply,
            actions=[],
            evidenceRefs=[
                {
                    "bundleId": bundle.bundleId,
                    "itemId": evidence[0].itemId,
                    "label": "analysis",
                    "url": evidence[0].uri,
                }
            ],
            planTree=None,
            meta={"traceId": str(uuid.uuid4()), "latencyMs": random.randint(120, 320)},
        )

    async def send_manager_message(self, request: ManagerMessageRequest) -> ManagerMessageResponse:
        reply = self._synthesize_reply(request.message, manager=True)
        risk_badge = RiskBadge(
            level=random.choice(["low", "medium", "high"]),
            predictedGatePassRate=round(random.uniform(0.6, 0.95), 2),
            blockers=["documentation"],
        )
        plan_tree = PolicyPlanSummary(
            nodes=[
                {"id": "start", "label": "Analyze instruction", "status": "ready", "predictedPassProbability": 0.92},
                {"id": "gate", "label": "Quality gate", "status": "ready", "predictedPassProbability": 0.86},
            ],
            edges=[{"from": "start", "to": "gate"}],
            warnings=["Prepare evidence bundle"],
        )
        return ManagerMessageResponse(
            sessionId=request.sessionId or uuid.uuid4(),
            reply=reply,
            riskBadge=risk_badge,
            evidenceBundleId=None,
            queueUpdate={"status": "ready", "cardId": str(uuid.uuid4())},
            meta={"traceId": str(uuid.uuid4()), "planTree": plan_tree.model_dump()},
        )

    async def create_file_analysis(
        self,
        *,
        quote_id: Optional[uuid.UUID],
        filenames: List[str],
        dedup_key: Optional[str],
    ) -> FileAnalysisTicket:
        ticket = await self.files.create_job(quote_id=quote_id, file_names=filenames, dedup_key=dedup_key)
        auto_fill = {
            "customerInfo": {
                "company": "KIS Electric",
                "contact": "02-1234-5678",
                "email": "contact@example.com",
                "address": "Seoul",
            },
            "enclosureInfo": {
                "type": "indoor",
                "boxType": "standard",
                "material": "STEEL 1.6T",
            },
            "mainBreakerInfo": {
                "type": "MCCB",
                "poles": "4P",
                "capacity": "200A",
                "brand": "KIS",
            },
            "branchBreakers": [
                {
                    "type": "MCCB",
                    "poles": "3P",
                    "capacity": "50A",
                    "quantity": 4,
                }
            ],
            "accessories": [],
        }
        await self.files.update_job(ticket.analysisId, status="complete", auto_fill_payload=auto_fill)
        await self._commit()
        return ticket

    async def get_file_analysis(self, analysis_id: uuid.UUID) -> FileAnalysisStatus:
        return await self.files.get_job(analysis_id)

    def _synthesize_reply(self, message: str, *, manager: bool = False) -> str:
        prefix = "AI Manager:" if manager else "AI:"
        return f"{prefix} draft response for request '{message}'. Please review policy and evidence together."
