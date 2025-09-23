#!/usr/bin/env python3
"""FastMCP Gateway - Lightweight HTTP server for FIX-4 pipeline"""
import json
import sys
import subprocess
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import time

class PipelineHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        
        if parsed.path == "/run":
            pipeline = params.get("pipeline", ["fix4"])[0]
            work = params.get("work", ["KIS/Work/current"])[0]
            
            if pipeline == "fix4":
                result = self.run_fix4(work)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())
            else:
                self.send_error(400, "Unknown pipeline")
        
        elif parsed.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy", "ts": int(time.time())}).encode())
        
        else:
            self.send_error(404, "Not Found")
    
    def run_fix4(self, work_dir):
        """Execute FIX-4 pipeline"""
        engines = [
            "enclosure_solver",
            "breaker_placer",
            "breaker_critic", 
            "estimate_formatter",
            "cover_tab_writer",
            "doc_lint_guard"
        ]
        
        results = {
            "pipeline": "fix4",
            "work": work_dir,
            "ts": int(time.time()),
            "engines": {},
            "success": True
        }
        
        for engine in engines:
            script = Path("engine") / f"{engine}.py"
            if not script.exists():
                results["engines"][engine] = {"status": "SKIP", "reason": "Not found"}
                continue
            
            try:
                cmd = [sys.executable, str(script), "--work", work_dir]
                if engine == "estimate_formatter":
                    cmd.extend(["--templates", "KIS/Templates"])
                
                start = time.time()
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                elapsed_ms = int((time.time() - start) * 1000)
                
                if result.returncode == 0:
                    results["engines"][engine] = {
                        "status": "OK",
                        "ms": elapsed_ms,
                        "output": result.stdout[:200]
                    }
                else:
                    results["engines"][engine] = {
                        "status": "FAIL",
                        "ms": elapsed_ms,
                        "error": result.stderr[:200]
                    }
                    results["success"] = False
                    
            except Exception as e:
                results["engines"][engine] = {"status": "ERROR", "error": str(e)}
                results["success"] = False
        
        # Add summary
        results["summary"] = {
            "total": len(engines),
            "ok": sum(1 for r in results["engines"].values() if r.get("status") == "OK"),
            "failed": sum(1 for r in results["engines"].values() if r.get("status") in ["FAIL", "ERROR"]),
            "total_ms": sum(r.get("ms", 0) for r in results["engines"].values())
        }
        
        return results
    
    def log_message(self, format, *args):
        # Suppress default logging
        pass

def selftest():
    """Run self-test"""
    print("Running FastMCP Gateway self-test...")
    
    # Test pipeline execution
    from pathlib import Path
    Path("KIS/Work/selftest").mkdir(parents=True, exist_ok=True)
    
    # Create a mock handler instance without socket
    class MockHandler:
        def run_fix4(self, work_dir):
            return PipelineHandler.run_fix4(None, work_dir)
    
    handler = MockHandler()
    result = handler.run_fix4("KIS/Work/selftest")
    
    print(f"Pipeline executed: {result['summary']['ok']}/{result['summary']['total']} OK")
    print(f"Total time: {result['summary']['total_ms']}ms")
    
    if result["success"]:
        print("SELFTEST PASS")
        return 0
    else:
        print("SELFTEST FAIL")
        return 1

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8090)
    parser.add_argument("--selftest", action="store_true")
    args = parser.parse_args()
    
    if args.selftest:
        sys.exit(selftest())
    
    server = HTTPServer(("", args.port), PipelineHandler)
    print(f"FastMCP Gateway running on port {args.port}")
    print(f"Test: http://localhost:{args.port}/run?pipeline=fix4&work=KIS/Work/current")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()

if __name__ == "__main__":
    main()