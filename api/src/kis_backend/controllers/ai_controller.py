from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, UploadFile

from ..dependencies import get_db_session
from ..services.ai_service import AIService
from ..schemas import (
    ChatAsyncAccepted,
    ChatMessageRequest,
    ChatMessageResponse,
    ChatPrompt,
    ChatPromptList,
    FileAnalysisStatus,
    FileAnalysisTicket,
    ManagerMessageRequest,
    ManagerMessageResponse,
)

router = APIRouter(prefix="/v1/ai", tags=["ai"])


@router.get("/chat/prompts", response_model=ChatPromptList)
async def list_prompts(persona: str = "estimator", limit: int = 6, session=Depends(get_db_session)):
    service = AIService(session)
    prompts = await service.list_prompts(persona, limit)
    return ChatPromptList(prompts=prompts)


@router.post("/chat/messages", response_model=ChatMessageResponse, responses={202: {"model": ChatAsyncAccepted}})
async def send_chat_message(payload: ChatMessageRequest, session=Depends(get_db_session)):
    service = AIService(session)
    # For now always return sync response
    return await service.send_chat_message(payload)


@router.post("/manager/messages", response_model=ManagerMessageResponse)
async def send_manager_message(payload: ManagerMessageRequest, session=Depends(get_db_session)):
    service = AIService(session)
    return await service.send_manager_message(payload)


@router.post("/manager/uploads", response_model=FileAnalysisTicket, status_code=202)
async def create_file_analysis(
    quoteId: Optional[str] = None,
    dedupKey: Optional[str] = None,
    files: list[UploadFile] = File(...),
    session=Depends(get_db_session),
):
    service = AIService(session)
    quote_uuid = uuid.UUID(quoteId) if quoteId else None
    filenames = [file.filename for file in files]
    return await service.create_file_analysis(quote_id=quote_uuid, filenames=filenames, dedup_key=dedupKey)


@router.get("/manager/uploads/{analysis_id}", response_model=FileAnalysisStatus)
async def get_file_analysis(analysis_id: uuid.UUID, session=Depends(get_db_session)):
    service = AIService(session)
    return await service.get_file_analysis(analysis_id)