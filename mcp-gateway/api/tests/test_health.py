"""
Test health endpoint
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from api.main import app

client = TestClient(app)

def test_health_endpoint():
    """Test that health endpoint returns 200 and expected structure"""
    response = client.get("/health")

    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "1.0.0"
    assert data["service"] == "mcp-gateway"
    assert "timestamp" in data
    assert "environment" in data

def test_health_content_type():
    """Test that health endpoint returns JSON"""
    response = client.get("/health")

    assert "application/json" in response.headers["content-type"]