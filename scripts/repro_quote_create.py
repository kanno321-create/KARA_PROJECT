#!/usr/bin/env python3
from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from typing import Any

import httpx

ARTIFACTS_DIR = Path("dist/test_artifacts")
BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8080")
HEADERS = {"Content-Type": "application/json"}

PAYLOAD_DIR = Path("payload_samples")
CASES = [
    ("success", "quotes_post_minimal.json", 201),
    ("invalid_missing", "quotes_post_invalid_missing.json", 422),
    ("invalid_type", "quotes_post_invalid_type.json", 422),
]


def load_payload(name: str) -> Any:
    path = PAYLOAD_DIR / name
    with path.open("r", encoding="utf-8") as fp:
        return json.load(fp)


async def main() -> None:
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    results: list[str] = []
    async with httpx.AsyncClient(timeout=10.0) as client:
        for label, filename, expected in CASES:
            payload = load_payload(filename)
            response = await client.post(f"{BASE_URL}/v1/quotes", headers=HEADERS, json=payload)
            results.append(
                f"[{label}] expected={expected} actual={response.status_code} body={response.text.strip()}"
            )
        # duplicate dedupKey validation using minimal payload
        payload = load_payload("quotes_post_minimal.json")
        dup_response = await client.post(f"{BASE_URL}/v1/quotes", headers=HEADERS, json=payload)
        results.append(
            f"[duplicate-first] status={dup_response.status_code} body={dup_response.text.strip()}"
        )
        dup_again = await client.post(f"{BASE_URL}/v1/quotes", headers=HEADERS, json=payload)
        results.append(
            f"[duplicate-second] expected=409 actual={dup_again.status_code} body={dup_again.text.strip()}"
        )

    (ARTIFACTS_DIR / "repro_results.txt").write_text("\n".join(results) + "\n", encoding="utf-8")


if __name__ == "__main__":
    asyncio.run(main())
