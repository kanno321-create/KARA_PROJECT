from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel


class EnclosureOption(BaseModel):
    code: str
    label: str
    type: str
    material: str
    basePrice: float


class BreakerOption(BaseModel):
    code: str
    type: str
    poles: str
    capacity: str
    brand: str
    unitPrice: float


class AccessoryCategory(BaseModel):
    id: str
    label: str
    details: List[str]
    specs: Dict[str, List[str]]
    defaultUnitPrice: float


class MagnetOption(BaseModel):
    model: str
    timerOptions: List[str]
    pblOptions: List[str]
    unitPrice: float


class MaterialOption(BaseModel):
    code: str
    label: str
    thickness: str
    unitPrice: float
