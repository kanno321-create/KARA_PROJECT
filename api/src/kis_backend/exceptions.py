from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status


class AppException(HTTPException):
    def __init__(self, status_code: int, code: str, message: str, *, details: list[dict[str, Any]] | None = None, meta: dict[str, Any] | None = None) -> None:
        error_payload = {"code": code, "message": message, "details": details or []}
        if meta:
            error_payload["meta"] = meta
        super().__init__(status_code=status_code, detail={"error": error_payload})


def not_found(resource: str, identifier: str) -> AppException:
    return AppException(status.HTTP_404_NOT_FOUND, "not_found", f"{resource} {identifier} not found")


def conflict(message: str) -> AppException:
    return AppException(status.HTTP_409_CONFLICT, "conflict", message)


def forbidden(message: str = "forbidden") -> AppException:
    return AppException(status.HTTP_403_FORBIDDEN, "forbidden", message)


def bad_request(message: str, *, details: list[dict[str, Any]] | None = None) -> AppException:
    return AppException(status.HTTP_400_BAD_REQUEST, "bad_request", message, details=details)


def duplicate_key_conflict(dedup_key: str) -> AppException:
    """dedupKey duplicate key conflict - 409 error (Spec Kit requirement)"""
    return AppException(
        status.HTTP_409_CONFLICT,
        "DUPLICATE_KEY",
        f"Resource with dedupKey '{dedup_key}' already exists",
        meta={"dedupKey": dedup_key}
    )
