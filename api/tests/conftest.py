from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path
from typing import AsyncIterator

import pytest
from httpx import AsyncClient, ASGITransport

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR / "src"))

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")

from kis_backend.config import get_settings
from kis_backend.database import init_db
from kis_backend.main import app


def pytest_sessionstart(session: pytest.Session) -> None:
    get_settings.cache_clear()  # type: ignore[attr-defined]


@pytest.fixture(scope="session")
def event_loop() -> asyncio.AbstractEventLoop:
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def prepare_database() -> None:
    await init_db()


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac