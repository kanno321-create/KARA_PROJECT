from __future__ import annotations

import random
import time
import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from ..models.core import Quote
from ..repositories.estimate_repository import EstimateRepository
from ..repositories.quote_repository import QuoteRepository
from ..utils.time import utc_now
from ..schemas import EstimateItem, EstimateRequest, EstimateResponse, QuoteSnapshot, ValidationIssue, ValidationResponse


ENCLOSURE_BASE = {
    ("indoor", "STEEL 1.6T"): 850000,
    ("indoor", "STEEL 2.0T"): 950000,
    ("outdoor", "STEEL 1.6T"): 980000,
    ("outdoor", "STS 1.5T"): 1250000,
}
MAIN_BREAKER_BASE = {
    "100A": 320000,
    "125A": 360000,
    "150A": 380000,
    "175A": 400000,
    "200A": 450000,
    "225A": 480000,
    "250A": 520000,
    "300A": 560000,
    "400A": 610000,
    "500A": 720000,
    "600A": 840000,
}
BRANCH_UNIT_COST = 75000
ACCESSORY_UNIT_COST = 125000
TAX_RATE = 0.1


class EstimateService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.quotes = QuoteRepository(session)
        self.estimates = EstimateRepository(session)

    async def validate(self, request: EstimateRequest) -> ValidationResponse:
        issues: list[ValidationIssue] = []
        snapshot = request.snapshot
        if not snapshot.branchBreakers:
            issues.append(ValidationIssue(code="missing_branch_breaker", severity="warning", field="branchBreakers", message="No branch breakers specified"))
        if not snapshot.mainBreakerInfo.capacity:
            issues.append(ValidationIssue(code="missing_main_breaker_capacity", severity="error", field="mainBreakerInfo.capacity", message="Main breaker capacity is required"))
        valid = not any(issue.severity == "error" for issue in issues)
        return ValidationResponse(valid=valid, issues=issues)

    async def generate(self, request: EstimateRequest) -> EstimateResponse:
        start = time.perf_counter()
        snapshot = request.snapshot
        subtotal = 0.0
        items: list[EstimateItem] = []

        enclosure_price = ENCLOSURE_BASE.get((snapshot.enclosureInfo.type, snapshot.enclosureInfo.material), 900000)
        subtotal += enclosure_price
        items.append(
            EstimateItem(
                lineId=str(uuid.uuid4()),
                description=f"Enclosure {snapshot.enclosureInfo.boxType or 'standard'} ({snapshot.enclosureInfo.material})",
                quantity=1,
                unitPrice=enclosure_price,
                lineTotal=enclosure_price,
                category="enclosure",
                metadata={"type": snapshot.enclosureInfo.type},
            )
        )

        breaker_capacity = snapshot.mainBreakerInfo.capacity or "200A"
        main_breaker_price = MAIN_BREAKER_BASE.get(breaker_capacity, 450000)
        subtotal += main_breaker_price
        items.append(
            EstimateItem(
                lineId=str(uuid.uuid4()),
                description=f"Main breaker {snapshot.mainBreakerInfo.type} {snapshot.mainBreakerInfo.poles} {breaker_capacity}",
                quantity=1,
                unitPrice=main_breaker_price,
                lineTotal=main_breaker_price,
                category="main_breaker",
                metadata={"brand": snapshot.mainBreakerInfo.brand},
            )
        )

        for branch in snapshot.branchBreakers:
            unit_price = BRANCH_UNIT_COST
            line_total = unit_price * branch.quantity
            subtotal += line_total
            items.append(
                EstimateItem(
                    lineId=str(uuid.uuid4()),
                    description=f"Branch breaker {branch.type} {branch.poles} {branch.capacity}",
                    quantity=branch.quantity,
                    unitPrice=unit_price,
                    lineTotal=line_total,
                    category="branch_breaker",
                )
            )

        for accessory in snapshot.accessories:
            unit_price = ACCESSORY_UNIT_COST
            line_total = unit_price * accessory.quantity
            subtotal += line_total
            items.append(
                EstimateItem(
                    lineId=str(uuid.uuid4()),
                    description=f"Accessory {accessory.category} {accessory.detail or ''}",
                    quantity=accessory.quantity,
                    unitPrice=unit_price,
                    lineTotal=line_total,
                    category="accessory",
                )
            )

        tax = round(subtotal * TAX_RATE, 2)
        total = round(subtotal + tax, 2)
        latency_ms = int((time.perf_counter() - start) * 1000)
        risk_score = max(0.0, min(1.0, 0.3 + 0.02 * len(snapshot.branchBreakers)))
        meta = {
            "latencyMs": latency_ms,
            "dedupKey": request.dedupKey,
            "riskScore": risk_score,
            "traceId": str(uuid.uuid4()),
        }
        response = await self.estimates.save_estimate(
            quote_id=request.quoteId,
            items=items,
            subtotal=subtotal,
            tax=tax,
            total=total,
            evidence_bundle_id=None,
            meta=meta,
        )
        quote = await self.session.get(Quote, request.quoteId)
        if quote:
            quote.updated_at = utc_now()
            await self.session.flush()
        return response
