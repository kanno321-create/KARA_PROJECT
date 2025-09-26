from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from ..exceptions import not_found
from ..models.core import FileAnalysisJob
from ..schemas import FileAnalysisStatus, FileAnalysisTicket


class FileAnalysisRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_job(self, *, quote_id: Optional[uuid.UUID], file_names: list[str], dedup_key: Optional[str]) -> FileAnalysisTicket:
        job = FileAnalysisJob(quote_id=quote_id, file_names=file_names, dedup_key=dedup_key, status="queued")
        self.session.add(job)
        await self.session.flush()
        return FileAnalysisTicket(analysisId=job.id, status=job.status, traceId=str(uuid.uuid4()), receivedFiles=len(file_names))

    async def update_job(self, job_id: uuid.UUID, *, status: str, auto_fill_payload: Optional[dict]) -> None:
        job = await self.session.get(FileAnalysisJob, job_id)
        if not job:
            raise not_found("file_analysis", str(job_id))
        job.status = status
        job.auto_fill_payload = auto_fill_payload
        await self.session.flush()

    async def get_job(self, job_id: uuid.UUID) -> FileAnalysisStatus:
        job = await self.session.get(FileAnalysisJob, job_id)
        if not job:
            raise not_found("file_analysis", str(job_id))
        return FileAnalysisStatus(
            analysisId=job.id,
            status=job.status,
            autoFillPayload=job.auto_fill_payload,
            evidenceBundleId=job.evidence_bundle_id,
            messages=job.messages,
            errors=job.errors,
        )