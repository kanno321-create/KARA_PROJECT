"""Sandbox guard utilities enforcing KIS desktop policies."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

KIS_ROOT = Path(__file__).resolve().parents[3]
WORKSPACE_ROOT = KIS_ROOT.parent

ALLOWED_ROOTS = {
    (KIS_ROOT / "Work").resolve(),
    (KIS_ROOT / "Templates").resolve(),
    (KIS_ROOT / "Rules").resolve(),
    (KIS_ROOT / "Tools").resolve(),
    (KIS_ROOT / "Engine").resolve(),
    (KIS_ROOT / "tests").resolve(),
    (KIS_ROOT / "scripts").resolve(),
    (WORKSPACE_ROOT / "dist").resolve(),
}

ALLOWED_SUFFIXES = {
    ".json",
    ".yaml",
    ".yml",
    ".csv",
    ".xlsx",
    ".pdf",
    ".svg",
    ".png",
    ".parquet",  # [REAL-LOGIC] allow parquet evidence snapshots
    ".log",
    ".md",
}


def _in_whitelist(path: Path, whitelist: Iterable[Path]) -> bool:
    return any(path == allowed or allowed in path.parents for allowed in whitelist)


def ensure_whitelisted(path: Path, allow_directory: bool = False) -> None:
    """Ensure a path is within allowed roots and uses an approved extension."""
    resolved = Path(path).resolve()
    if not _in_whitelist(resolved, ALLOWED_ROOTS):
        raise PermissionError(f"Path outside whitelist: {resolved}")
    if allow_directory:
        return
    suffix = resolved.suffix.lower()
    if not suffix:
        raise PermissionError(f"Missing extension not permitted: {resolved}")
    if suffix not in ALLOWED_SUFFIXES:
        raise PermissionError(f"Extension not permitted: {resolved}")


@dataclass
class LicenseCostGuard:
    """Placeholder cost and license guard that always passes."""

    enabled: bool = True

    def check(self) -> dict:
        status = "pass" if self.enabled else "disabled"
        return {
            "status": status,
            "message": "License/Cost guard stub - no issues detected",
        }


LICENSE_COST_GUARD = LicenseCostGuard(enabled=True)
