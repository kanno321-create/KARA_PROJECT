import os

os.environ.setdefault('KIS_DATABASE_URL', 'sqlite+aiosqlite:///./test_quotes.db')

﻿import pytest
from httpx import AsyncClient

from api.src.kis_backend.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        resp = await client.get("/v1/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert body["timestamp"].endswith("Z")
