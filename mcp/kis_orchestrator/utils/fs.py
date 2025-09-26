"""Filesystem helpers for orchestrator."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterable

from .timez import utc_iso

__all__ = [
    "ensure_dir",
    "write_text",
    "write_json",
    "append_jsonl",
    "list_files",
    "touch",
]

def ensure_dir(path: str | Path) -> Path:
    target = Path(path)
    target.mkdir(parents=True, exist_ok=True)
    return target

def write_text(path: str | Path, text: str) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(text, encoding="utf-8")

def touch(path: str | Path) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).touch()

def write_json(path: str | Path, data: Any) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

def append_jsonl(path: str | Path, data: dict[str, Any]) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with Path(path).open("a", encoding="utf-8") as fp:
        fp.write(json.dumps(data, ensure_ascii=False) + "\n")

def list_files(path: str | Path, patterns: Iterable[str] | None = None) -> list[Path]:
    target = Path(path)
    if not target.exists():
        return []
    if patterns:
        results: list[Path] = []
        for pattern in patterns:
            results.extend(target.glob(pattern))
        return sorted(set(results))
    return sorted(p for p in target.rglob("*") if p.is_file())

