import pytest

from kis_backend.schemas import ChatMessageRequest


@pytest.mark.asyncio
async def test_chat_prompts(client):
    response = await client.get("/v1/ai/chat/prompts")
    assert response.status_code == 200
    data = response.json()
    assert len(data["prompts"]) > 0


@pytest.mark.asyncio
async def test_chat_message(client):
    payload = ChatMessageRequest(channel="chat", message="test")
    response = await client.post("/v1/ai/chat/messages", json=payload.model_dump())
    assert response.status_code == 200
    assert "reply" in response.json()


@pytest.mark.asyncio
async def test_file_analysis(client):
    files = {"files": ("drawing.pdf", b"dummy", "application/pdf")}
    response = await client.post("/v1/ai/manager/uploads", files=files)
    assert response.status_code == 202
    ticket = response.json()
    analysis_id = ticket["analysisId"]
    status_resp = await client.get(f"/v1/ai/manager/uploads/{analysis_id}")
    assert status_resp.status_code == 200
    data = status_resp.json()
    assert data["status"] == "complete"
