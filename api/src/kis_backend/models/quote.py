from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel

from ..utils.time import utc_now


class Quote(SQLModel, table=True):
    __tablename__ = "quotes"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str
    customer_company: str
    customer_contact: str
    customer_email: Optional[str] = None
    enclosure_type: str
    enclosure_material: str
    main_breaker_type: str
    main_breaker_poles: str
    main_breaker_capacity: str
    status: str = Field(default="draft")
    dedup_key: Optional[str] = Field(default=None, unique=True, index=True)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)
