# deploy/fastmcp/server.mock.py
# KIS 견적 AI — HTTP Mock Server (stdlib only)
from __future__ import annotations
import json, re, time
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(ROOT / "scripts"))
from mock_gateway import estimate_create, estimate_validate, evidence_get  # type: ignore

class Handler(BaseHTTPRequestHandler):
    server_version = "KISMock/1.0"

    def _set(self, code=200, ctype="application/json"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-store")
        self.end_headers()

    def do_GET(self):
        if self.path == "/v1/health":
            self._set(200)
            self.wfile.write(json.dumps({"ok": True, "ts": time.strftime("%Y-%m-%dT%H:%M:%S")}).encode("utf-8"))
            return
        m = re.fullmatch(r"/v1/estimate/([^/]+)/evidence", self.path)
        if m:
            rid = m.group(1)
            resp = evidence_get(rid)
            self._set(resp.get("status", 200))
            self.wfile.write(json.dumps(resp, ensure_ascii=False).encode("utf-8"))
            return
        self._set(404)
        self.wfile.write(b'{"code":"NOT_FOUND","message":"unknown path"}')

    def _read_json(self):
        try:
            ln = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(ln) if ln>0 else b"{}"
            return json.loads(raw.decode("utf-8") or "{}")
        except Exception:
            return {}

    def do_POST(self):
        if self.path == "/v1/estimate/create":
            req = self._read_json()
            resp = estimate_create(req)
            self._set(resp.get("status", 200))
            self.wfile.write(json.dumps(resp, ensure_ascii=False).encode("utf-8"))
            return
        if self.path == "/v1/estimate/validate":
            req = self._read_json()
            resp = estimate_validate(req)
            self._set(resp.get("status", 200))
            self.wfile.write(json.dumps(resp, ensure_ascii=False).encode("utf-8"))
            return
        self._set(404)
        self.wfile.write(b'{"code":"NOT_FOUND","message":"unknown path"}')

def main(host="127.0.0.1", port=8787):
    httpd = ThreadingHTTPServer((host, port), Handler)
    print(f"listening http://{host}:{port}/v1/health", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()