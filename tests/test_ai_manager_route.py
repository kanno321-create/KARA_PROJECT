import os

os.environ.setdefault('KIS_DATABASE_URL', 'sqlite+aiosqlite:///./test_quotes.db')

﻿import pytest
from httpx import AsyncClient

from api.src.kis_backend.main import app

pytestmark = pytest.mark.asyncio


async def test_ai_route_stub():
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        resp = await client.post("/v1/ai/route", json={"intent": "estimate"})
        assert resp.status_code == 200
        assert resp.json()["intent"] == "estimate"
