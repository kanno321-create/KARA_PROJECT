"""Hash utilities for template and evidence verification."""

from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Union

from . import guard

PathLike = Union[str, Path]


def sha256_file(path: PathLike) -> str:
    """Return the sha256 hex digest for a file."""
    file_path = Path(path).resolve()
    guard.ensure_whitelisted(file_path)
    digest = hashlib.sha256()
    with file_path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sha256_bytes(payload: bytes) -> str:
    """Return the sha256 hex digest for bytes."""
    return hashlib.sha256(payload).hexdigest()
