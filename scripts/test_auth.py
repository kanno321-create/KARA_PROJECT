"""
Test authentication for MCP Gateway
"""
import requests
import jwt
import hmac
import hashlib
import base64
import json
from datetime import datetime, timezone, timedelta

# Configuration
BASE_URL = "https://kis-mcp-gateway-pg466g6bi-wonis-projects-34586955.vercel.app"
JWT_SECRET = "kis-mcp-dev-secret-change-in-production"
HMAC_SECRET = "kis-hmac-dev-secret-change-in-production"
JWT_ISSUER = "kis.company.com"
JWT_AUDIENCE = "kis-mcp"

def test_health_public():
    """Test public health endpoint"""
    print("\n=== Testing Public Health Endpoint ===")

    # Test root health
    response = requests.get(f"{BASE_URL}/health")
    print(f"GET /health: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {response.json()}")
    else:
        print(f"Error: {response.text[:200]}")

    # Test v1 health
    response = requests.get(f"{BASE_URL}/v1/health")
    print(f"GET /v1/health: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {response.json()}")

def test_jwt_auth():
    """Test JWT authentication for external clients"""
    print("\n=== Testing JWT Authentication ===")

    # Generate valid JWT
    payload = {
        "sub": "user123",
        "aud": JWT_AUDIENCE,
        "iss": JWT_ISSUER,
        "scopes": ["estimate.read", "estimate.write", "validate.run"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "iat": datetime.now(timezone.utc)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Test protected endpoint
    estimate_data = {
        "items": [
            {"description": "Item 1", "quantity": 2, "unit_price": 100},
            {"description": "Item 2", "quantity": 3, "unit_price": 50}
        ],
        "customer_id": "CUST001",
        "project_name": "Test Project"
    }

    response = requests.post(
        f"{BASE_URL}/v1/estimate",
        headers=headers,
        json=estimate_data
    )
    print(f"POST /v1/estimate with JWT: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Error: {response.text[:200]}")

def test_hmac_auth():
    """Test HMAC authentication for internal agents"""
    print("\n=== Testing HMAC Authentication ===")

    timestamp = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')

    # Create request body
    validate_data = {
        "data_type": "estimate",
        "data": {
            "items": [{"description": "Test", "quantity": 1, "unit_price": 100}],
            "total": 100
        }
    }
    body = json.dumps(validate_data, separators=(',', ':')).encode()

    # Generate HMAC signature
    message = body + timestamp.encode()
    signature = base64.b64encode(
        hmac.new(HMAC_SECRET.encode(), message, hashlib.sha256).digest()
    ).decode()

    headers = {
        "X-KIS-Signature": signature,
        "X-KIS-Timestamp": timestamp,
        "Content-Type": "application/json"
    }

    response = requests.post(
        f"{BASE_URL}/v1/validate",
        headers=headers,
        data=body
    )
    print(f"POST /v1/validate with HMAC: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Error: {response.text[:200]}")

def test_no_auth():
    """Test protected endpoints without authentication"""
    print("\n=== Testing Protected Endpoints Without Auth ===")

    response = requests.get(f"{BASE_URL}/v1/estimate/EST001")
    print(f"GET /v1/estimate/EST001 without auth: {response.status_code}")
    print(f"Expected: 401 Unauthorized")

    response = requests.get(f"{BASE_URL}/v1/admin/operations")
    print(f"GET /v1/admin/operations without auth: {response.status_code}")
    print(f"Expected: 401 Unauthorized")

def test_expired_jwt():
    """Test expired JWT token"""
    print("\n=== Testing Expired JWT ===")

    # Generate expired JWT
    payload = {
        "sub": "user123",
        "aud": JWT_AUDIENCE,
        "iss": JWT_ISSUER,
        "scopes": ["estimate.read"],
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),  # Expired
        "iat": datetime.now(timezone.utc) - timedelta(hours=2)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

    headers = {"Authorization": f"Bearer {token}"}

    response = requests.get(f"{BASE_URL}/v1/estimate/EST001", headers=headers)
    print(f"GET with expired JWT: {response.status_code}")
    print(f"Expected: 401 Unauthorized (Token expired)")

def test_insufficient_scope():
    """Test JWT with insufficient scope"""
    print("\n=== Testing Insufficient Scope ===")

    # Generate JWT without admin scope
    payload = {
        "sub": "user123",
        "aud": JWT_AUDIENCE,
        "iss": JWT_ISSUER,
        "scopes": ["estimate.read"],  # No admin.ops scope
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "iat": datetime.now(timezone.utc)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

    headers = {"Authorization": f"Bearer {token}"}

    response = requests.get(f"{BASE_URL}/v1/admin/operations", headers=headers)
    print(f"GET /v1/admin/operations without admin scope: {response.status_code}")
    print(f"Expected: 403 Forbidden (Insufficient permissions)")

def main():
    """Run all authentication tests"""
    print("=" * 50)
    print("MCP Gateway Authentication Tests")
    print(f"Target: {BASE_URL}")
    print("=" * 50)

    try:
        test_health_public()
        test_no_auth()
        test_jwt_auth()
        test_hmac_auth()
        test_expired_jwt()
        test_insufficient_scope()

        print("\n" + "=" * 50)
        print("Authentication tests completed")
        print("=" * 50)

    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")

if __name__ == "__main__":
    main()