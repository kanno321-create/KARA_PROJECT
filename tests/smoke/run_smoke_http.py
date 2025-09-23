# tests/smoke/run_smoke_http.py
from __future__ import annotations
import json, time, subprocess, statistics, hashlib
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

ROOT = Path(__file__).resolve().parents[2]
SERVER = ROOT / "deploy" / "fastmcp" / "server.mock.py"
MOCK = ROOT / "deploy" / "fastmcp" / "payload_samples" / "mock_scenarios_v1.json"
OPENAPI = ROOT / "deploy" / "fastmcp" / "openapi_estimate_v1.yaml"

def sha(p:Path)->str:
    return hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else "-"*64

def http_get(url:str):
    req = Request(url, method="GET")
    with urlopen(req, timeout=5) as r:
        return r.getcode(), json.loads(r.read().decode("utf-8"))

def http_post(url:str, obj:dict):
    data = json.dumps(obj).encode("utf-8")
    req = Request(url, data=data, headers={"Content-Type":"application/json"})
    try:
        with urlopen(req, timeout=5) as r:
            return r.getcode(), json.loads(r.read().decode("utf-8"))
    except HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"raw": body}
    except URLError as e:
        return 0, {"error": str(e)}

def load_mock():
    obj = json.loads(MOCK.read_text(encoding="utf-8"))
    s = obj["scenarios"]
    # pick 3: 정상(200)/중복(409)/유효성(422)
    normal = next(x for x in s if x["name"].startswith("정상"))
    dup    = next(x for x in s if x["name"].startswith("중복"))
    inval  = next(x for x in s if x["name"].startswith("유효성"))
    return normal["request"], dup["request"], inval["request"]

def main():
    # 1) start server
    proc = subprocess.Popen(["python","-u",str(SERVER)], cwd=str(ROOT))
    try:
        # 2) wait health
        ok=False
        for _ in range(30):
            try:
                code, _ = http_get("http://127.0.0.1:8787/v1/health")
                if code==200: ok=True; break
            except Exception: pass
            time.sleep(0.2)
        t0 = time.time()
        latencies=[]
        passes=0; total=3
        if ok:
            # 3) load mock reqs
            normal, dup, inval = load_mock()
            # create(200)
            t=time.time(); c,r=http_post("http://127.0.0.1:8787/v1/estimate/create", normal); latencies.append(int((time.time()-t)*1000)); passes += 1 if c==200 else 0
            # duplicate(409)
            t=time.time(); c,r=http_post("http://127.0.0.1:8787/v1/estimate/create", dup);     latencies.append(int((time.time()-t)*1000)); passes += 1 if c==409 else 0
            # validate(422)
            t=time.time(); c,r=http_post("http://127.0.0.1:8787/v1/estimate/validate", inval);latencies.append(int((time.time()-t)*1000)); passes += 1 if c==422 else 0

        p95 = int(statistics.quantiles(latencies, n=20)[-1]) if len(latencies)>=2 else (latencies[0] if latencies else 0)
        err = round(100*(1 - passes/total), 1) if total else 0.0

        # 4) 12-Line Report
        print(f"mode=http-mock; root={ROOT.name}")
        print(f"pass={passes}/{total}; p95={p95}ms; err={err}%")
        print(f"health={'ok' if ok else 'fail'}; port=8787")
        print("files=3")
        print(f"server.mock.py:{SERVER.stat().st_size}B; sha={sha(SERVER)[:8]}")
        print(f"openapi:{OPENAPI.stat().st_size}B; sha={sha(OPENAPI)[:8]}")
        print(f"mock_scenarios:{MOCK.stat().st_size}B; sha={sha(MOCK)[:8]}")
        print("routes=/v1/health,/v1/estimate/create,/v1/estimate/validate,/v1/estimate/{id}/evidence")
        print(f"latencies_ms={latencies if latencies else []}")
        print(f"ts={time.strftime('%Y-%m-%dT%H:%M:%S')}")
        print("reserved=1")
        print("reserved=2")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    main()