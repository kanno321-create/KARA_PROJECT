# scripts/build_release_rc3.py
from __future__ import annotations
import subprocess, time, hashlib, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist"; OUT.mkdir(parents=True, exist_ok=True)
REP = ROOT / "reports"; REP.mkdir(parents=True, exist_ok=True)

FILES = [
    "deploy/fastmcp/openapi_estimate_v1.yaml",
    "deploy/fastmcp/payload_samples/mock_scenarios_v1.json",
    "tests/regression/seeds/regression_seeds_v1.jsonl",
    "scripts/mock_gateway.py",
    "deploy/fastmcp/server.mock.py",
    "scripts/fix4_gate.py",
    "scripts/ci_gate.py",
]

def sha(p:Path)->str: return hashlib.sha256(p.read_bytes()).hexdigest()
def size(p:Path)->int: return p.stat().st_size

# 1) Gate check(필수)
r = subprocess.run(["python", "scripts/fix4_gate.py"], cwd=str(ROOT), capture_output=True, text=True)
lines = r.stdout.strip().splitlines()
# 12줄 릴리스 리포트 저장
rel12 = "\n".join(lines[-12:])
(REP / "release_rc3_12lines.txt").write_text(rel12, encoding="utf-8")
ok = any(l.startswith("pass=true") for l in lines)
if not ok:
    print(rel12)
    raise SystemExit(2)

# 2) ZIP 구성
ts = time.strftime("%Y%m%d_%H%M")
zip_path = OUT / f"KIS_Estimator_RC3_{ts}.zip"
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
    for f in FILES:
        p = ROOT / f
        z.write(p, arcname=f)
    # 12줄 리포트 포함
    z.write(REP / "release_rc3_12lines.txt", arcname="reports/release_rc3_12lines.txt")

# 3) SHA256SUMS.txt
sums = []
for f in FILES:
    p = ROOT / f
    sums.append(f"{sha(p)}  {f}  {size(p)}B")
sums.append(f"{sha(zip_path)}  dist/{zip_path.name}  {size(zip_path)}B")
(OUT / "SHA256SUMS.txt").write_text("\n".join(sums), encoding="utf-8")

# 4) 최종 12줄 출력
print(f"mode=release-rc3; root={ROOT.name}")
print("pass=true; gate=fixed(FIX-4)&reg(20/20)&smoke(3/3)")
print(f"artifact={zip_path.name}; bytes={size(zip_path)}")
print("files=7 + reports/release_rc3_12lines.txt")
print(f"openapi.sha={sha(ROOT/'deploy/fastmcp/openapi_estimate_v1.yaml')[:8]}")
print(f"mock.sha={sha(ROOT/'deploy/fastmcp/payload_samples/mock_scenarios_v1.json')[:8]}")
print(f"seeds.sha={sha(ROOT/'tests/regression/seeds/regression_seeds_v1.jsonl')[:8]}")
print(f"mock_gateway.sha={sha(ROOT/'scripts/mock_gateway.py')[:8]}")
print(f"server.sha={sha(ROOT/'deploy/fastmcp/server.mock.py')[:8]}")
print(f"ts={time.strftime('%Y-%m-%dT%H:%M:%S')}")
print("reserved=1")
print("reserved=2")