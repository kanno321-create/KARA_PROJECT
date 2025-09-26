"""
Authentication and authorization module for MCP Gateway
Supports JWT (external) and HMAC (internal) authentication
"""
import hashlib
import hmac
import base64
import jwt
import os
from datetime import datetime, timezone
from typing import Dict, Optional, Set
from fastapi import HTTPException, Request, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "kis-mcp-dev-secret-change-in-production")
HMAC_SECRET = os.getenv("HMAC_SECRET", "kis-hmac-dev-secret-change-in-production")
JWT_ISSUER = os.getenv("JWT_ISSUER", "kis.company.com")
JWT_AUDIENCE = "kis-mcp"
CLOCK_SKEW_SECONDS = 60
NONCE_CACHE_TTL = 300  # 5 minutes

# In-memory nonce cache for replay protection
nonce_cache: Set[str] = set()
nonce_timestamps: Dict[str, datetime] = {}

# Security scheme
security = HTTPBearer(auto_error=False)

def verify_jwt_token(credentials: HTTPAuthorizationCredentials) -> Dict:
    """Verify JWT token for external clients"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authentication")

    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=["HS256"],
            audience=JWT_AUDIENCE,
            issuer=JWT_ISSUER
        )
        return {"type": "external", "user_id": payload.get("sub"), "scopes": payload.get("scopes", [])}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def verify_hmac_signature(
    signature: str,
    timestamp: str,
    body: bytes
) -> bool:
    """Verify HMAC signature for internal agents"""
    # Check timestamp
    try:
        req_timestamp = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        time_diff = abs((now - req_timestamp).total_seconds())

        if time_diff > CLOCK_SKEW_SECONDS:
            return False
    except (ValueError, TypeError):
        return False

    # Check nonce
    nonce = f"{signature}:{timestamp}"
    if nonce in nonce_cache:
        return False  # Replay attack

    # Verify signature
    message = body + timestamp.encode()
    expected_signature = base64.b64encode(
        hmac.new(HMAC_SECRET.encode(), message, hashlib.sha256).digest()
    ).decode()

    if hmac.compare_digest(signature, expected_signature):
        # Add to nonce cache
        nonce_cache.add(nonce)
        nonce_timestamps[nonce] = datetime.now(timezone.utc)

        # Clean old nonces
        clean_old_nonces()
        return True

    return False

def clean_old_nonces():
    """Remove expired nonces from cache"""
    now = datetime.now(timezone.utc)
    expired = [
        nonce for nonce, ts in nonce_timestamps.items()
        if (now - ts).total_seconds() > NONCE_CACHE_TTL
    ]
    for nonce in expired:
        nonce_cache.discard(nonce)
        del nonce_timestamps[nonce]

async def get_auth_context(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_kis_signature: Optional[str] = Header(None),
    x_kis_timestamp: Optional[str] = Header(None)
) -> Optional[Dict]:
    """Get authentication context from request"""
    # Check JWT (external)
    if credentials and credentials.scheme == "Bearer":
        return verify_jwt_token(credentials)

    # Check HMAC (internal)
    if x_kis_signature and x_kis_timestamp:
        body = await request.body()
        if verify_hmac_signature(x_kis_signature, x_kis_timestamp, body):
            return {"type": "internal", "authenticated": True}

    return None

def require_auth(auth_context: Optional[Dict] = Depends(get_auth_context)) -> Dict:
    """Require authentication for protected endpoints"""
    if not auth_context:
        raise HTTPException(status_code=401, detail="Authentication required")
    return auth_context

def check_scope(required_scope: str, auth_context: Dict) -> bool:
    """Check if auth context has required scope"""
    if auth_context.get("type") == "internal":
        return True  # Internal agents have all scopes

    scopes = auth_context.get("scopes", [])
    return required_scope in scopes

def require_scope(scope: str):
    """Decorator to require specific scope"""
    def dependency(auth_context: Dict = Depends(require_auth)):
        if not check_scope(scope, auth_context):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return auth_context
    return dependency