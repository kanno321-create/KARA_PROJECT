"""
Security middleware and utilities for MCP Gateway
"""
import os
import time
import ipaddress
from typing import Dict, Optional
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from collections import defaultdict
from datetime import datetime, timedelta

# Configuration
ALLOWED_ADMIN_IPS = os.getenv("ALLOWED_ADMIN_IPS", "127.0.0.1,::1").split(",")
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))

# Rate limiting store
rate_limit_store: Dict[str, list] = defaultdict(list)

def is_ip_allowed(ip: str, allowed_networks: list) -> bool:
    """Check if IP is in allowed networks"""
    try:
        client_ip = ipaddress.ip_address(ip)
        for network in allowed_networks:
            if "/" in network:
                # CIDR notation
                if client_ip in ipaddress.ip_network(network, strict=False):
                    return True
            else:
                # Single IP
                if client_ip == ipaddress.ip_address(network):
                    return True
    except ValueError:
        pass
    return False

def check_admin_access(request: Request) -> bool:
    """Check if request is allowed to access admin endpoints"""
    # Get client IP
    client_ip = request.client.host
    if request.headers.get("X-Forwarded-For"):
        client_ip = request.headers["X-Forwarded-For"].split(",")[0].strip()

    # Check IP allowlist
    return is_ip_allowed(client_ip, ALLOWED_ADMIN_IPS)

def check_rate_limit(request: Request) -> bool:
    """Check if request exceeds rate limit"""
    # Get client identifier
    client_ip = request.client.host
    if request.headers.get("X-Forwarded-For"):
        client_ip = request.headers["X-Forwarded-For"].split(",")[0].strip()

    now = time.time()
    minute_ago = now - 60

    # Clean old entries
    rate_limit_store[client_ip] = [
        timestamp for timestamp in rate_limit_store[client_ip]
        if timestamp > minute_ago
    ]

    # Check limit
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_PER_MINUTE:
        return False

    # Add current request
    rate_limit_store[client_ip].append(now)
    return True

async def security_middleware(request: Request, call_next):
    """Security middleware for all requests"""
    # Rate limiting
    if not check_rate_limit(request):
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded"},
            headers={"Retry-After": "60"}
        )

    # Admin endpoint protection
    if request.url.path.startswith("/v1/admin/"):
        if not check_admin_access(request):
            return JSONResponse(
                status_code=403,
                content={"detail": "Access denied"}
            )

    # Process request
    response = await call_next(request)

    # Add security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

    # Content Security Policy (Report-Only for now)
    csp = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self'; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self'"
    )
    response.headers["Content-Security-Policy-Report-Only"] = csp

    return response

def sanitize_error_message(error: Exception) -> str:
    """Sanitize error messages to prevent information leakage"""
    error_str = str(error)

    # Remove sensitive patterns
    sensitive_patterns = [
        r"password[=:]\S+",
        r"token[=:]\S+",
        r"key[=:]\S+",
        r"secret[=:]\S+",
        r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",  # Email
        r"\b(?:\d{1,3}\.){3}\d{1,3}\b",  # IP address
        r"\/home\/\S+",  # File paths
        r"C:\\[^\"]+",  # Windows paths
    ]

    import re
    for pattern in sensitive_patterns:
        error_str = re.sub(pattern, "***REDACTED***", error_str, flags=re.IGNORECASE)

    return error_str