# scripts/fix4_gate.py
from __future__ import annotations
import subprocess, json, re, hashlib, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PY = "python"

REG = ROOT / "tests" / "regression" / "run_regression.py"
SMK = ROOT / "tests" / "smoke" / "run_smoke_http.py"
OPENAPI = ROOT / "deploy" / "fastmcp" / "openapi_estimate_v1.yaml"
MOCK = ROOT / "deploy" / "fastmcp" / "payload_samples" / "mock_scenarios_v1.json"
SEEDS_V1 = ROOT / "tests" / "regression" / "seeds" / "regression_seeds_v1.jsonl"
SEEDS_V2 = ROOT / "tests" / "regression" / "seeds" / "regression_seeds_v2.jsonl"

def sha(p:Path)->str:
    return hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else "-"*64

def run(cmd:list[str])->tuple[int,str]:
    p = subprocess.Popen(cmd, cwd=str(ROOT), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    out,_ = p.communicate()
    return p.returncode, out

def parse_12_lines(txt:str)->dict:
    # 기대 포맷에서 핵심값만 추출
    data = {}
    for line in txt.strip().splitlines():
        if line.startswith("pass="):
            data["pass_line"] = line.strip()
            m = re.search(r"pass=(\d+)\/(\d+); p95=(\d+)ms; err=([\d\.]+)%", line)
            if m:
                data["pass_ok"], data["pass_total"], data["p95"], data["err"] = m.groups()
        elif line.startswith("files="): data["files"] = line.strip()
        elif line.startswith("ts="): data["ts"] = line.strip().split("=",1)[1]
        elif line.startswith("health="): data["health"] = line.strip().split(";")[0].split("=")[1]
        elif line.startswith("mock_scenarios_ok="): data["mock_ok"] = line.split(";")[0].split("=")[1]
    data["raw"] = txt
    return data

def main():
    # 1) OpenAPI/목업/시드 기본 검증
    openapi_ok = OPENAPI.exists() and "openapi: 3.1.0" in OPENAPI.read_text(encoding="utf-8", errors="ignore")
    mock_ok = MOCK.exists()
    # Use V2 seeds if exists, otherwise V1
    SEEDS = SEEDS_V2 if SEEDS_V2.exists() else SEEDS_V1
    seeds_ok = SEEDS.exists()
    expected_total = 40 if SEEDS == SEEDS_V2 else 20

    # 2) 회귀 테스트
    rc_reg, out_reg = run([PY, str(REG)])
    reg = parse_12_lines(out_reg)
    reg_pass = reg.get("pass_ok") and reg.get("pass_total") and int(reg["pass_ok"])==int(reg["pass_total"])==expected_total

    # 3) HTTP 스모크 3/3
    rc_smk, out_smk = run([PY, str(SMK)])
    smk = parse_12_lines(out_smk)
    smk_pass = smk.get("pass_line") and "pass=3/3" in smk["pass_line"]

    # 4) 최종 Gate 판단
    gate_ok = bool(openapi_ok and mock_ok and seeds_ok and reg_pass and smk_pass)

    # 5) 12-Line Gate Report
    print(f"mode=fix4-gate; root={ROOT.name}")
    print(f"pass={'true' if gate_ok else 'false'}; criteria=reg({expected_total}/{expected_total})&smoke(3/3)&openapi(3.1.0)")
    print(f"reg:{reg.get('pass_line','na')}")
    print(f"smoke:{smk.get('pass_line','na')}")
    print(f"openapi={'ok' if openapi_ok else 'fail'}; mock={'ok' if mock_ok else 'fail'}; seeds={'ok' if seeds_ok else 'fail'}")
    print(f"openapi.sha={sha(OPENAPI)[:8]}; mock.sha={sha(MOCK)[:8]}; seeds.sha={sha(SEEDS)[:8]}")
    print(f"reg.p95={reg.get('p95','-')}ms; reg.err={reg.get('err','-')}%")
    print(f"smk.health={smk.get('health','-')}; smk.p95={smk.get('p95','-')}ms; smk.err={smk.get('err','-')}%")
    print(f"ts={time.strftime('%Y-%m-%dT%H:%M:%S')}")
    print("reserved=1")
    print("reserved=2")
    print("reserved=3")

if __name__ == "__main__":
    main()