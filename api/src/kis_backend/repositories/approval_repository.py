from __future__ import annotations

import uuid
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..exceptions import not_found
from ..models.core import ApprovalRequest
from ..schemas import ApprovalDecision, ApprovalRequestCreate, ApprovalRequestResource
from ..utils.time import utc_now, utc_iso


class ApprovalRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_request(self, payload: ApprovalRequestCreate) -> ApprovalRequestResource:
        request = ApprovalRequest(
            quote_id=payload.quoteId,
            risk_note=payload.riskNote,
            approvers=payload.approvers,
            due_at=payload.dueAt,
            status="in_review",
            created_at=utc_now(),
        )
        self.session.add(request)
        await self.session.flush()
        return self._to_schema(request)

    async def apply_decision(self, request_id: uuid.UUID, decision: ApprovalDecision) -> ApprovalRequestResource:
        request = await self.session.get(ApprovalRequest, request_id)
        if not request:
            raise not_found("approval_request", str(request_id))
        for approver in request.approvers:
            if decision.actor and approver.get("userId") == decision.actor.get("userId"):
                approver["decision"] = decision.decision
                approver["decidedAt"] = utc_iso()
        if all(a.get("decision") == "approve" for a in request.approvers if a.get("decision")):
            request.status = "approved"
        elif any(a.get("decision") == "reject" for a in request.approvers):
            request.status = "rejected"
        request.metadata_blob.setdefault("history", []).append({
            "timestamp": utc_iso(),
            "decision": decision.decision,
            "actor": decision.actor,
            "rationale": decision.rationale,
        })
        await self.session.flush()
        return self._to_schema(request)

    async def list_requests_for_quote(self, quote_id: uuid.UUID) -> List[ApprovalRequestResource]:
        stmt = select(ApprovalRequest).where(ApprovalRequest.quote_id == quote_id)
        rows = (await self.session.execute(stmt)).scalars().all()
        return [self._to_schema(row) for row in rows]

    def _to_schema(self, request: ApprovalRequest) -> ApprovalRequestResource:
        return ApprovalRequestResource(
            requestId=request.id,
            quoteId=request.quote_id,
            riskNote=request.risk_note,
            status=request.status,
            approvers=request.approvers,
            createdAt=request.created_at,
        )

