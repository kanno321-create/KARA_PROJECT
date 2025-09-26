import os

import pytest
from httpx import AsyncClient

os.environ.setdefault('KIS_DATABASE_URL', 'sqlite+aiosqlite:///./test_quotes.db')

from api.src.kis_backend.main import app
from api.src.kis_backend.core.database import init_db

pytestmark = pytest.mark.asyncio


@pytest.fixture(autouse=True)
async def setup_db():
    await init_db()
    yield


async def test_create_quote():
    payload = {
        'title': 'Test',
        'customerInfo': {'company': 'ACME', 'contact': '010', 'email': 'a@b.com'},
        'enclosureInfo': {'type': 'indoor', 'material': 'steel'},
        'mainBreakerInfo': {'type': 'MCCB', 'poles': '3P', 'capacity': '200A'},
    }
    async with AsyncClient(app=app, base_url='http://testserver') as client:
        resp = await client.post('/v1/quotes', json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data['title'] == 'Test'


async def test_duplicate_dedupkey():
    payload = {
        'title': 'Test',
        'customerInfo': {'company': 'ACME', 'contact': '010', 'email': 'a@b.com'},
        'enclosureInfo': {'type': 'indoor', 'material': 'steel'},
        'mainBreakerInfo': {'type': 'MCCB', 'poles': '3P', 'capacity': '200A'},
        'dedupKey': 'dup-1',
    }
    async with AsyncClient(app=app, base_url='http://testserver') as client:
        first = await client.post('/v1/quotes', json=payload)
        assert first.status_code == 201
        second = await client.post('/v1/quotes', json=payload)
        assert second.status_code == 409
