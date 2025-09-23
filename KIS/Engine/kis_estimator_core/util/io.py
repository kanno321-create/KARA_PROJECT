"""Filesystem helpers for the KIS estimator core."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

from . import guard

PACKAGE_ROOT = Path(__file__).resolve().parent.parent
CONTRACT_DIR = PACKAGE_ROOT / "contracts"


def load_contract(contract_name: str) -> Dict[str, Any]:
    """Return a JSON contract as a Python dictionary."""
    contract_path = CONTRACT_DIR / contract_name
    guard.ensure_whitelisted(contract_path)
    with contract_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def ensure_dir(path: Path) -> Path:
    """Create directory if missing while enforcing guard rules."""
    guard.ensure_whitelisted(path, allow_directory=True)
    path.mkdir(parents=True, exist_ok=True)
    return path


def read_json(path: Path) -> Dict[str, Any]:
    """Read JSON file with guard enforcement."""
    guard.ensure_whitelisted(path)
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: Dict[str, Any]) -> Path:
    """Persist JSON payload in a guarded location."""
    guard.ensure_whitelisted(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)
    return path
