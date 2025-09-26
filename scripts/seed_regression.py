from __future__ import annotations

import json
from pathlib import Path

SEED_PATH = Path("tests/regression/seeds.jsonl")


def main() -> None:
    if not SEED_PATH.exists():
        raise SystemExit("seeds file not found")
    count = 0
    with SEED_PATH.open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                json.loads(line)
                count += 1
    print(f"Loaded {count} regression seed scenarios")


if __name__ == "__main__":
    main()