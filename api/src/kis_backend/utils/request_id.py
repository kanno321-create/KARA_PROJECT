from __future__ import annotations

import contextvars
import uuid
from typing import Callable

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


REQUEST_ID_HEADER = "X-Request-ID"
_REQUEST_ID_CTX: contextvars.ContextVar[str | None] = contextvars.ContextVar("request_id", default=None)
_REPO_ACTION_CTX: contextvars.ContextVar[str | None] = contextvars.ContextVar("repo_action", default=None)
_COMMIT_PHASE_CTX: contextvars.ContextVar[str] = contextvars.ContextVar("commit_phase", default="start")


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        request_id = request.headers.get(REQUEST_ID_HEADER) or str(uuid.uuid4())
        request.state.request_id = request_id
        token_id = _REQUEST_ID_CTX.set(request_id)
        token_repo = _REPO_ACTION_CTX.set(None)
        token_commit = _COMMIT_PHASE_CTX.set("start")
        try:
            response = await call_next(request)
        finally:
            _REQUEST_ID_CTX.reset(token_id)
            _REPO_ACTION_CTX.reset(token_repo)
            _COMMIT_PHASE_CTX.reset(token_commit)
        response.headers[REQUEST_ID_HEADER] = request_id
        return response


def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", _REQUEST_ID_CTX.get() or str(uuid.uuid4()))


def get_request_id_context() -> str | None:
    return _REQUEST_ID_CTX.get()


def set_repo_action(value: str | None) -> None:
    _REPO_ACTION_CTX.set(value)


def get_repo_action() -> str | None:
    return _REPO_ACTION_CTX.get()


def set_commit_phase(value: str) -> None:
    _COMMIT_PHASE_CTX.set(value)


def get_commit_phase() -> str:
    return _COMMIT_PHASE_CTX.get()
