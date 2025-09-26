import pytest

from kis_backend.schemas import BreakerSettingsUpdate


@pytest.mark.asyncio
async def test_breaker_settings_requires_admin(client):
    payload = BreakerSettingsUpdate(mainBrand="KIS", branchBrand="KIS", accessoryBrand="KIS")
    response = await client.put("/v1/settings/breakers", json=payload.model_dump())
    assert response.status_code == 403

    response = await client.put(
        "/v1/settings/breakers",
        json=payload.model_dump(),
        headers={"X-KIS-Role": "KIS_ADMIN"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["mainBrand"] == "KIS"