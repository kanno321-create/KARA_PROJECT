"""
Test JSON-RPC ping endpoint
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from api.main import app

client = TestClient(app)

def test_json_rpc_ping():
    """Test JSON-RPC ping method returns pong"""
    request_data = {
        "jsonrpc": "2.0",
        "method": "ping",
        "params": {},
        "id": "test-1"
    }

    response = client.post("/mcp/gateway", json=request_data)

    assert response.status_code == 200

    data = response.json()
    assert data["jsonrpc"] == "2.0"
    assert data["id"] == "test-1"
    assert "result" in data
    assert data["result"]["message"] == "pong"
    assert "timestamp" in data["result"]

def test_json_rpc_method_not_found():
    """Test JSON-RPC with unknown method returns error"""
    request_data = {
        "jsonrpc": "2.0",
        "method": "unknown_method",
        "params": {},
        "id": "test-2"
    }

    response = client.post("/mcp/gateway", json=request_data)

    assert response.status_code == 200  # JSON-RPC errors still return 200

    data = response.json()
    assert data["jsonrpc"] == "2.0"
    assert data["id"] == "test-2"
    assert "error" in data
    assert data["error"]["code"] == -32601
    assert data["error"]["message"] == "Method not found"

def test_json_rpc_without_id():
    """Test JSON-RPC notification (no id) works"""
    request_data = {
        "jsonrpc": "2.0",
        "method": "ping",
        "params": {}
    }

    response = client.post("/mcp/gateway", json=request_data)

    assert response.status_code == 200

    data = response.json()
    assert data["jsonrpc"] == "2.0"
    assert data["id"] is None
    assert "result" in data
    assert data["result"]["message"] == "pong"