from __future__ import annotations

from fastapi import APIRouter

from ..services.catalog_service import CatalogService

router = APIRouter(prefix="/v1/catalog", tags=["catalog"])
service = CatalogService()


@router.get("/enclosures")
async def list_enclosures():
    return {"items": service.list_enclosures()}


@router.get("/breakers")
async def list_breakers(type: str | None = None):
    return {"items": service.list_breakers(type)}


@router.get("/accessories")
async def list_accessories():
    return {"categories": service.list_accessories()}


@router.get("/magnets")
async def list_magnets():
    return {"items": service.list_magnets()}


@router.get("/materials")
async def list_materials():
    return {"items": service.list_materials()}