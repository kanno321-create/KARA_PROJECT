from __future__ import annotations

import datetime as dt
import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, JSON, DateTime
from sqlmodel import Field, SQLModel

from ..utils.time import utc_now


JSON_TYPE = JSON  # portable default for JSON columns


def dict_json_field() -> Field:
    return Field(default_factory=dict, sa_column=Column(JSON_TYPE))


def list_json_field() -> Field:
    return Field(default_factory=list, sa_column=Column(JSON_TYPE))


def optional_json_field() -> Field:
    return Field(default=None, sa_column=Column(JSON_TYPE))


def required_utc_datetime_field() -> Field:
    return Field(default_factory=utc_now, sa_column=Column(DateTime(timezone=True), nullable=False))


def optional_utc_datetime_field() -> Field:
    return Field(default=None, sa_column=Column(DateTime(timezone=True), nullable=True))


class Quote(SQLModel, table=True):
    __tablename__ = "quotes"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, nullable=False)
    title: str
    status: str = Field(default="draft", index=True)
    customer_info: Dict[str, Any] = dict_json_field()
    enclosure_info: Dict[str, Any] = dict_json_field()
    main_breaker_info: Dict[str, Any] = dict_json_field()
    branch_breakers: List[Dict[str, Any]] = list_json_field()
    accessories: List[Dict[str, Any]] = list_json_field()
    dedup_key: Optional[str] = Field(default=None, index=True, unique=True)
    created_at: dt.datetime = required_utc_datetime_field()
    updated_at: dt.datetime = required_utc_datetime_field()


class Estimate(SQLModel, table=True):
    __tablename__ = "estimates"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quote_id: uuid.UUID = Field(index=True, nullable=False)
    version: int = Field(default=1)
    currency: str = Field(default="KRW")
    subtotal: float = 0.0
    tax: float = 0.0
    total: float = 0.0
    items: List[Dict[str, Any]] = list_json_field()
    risk_score: Optional[float] = None
    dedup_key: Optional[str] = None
    evidence_bundle_id: Optional[uuid.UUID] = Field(default=None, index=True)
    meta: Dict[str, Any] = dict_json_field()
    created_at: dt.datetime = required_utc_datetime_field()


class BreakerSettings(SQLModel, table=True):
    __tablename__ = "breaker_settings"

    id: int = Field(default=1, primary_key=True)
    main_brand: str
    branch_brand: str
    accessory_brand: str
    updated_by: Optional[str] = None
    updated_at: dt.datetime = required_utc_datetime_field()


class KnowledgePack(SQLModel, table=True):
    __tablename__ = "knowledge_packs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str
    rule: str
    counter_examples: List[str] = list_json_field()
    tests: List[str] = list_json_field()
    hash: str
    version: int = Field(default=1)
    updated_by: Optional[str] = None
    updated_at: dt.datetime = required_utc_datetime_field()


class PolicyAgreement(SQLModel, table=True):
    __tablename__ = "policy_agreements"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    plan_id: uuid.UUID = Field(index=True)
    approvers: List[Dict[str, Any]] = list_json_field()
    locked: bool = Field(default=True)
    notes: Optional[str] = None
    signed_at: dt.datetime = required_utc_datetime_field()


class ApprovalRequest(SQLModel, table=True):
    __tablename__ = "approval_requests"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quote_id: uuid.UUID = Field(index=True)
    risk_note: str
    approvers: List[Dict[str, Any]] = list_json_field()
    status: str = Field(default="in_review")
    due_at: Optional[dt.datetime] = optional_utc_datetime_field()
    metadata_blob: Dict[str, Any] = dict_json_field()
    created_at: dt.datetime = required_utc_datetime_field()


class AgentQueueCard(SQLModel, table=True):
    __tablename__ = "agent_queue_cards"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quote_id: Optional[uuid.UUID] = Field(default=None, index=True)
    title: str
    status: str = Field(default="inbox")
    gate_pass_probability: Optional[float] = None
    cost_toggle_used: bool = False
    evidence_bundle_id: Optional[uuid.UUID] = Field(default=None, index=True)
    notes: Optional[str] = None
    updated_at: dt.datetime = required_utc_datetime_field()


class EvidenceBundle(SQLModel, table=True):
    __tablename__ = "evidence_bundles"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quote_id: Optional[uuid.UUID] = Field(default=None, index=True)
    items: List[Dict[str, Any]] = list_json_field()
    created_at: dt.datetime = required_utc_datetime_field()


class FileAnalysisJob(SQLModel, table=True):
    __tablename__ = "file_analysis_jobs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quote_id: Optional[uuid.UUID] = Field(default=None, index=True)
    status: str = Field(default="queued")
    file_names: List[str] = list_json_field()
    auto_fill_payload: Optional[Dict[str, Any]] = optional_json_field()
    evidence_bundle_id: Optional[uuid.UUID] = Field(default=None)
    messages: List[str] = list_json_field()
    errors: List[str] = list_json_field()
    dedup_key: Optional[str] = None
    created_at: dt.datetime = required_utc_datetime_field()


class FileGuardAudit(SQLModel, table=True):
    __tablename__ = "file_guard_audits"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    action: str
    path: str
    allowed: bool
    reason: Optional[str] = None
    timestamp: dt.datetime = required_utc_datetime_field()


class MailSession(SQLModel, table=True):
    __tablename__ = "mail_sessions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    message_id: str = Field(index=True)
    quote_id: Optional[uuid.UUID] = Field(default=None, index=True)
    session_id: uuid.UUID = Field(default_factory=uuid.uuid4, index=True)
    metadata_blob: Dict[str, Any] = dict_json_field()
    created_at: dt.datetime = required_utc_datetime_field()


class MailDraft(SQLModel, table=True):
    __tablename__ = "mail_drafts"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quote_id: uuid.UUID = Field(index=True)
    session_id: Optional[uuid.UUID] = Field(default=None, index=True)
    mjml: str
    warnings: List[str] = list_json_field()
    created_at: dt.datetime = required_utc_datetime_field()


class QuoteRevisionRecord(SQLModel, table=True):
    __tablename__ = "quote_revisions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quote_id: uuid.UUID = Field(index=True)
    revision_number: int
    snapshot: Dict[str, Any] = dict_json_field()
    summary: Optional[str] = None
    created_by: Optional[str] = None
    created_at: dt.datetime = required_utc_datetime_field()
