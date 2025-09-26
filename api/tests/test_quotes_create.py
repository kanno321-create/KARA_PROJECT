import json
import uuid
from pathlib import Path

import pytest


PAYLOAD_DIR = Path(__file__).resolve().parents[2] / "payload_samples"


def load_payload(name: str) -> dict:
    with (PAYLOAD_DIR / name).open("r", encoding="utf-8-sig") as fp:
        return json.load(fp)


@pytest.mark.asyncio
async def test_quote_create_minimal(client):
    payload = load_payload("quotes_post_minimal.json")
    payload["dedupKey"] = f"QUOTE-MINIMAL-{uuid.uuid4()}"
    response = await client.post("/v1/quotes", json=payload)
    assert response.status_code == 201
    body = response.json()
    assert body["meta"]["dedupKey"] == payload["dedupKey"]
    assert body["customerInfo"]["email"] == payload["customerInfo"]["email"]


@pytest.mark.asyncio
async def test_quote_create_missing_fields(client):
    payload = load_payload("quotes_post_invalid_missing.json")
    response = await client.post("/v1/quotes", json=payload)
    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "validation_error"
    assert any(detail["field"].startswith("enclosureInfo") for detail in body["error"]["details"])


@pytest.mark.asyncio
async def test_quote_create_invalid_type(client):
    payload = load_payload("quotes_post_invalid_type.json")
    response = await client.post("/v1/quotes", json=payload)
    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "validation_error"
    assert any(detail["field"].startswith("branchBreakers") for detail in body["error"]["details"])


@pytest.mark.asyncio
async def test_quote_create_duplicate_dedup_key(client):
    payload = load_payload("quotes_post_minimal.json")
    payload["dedupKey"] = f"QUOTE-DUP-{uuid.uuid4()}"
    first = await client.post("/v1/quotes", json=payload)
    assert first.status_code == 201
    duplicate = await client.post("/v1/quotes", json=payload)
    assert duplicate.status_code == 409
    body = duplicate.json()
    assert body["error"]["code"] == "DUPLICATE_KEY"
    assert body["error"]["meta"]["dedupKey"] == payload["dedupKey"]

