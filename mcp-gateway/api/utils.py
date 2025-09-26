"""
MCP Gateway Utilities
Helper functions for common operations
"""
import hashlib
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

def utc_iso() -> str:
    """Get current UTC timestamp in ISO format"""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def generate_trace_id() -> str:
    """Generate unique trace ID for request tracking"""
    return f"mcp_{uuid.uuid4().hex[:12]}_{int(datetime.now(timezone.utc).timestamp())}"

async def sha256sum_file(filepath: str) -> str:
    """Calculate SHA256 hash of a file"""
    sha256_hash = hashlib.sha256()
    try:
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    except Exception as e:
        return f"error:{str(e)}"

async def write_artifact_local(filename: str, content: str, append: bool = False) -> Optional[str]:
    """Write artifact to local filesystem"""
    try:
        # Create artifacts directory if not exists
        artifacts_dir = Path("dist/test_artifacts/verify")
        artifacts_dir.mkdir(parents=True, exist_ok=True)

        # Build full path
        filepath = artifacts_dir / filename

        # Write content
        mode = "a" if append else "w"
        with open(filepath, mode, encoding="utf-8") as f:
            f.write(content)

        return str(filepath)

    except Exception as e:
        print(f"Error writing artifact: {str(e)}")
        return None

async def update_sha256sums(directory: str = ".") -> None:
    """Update SHA256SUMS.txt file with all artifact hashes"""
    try:
        sha256_file = Path(directory) / "SHA256SUMS.txt"
        artifacts_dir = Path(directory) / "dist" / "test_artifacts"

        if not artifacts_dir.exists():
            return

        hashes = []

        # Walk through all artifacts
        for root, _, files in os.walk(artifacts_dir):
            for file in files:
                if file != "SHA256SUMS.txt":
                    filepath = Path(root) / file
                    file_hash = await sha256sum_file(str(filepath))
                    relative_path = filepath.relative_to(Path(directory))
                    hashes.append(f"{file_hash}  {relative_path.as_posix()}")

        # Write SHA256SUMS.txt
        if hashes:
            with open(sha256_file, "w", encoding="utf-8") as f:
                f.write("\n".join(sorted(hashes)) + "\n")

    except Exception as e:
        print(f"Error updating SHA256SUMS: {str(e)}")

def validate_json_rpc(data: dict) -> bool:
    """Validate JSON-RPC 2.0 request format"""
    return (
        data.get("jsonrpc") == "2.0" and
        "method" in data and
        isinstance(data.get("method"), str)
    )

def format_error_response(code: int, message: str, data: Optional[dict] = None) -> dict:
    """Format JSON-RPC error response"""
    error = {
        "code": code,
        "message": message
    }
    if data:
        error["data"] = data
    return error

def parse_gate_expression(expression: str, context: dict) -> float:
    """Parse and evaluate gate expression (simplified)"""
    # This is a stub - in production, use a proper expression evaluator
    # For now, return a sample value
    return 0.95

def get_artifact_type(filename: str) -> str:
    """Determine artifact type from filename"""
    ext = Path(filename).suffix.lower()
    type_map = {
        ".json": "json",
        ".jsonl": "jsonl",
        ".csv": "csv",
        ".log": "log",
        ".txt": "text",
        ".svg": "svg",
        ".png": "png",
        ".pdf": "pdf",
        ".html": "html"
    }
    return type_map.get(ext, "unknown")