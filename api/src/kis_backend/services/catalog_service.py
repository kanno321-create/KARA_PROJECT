from __future__ import annotations

from ..schemas import AccessoryCategory, BreakerOption, EnclosureOption, MagnetOption, MaterialOption

ENCLOSURES = [
    EnclosureOption(code="ENCL-STD", label="Standard enclosure", type="indoor", material="STEEL 1.6T", basePrice=850000.0),
    EnclosureOption(code="ENCL-OUT", label="Outdoor enclosure", type="outdoor", material="STEEL 1.6T", basePrice=980000.0),
]
BREAKERS = [
    BreakerOption(code="MCCB-100", type="MCCB", poles="3P", capacity="100A", brand="KIS", unitPrice=320000.0),
    BreakerOption(code="MCCB-200", type="MCCB", poles="4P", capacity="200A", brand="KIS", unitPrice=450000.0),
]
ACCESSORIES = [
    AccessoryCategory(
        id="meter",
        label="Meter",
        details=["single_phase", "three_phase"],
        specs={"single_phase": ["electronic", "mechanical"], "three_phase": ["electronic"]},
        defaultUnitPrice=150000.0,
    ),
    AccessoryCategory(
        id="condenser",
        label="Condenser",
        details=["single_phase", "three_phase"],
        specs={"single_phase": ["uf:10", "uf:20"], "three_phase": ["uf:50"]},
        defaultUnitPrice=220000.0,
    ),
]
MAGNETS = [
    MagnetOption(model="MC-65", timerOptions=["YES", "NO"], pblOptions=["YES", "NO"], unitPrice=180000.0)
]
MATERIALS = [
    MaterialOption(code="ST16", label="STEEL 1.6T", thickness="1.6T", unitPrice=320000.0),
    MaterialOption(code="ST20", label="STEEL 2.0T", thickness="2.0T", unitPrice=410000.0),
]


class CatalogService:
    def list_enclosures(self) -> list[EnclosureOption]:
        return ENCLOSURES

    def list_breakers(self, breaker_type: str | None) -> list[BreakerOption]:
        if breaker_type:
            return [item for item in BREAKERS if item.type == breaker_type]
        return BREAKERS

    def list_accessories(self) -> list[AccessoryCategory]:
        return ACCESSORIES

    def list_magnets(self) -> list[MagnetOption]:
        return MAGNETS

    def list_materials(self) -> list[MaterialOption]:
        return MATERIALS