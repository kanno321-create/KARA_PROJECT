from __future__ import annotations

import datetime as dt
import uuid
from typing import Any, List, Optional

from pydantic import BaseModel, EmailStr, Field


class CustomerInfo(BaseModel):
    company: str = ""
    contact: str = ""
    email: Optional[EmailStr] = None
    address: str = ""


class EnclosureInfo(BaseModel):
    type: str = Field(default="indoor", pattern="^(indoor|outdoor)$")
    boxType: str = ""
    material: str = ""
    specialRequest: Optional[str] = None


class MainBreakerInfo(BaseModel):
    type: str = Field(default="MCCB", pattern="^(MCCB|ELB)$")
    poles: str = ""
    capacity: str = ""
    brand: Optional[str] = None


class BranchBreakerInput(BaseModel):
    type: str
    poles: str
    capacity: str
    quantity: int = Field(ge=1, default=1)


class BranchBreakerPatch(BaseModel):
    type: Optional[str] = None
    poles: Optional[str] = None
    capacity: Optional[str] = None
    quantity: Optional[int] = Field(default=None, ge=1)


class BranchBreaker(BranchBreakerInput):
    itemId: uuid.UUID
    unitCost: float
    totalCost: float
    vendor: Optional[str] = None


class AccessoryInput(BaseModel):
    category: str
    detail: Optional[str] = None
    spec: Optional[str] = None
    quantity: int = Field(ge=1, default=1)


class AccessoryPatch(BaseModel):
    detail: Optional[str] = None
    spec: Optional[str] = None
    quantity: Optional[int] = Field(default=None, ge=1)


class Accessory(AccessoryInput):
    itemId: uuid.UUID
    fullName: str
    unitCost: float
    totalCost: float
    notes: Optional[str] = None


class QuoteSnapshot(BaseModel):
    customerInfo: CustomerInfo
    enclosureInfo: EnclosureInfo
    mainBreakerInfo: MainBreakerInfo
    branchBreakers: List[BranchBreakerInput]
    accessories: List[AccessoryInput]


class QuoteCreateRequest(BaseModel):
    title: str
    customerInfo: CustomerInfo
    enclosureInfo: EnclosureInfo
    mainBreakerInfo: MainBreakerInfo
    branchBreakers: List[BranchBreakerInput] = []
    accessories: List[AccessoryInput] = []
    dedupKey: Optional[str] = None


class QuotePatchRequest(BaseModel):
    title: Optional[str] = None
    customerInfo: Optional[CustomerInfo] = None
    enclosureInfo: Optional[EnclosureInfo] = None
    mainBreakerInfo: Optional[MainBreakerInfo] = None
    branchBreakers: Optional[List[BranchBreakerInput]] = None
    accessories: Optional[List[AccessoryInput]] = None
    metadata: Optional[dict[str, Any]] = None


class QuoteSummary(BaseModel):
    quoteId: uuid.UUID
    title: str
    status: str
    customer: Optional[str]
    total: Optional[float]
    currency: Optional[str]
    updatedAt: dt.datetime


class QuoteResource(BaseModel):
    quoteId: uuid.UUID
    title: str
    customerInfo: CustomerInfo
    enclosureInfo: EnclosureInfo
    mainBreakerInfo: MainBreakerInfo
    branchBreakers: List[BranchBreaker]
    accessories: List[Accessory]
    status: str
    latestEstimateId: Optional[uuid.UUID] = None
    updatedAt: dt.datetime
    createdAt: dt.datetime
    meta: dict[str, Any] = Field(default_factory=dict)


class QuoteRevision(BaseModel):
    revisionId: uuid.UUID
    createdAt: dt.datetime
    createdBy: str
    summary: Optional[str]
    snapshot: QuoteSnapshot


class EstimateItem(BaseModel):
    lineId: str
    description: str
    quantity: float
    unitPrice: float
    lineTotal: float
    category: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class EstimateRequest(BaseModel):
    quoteId: uuid.UUID
    snapshot: QuoteSnapshot
    options: dict[str, Any] = Field(default_factory=dict)
    dedupKey: Optional[str] = None

    def model_dump(self, *args, **kwargs):
        kwargs.setdefault("mode", "json")
        return super().model_dump(*args, **kwargs)



class EstimateResponse(BaseModel):
    quoteId: uuid.UUID
    estimateId: uuid.UUID
    version: int
    currency: str
    subtotal: float
    tax: float
    total: float
    items: List[EstimateItem]
    evidenceBundleId: Optional[uuid.UUID]
    meta: dict[str, Any] = Field(default_factory=dict)


class ValidationIssue(BaseModel):
    code: str
    severity: str
    field: Optional[str]
    message: str


class ValidationResponse(BaseModel):
    valid: bool
    issues: List[ValidationIssue]


class ForecastResponse(BaseModel):
    estimateId: uuid.UUID
    forecast: dict[str, Any]
    warnings: List[str] = Field(default_factory=list)


class ReplayResult(BaseModel):
    quoteId: uuid.UUID
    baselineRevisionId: Optional[uuid.UUID] = None
    replayRevisionId: Optional[uuid.UUID] = None
    impact: dict[str, Any] = Field(default_factory=dict)
    evidenceBundleId: Optional[uuid.UUID] = None



