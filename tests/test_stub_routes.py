import os

os.environ.setdefault('KIS_DATABASE_URL', 'sqlite+aiosqlite:///./test_quotes.db')

﻿import pytest
from httpx import AsyncClient

from api.src.kis_backend.main import app

pytestmark = pytest.mark.asyncio


async def test_erp_inventory():
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        resp = await client.get("/v1/inventory")
        assert resp.status_code == 200
        assert "items" in resp.json()


async def test_calendar_event_stub():
    payload = {"title": "Kickoff", "erpLink": "https://erp.local/doc"}
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        create = await client.post("/v1/calendar/events", json=payload)
        assert create.status_code == 201
        listing = await client.get("/v1/calendar/events")
        assert listing.status_code == 200


async def test_mail_stubs():
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        send = await client.post("/v1/mail/send", json={"to": ["ops@kis.local"]})
        assert send.status_code == 202
        ingest = await client.post("/v1/mail/ingest", json={"attachments": []})
        assert ingest.status_code == 202
