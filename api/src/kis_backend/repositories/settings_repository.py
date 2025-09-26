from __future__ import annotations


from sqlalchemy.ext.asyncio import AsyncSession

from ..exceptions import forbidden
from ..models.core import BreakerSettings
from ..schemas import BreakerSettings as BreakerSettingsSchema, BreakerSettingsUpdate
from ..utils.time import utc_now


class BreakerSettingsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self) -> BreakerSettingsSchema:
        settings = await self.session.get(BreakerSettings, 1)
        if not settings:
            settings = BreakerSettings(id=1, main_brand="KIS", branch_brand="KIS", accessory_brand="KIS")
            self.session.add(settings)
            await self.session.flush()
        return BreakerSettingsSchema(
            mainBrand=settings.main_brand,
            branchBrand=settings.branch_brand,
            accessoryBrand=settings.accessory_brand,
            updatedAt=settings.updated_at,
            updatedBy=settings.updated_by,
        )

    async def update(self, payload: BreakerSettingsUpdate, *, actor_role: str) -> BreakerSettingsSchema:
        if actor_role != "KIS_ADMIN":
            raise forbidden("Only KIS_ADMIN may update breaker settings")
        settings = await self.session.get(BreakerSettings, 1)
        if not settings:
            settings = BreakerSettings(id=1, main_brand=payload.mainBrand, branch_brand=payload.branchBrand, accessory_brand=payload.accessoryBrand)
            self.session.add(settings)
        else:
            settings.main_brand = payload.mainBrand
            settings.branch_brand = payload.branchBrand
            settings.accessory_brand = payload.accessoryBrand
            settings.updated_at = utc_now()
            settings.updated_by = actor_role
        await self.session.flush()
        return await self.get()
