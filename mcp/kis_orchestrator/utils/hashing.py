"""Hash utilities."""
from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Iterable

from .fs import ensure_dir

__all__ = ["sha256", "update_sha_file"]

def sha256(path: str | Path) -> str:
    digest = hashlib.sha256()
    with Path(path).open("rb") as fp:
        for chunk in iter(lambda: fp.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()

def update_sha_file(sha_file: str | Path, files: Iterable[str | Path]) -> None:
    lines = []
    for file in files:
        file_path = Path(file)
        if not file_path.is_file():
            continue
        digest = sha256(file_path)
        lines.append(f"{digest}  {file_path.name}")
    if not lines:
        return
    sha_path = Path(sha_file)
    ensure_dir(sha_path.parent)
    existing = []
    if sha_path.exists():
        existing = sha_path.read_text(encoding="utf-8").splitlines()
    merged = existing + lines
    sha_path.write_text("\n".join(merged) + "\n", encoding="utf-8")
