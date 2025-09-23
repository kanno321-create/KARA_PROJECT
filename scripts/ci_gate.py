# scripts/ci_gate.py
from __future__ import annotations
import subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ret = subprocess.run(["python", "scripts/fix4_gate.py"], cwd=str(ROOT), capture_output=True, text=True)
out = ret.stdout.strip().splitlines()
print("\n".join(out[-12:]))  # 최근 12줄 에코
ok = any(line.startswith("pass=true") for line in out)
sys.exit(0 if ok else 2)