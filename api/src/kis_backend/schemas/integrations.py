from __future__ import annotations

import datetime as dt
import uuid
from typing import List, Optional

from pydantic import BaseModel


class FileGuardWhitelist(BaseModel):
    readOnlyPaths: List[str]
    writablePaths: List[str]
    allowedExtensions: List[str]
    allowedCommands: List[str]


class FileGuardAuditEvent(BaseModel):
    action: str
    path: str
    allowed: bool
    reason: Optional[str] = None
    timestamp: dt.datetime


class QuoteDispatchRequest(BaseModel):
    channel: str
    recipients: List[str] = []
    includeEvidence: bool = False
    notes: Optional[str] = None


class QuoteDispatchResponse(BaseModel):
    dispatchId: uuid.UUID
    status: str
    preview: Optional[str]
    traceId: str


class MailImportRequest(BaseModel):
    messageId: str
    subject: str
    from_: Optional[str] = None
    to: List[str] = []
    attachments: List[dict] = []

    model_config = {
        "populate_by_name": True,
        "alias_generator": lambda field_name: "from" if field_name == "from_" else field_name,
    }


class MailImportResponse(BaseModel):
    sessionId: uuid.UUID
    quoteId: Optional[uuid.UUID]
    createdAt: dt.datetime


class MailDraftRequest(BaseModel):
    quoteId: uuid.UUID
    sessionId: Optional[uuid.UUID] = None
    template: Optional[str] = None


class MailDraftResponse(BaseModel):
    draftId: uuid.UUID
    mjml: str
    warnings: List[str] = []
