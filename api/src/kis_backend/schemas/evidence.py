from __future__ import annotations

import datetime as dt
import uuid
from typing import List, Optional

from pydantic import BaseModel


class EvidenceItem(BaseModel):
    itemId: str
    kind: str
    uri: str
    hash: Optional[str] = None
    description: Optional[str] = None


class EvidenceBundle(BaseModel):
    bundleId: uuid.UUID
    quoteId: Optional[uuid.UUID]
    items: List[EvidenceItem]
    createdAt: dt.datetime
