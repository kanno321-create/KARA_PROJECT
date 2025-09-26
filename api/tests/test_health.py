import pytest


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"