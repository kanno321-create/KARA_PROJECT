import asyncio
import json
import uuid

import pytest

from kis_backend.schemas import (
    BranchBreakerInput,
    CustomerInfo,
    EnclosureInfo,
    EstimateRequest,
    MainBreakerInfo,
    QuoteCreateRequest,
    QuoteSnapshot,
)


@pytest.mark.asyncio
async def test_quote_create_and_estimate(client):
    payload = QuoteCreateRequest(
        title="Test Quote",
        customerInfo=CustomerInfo(company="ACME", contact="010-0000-0000", email="test@example.com", address="Seoul"),
        enclosureInfo=EnclosureInfo(type="indoor", boxType="standard", material="STEEL 1.6T"),
        mainBreakerInfo=MainBreakerInfo(type="MCCB", poles="4P", capacity="200A", brand="KIS"),
        branchBreakers=[BranchBreakerInput(type="MCCB", poles="3P", capacity="50A", quantity=2)],
        accessories=[],
    )
    response = await client.post("/v1/quotes", json=payload.model_dump(mode="json"))
    assert response.status_code == 201
    data = response.json()
    quote_id = data["quoteId"]

    estimate_request = EstimateRequest(
        quoteId=uuid.UUID(quote_id),
        snapshot=QuoteSnapshot(
            customerInfo=payload.customerInfo,
            enclosureInfo=payload.enclosureInfo,
            mainBreakerInfo=payload.mainBreakerInfo,
            branchBreakers=payload.branchBreakers,
            accessories=[],
        ),
    )
    response = await client.post("/v1/estimate", json=estimate_request.model_dump(mode="json"))
    assert response.status_code == 200
    estimate = response.json()
    assert estimate["total"] > 0


@pytest.mark.asyncio
async def test_quote_conflict_on_duplicate_dedup_key(client):
    dedup_key = f"dup-key-spec-{uuid.uuid4().hex[:8]}"
    base = {
        "title": "Duplicate Key",
        "customerInfo": {"company": "ACME", "contact": "010", "email": "dup@example.com", "address": "Seoul"},
        "enclosureInfo": {"type": "indoor", "boxType": "standard", "material": "STEEL 1.6T"},
        "mainBreakerInfo": {"type": "MCCB", "poles": "3P", "capacity": "100A", "brand": "KIS"},
        "branchBreakers": [],
        "accessories": [],
        "dedupKey": dedup_key,
    }

    first = await client.post("/v1/quotes", json=base)
    assert first.status_code == 201

    duplicate = await client.post("/v1/quotes", json=base)
    assert duplicate.status_code == 409

    error = duplicate.json()["error"]
    assert error["code"] == "DUPLICATE_KEY"
    assert error["meta"]["dedupKey"] == dedup_key


@pytest.mark.asyncio
async def test_estimate_validation_error(client):
    base = {
        "title": "Invalid",
        "customerInfo": {"company": "Test", "contact": "", "email": "invalid@example.com", "address": "Seoul"},
        "enclosureInfo": {"type": "indoor", "boxType": "standard", "material": "STEEL 1.6T"},
        "mainBreakerInfo": {"type": "MCCB", "poles": "4P", "capacity": "", "brand": "KIS"},
        "branchBreakers": [],
        "accessories": [],
    }
    resp = await client.post("/v1/quotes", json=base)
    quote_id = resp.json()["quoteId"]
    payload = {
        "quoteId": quote_id,
        "snapshot": {
            "customerInfo": base["customerInfo"],
            "enclosureInfo": base["enclosureInfo"],
            "mainBreakerInfo": base["mainBreakerInfo"],
            "branchBreakers": [],
            "accessories": [],
        },
    }
    response = await client.post("/v1/estimate", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_concurrent_quote_creation_race_condition(client):
    dedup_key = f"race-test-{uuid.uuid4().hex[:8]}"
    payload = {
        "title": "Concurrent Test",
        "customerInfo": {"company": "RACE Co.", "contact": "010-1111-2222", "email": "race@test.com", "address": "Seoul"},
        "enclosureInfo": {"type": "indoor", "boxType": "standard", "material": "STEEL 1.6T"},
        "mainBreakerInfo": {"type": "MCCB", "poles": "3P", "capacity": "100A", "brand": "KIS"},
        "branchBreakers": [],
        "accessories": [],
        "dedupKey": dedup_key,
    }

    async def create_quote():
        data = json.loads(json.dumps(payload))
        return await client.post("/v1/quotes", json=data)

    results = await asyncio.gather(create_quote(), create_quote(), return_exceptions=True)
    status_codes = [r.status_code if hasattr(r, "status_code") else 500 for r in results]
    assert 201 in status_codes
    assert 409 in status_codes
    conflict_response = next(r for r in results if hasattr(r, "status_code") and r.status_code == 409)
    conflict_body = conflict_response.json()["error"]
    assert conflict_body["code"] == "DUPLICATE_KEY"
    assert conflict_body["meta"]["dedupKey"] == dedup_key


@pytest.mark.asyncio
async def test_dedup_key_null_policy(client):
    payload = {
        "title": "Null DedupKey Test",
        "customerInfo": {"company": "NULL Co.", "contact": "010", "email": "null@test.com", "address": "Seoul"},
        "enclosureInfo": {"type": "indoor", "boxType": "standard", "material": "STEEL 1.6T"},
        "mainBreakerInfo": {"type": "MCCB", "poles": "3P", "capacity": "100A", "brand": "KIS"},
        "branchBreakers": [],
        "accessories": [],
    }

    first = await client.post("/v1/quotes", json=payload)
    assert first.status_code == 201
    second = await client.post("/v1/quotes", json=payload)
    assert second.status_code == 201
