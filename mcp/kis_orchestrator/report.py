"""Handoff report utilities."""
from __future__ import annotations

from pathlib import Path
from typing import Iterable

from .utils.fs import ensure_dir, write_text
from .utils.hashing import update_sha_file

def handoff(*, five_lines: Iterable[str], artifact_paths: Iterable[str], sha_file: str | Path = "dist/handoff/SHA256SUMS.txt") -> None:
    handoff_path = Path("dist/handoff/handoff_report.md")
    ensure_dir(handoff_path.parent)
    previous = ""
    if handoff_path.exists():
        previous = handoff_path.read_text(encoding="utf-8")
    five_lines_list = [line.strip() for line in five_lines if line.strip()]
    artifact_list = list(artifact_paths)
    content_lines = ["# KIS Backend – Handoff Summary", ""]
    if five_lines_list:
        content_lines.append("## Executive 5-Line Update")
        content_lines.extend(f"- {line}" for line in five_lines_list)
        content_lines.append("")
    if artifact_list:
        content_lines.append("## Evidence Index")
        content_lines.extend(f"- {path}" for path in artifact_list)
        content_lines.append("")
    if previous:
        content_lines.append("---")
        content_lines.append(previous)
    write_text(handoff_path, "\n".join(content_lines).rstrip() + "\n")
    update_sha_file(sha_file, artifact_list + [handoff_path])
