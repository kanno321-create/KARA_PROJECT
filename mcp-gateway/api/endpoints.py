"""
API endpoints for MCP Gateway with proper authentication
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, Optional
import logging
from .schemas import EstimateRequest, EstimateResponse, ValidateRequest, ValidateResponse
from .auth import get_auth_context, require_auth, require_scope
from .utils import utc_iso, generate_trace_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/v1")

@router.get("/health")
async def health_check():
    """Public health check endpoint (no auth required)"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": utc_iso(),
        "service": "mcp-gateway",
        "auth": "not_required"
    }

@router.post("/estimate", response_model=EstimateResponse)
async def create_estimate(
    request: EstimateRequest,
    auth: Dict = Depends(require_scope("estimate.write"))
) -> EstimateResponse:
    """Protected estimate endpoint - requires estimate.write scope"""
    trace_id = generate_trace_id()
    logger.info(f"[{trace_id}] Processing estimate request from {auth.get('type')} auth")

    try:
        # Process estimate logic here
        result = {
            "estimate_id": generate_trace_id(),
            "status": "completed",
            "items": request.items,
            "total": sum(item.get("quantity", 0) * item.get("unit_price", 0) for item in request.items),
            "created_at": utc_iso(),
            "created_by": auth.get("user_id", "internal"),
            "trace_id": trace_id
        }

        return EstimateResponse(**result)

    except Exception as e:
        logger.error(f"[{trace_id}] Error processing estimate: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/validate", response_model=ValidateResponse)
async def validate_data(
    request: ValidateRequest,
    auth: Dict = Depends(require_scope("validate.run"))
) -> ValidateResponse:
    """Protected validate endpoint - requires validate.run scope"""
    trace_id = generate_trace_id()
    logger.info(f"[{trace_id}] Processing validation request from {auth.get('type')} auth")

    try:
        # Validation logic here
        validations = []
        is_valid = True

        # Example validation rules
        if request.data_type == "estimate":
            if not request.data.get("items"):
                validations.append({"field": "items", "error": "Items list is required"})
                is_valid = False

            total = request.data.get("total", 0)
            if total <= 0:
                validations.append({"field": "total", "error": "Total must be positive"})
                is_valid = False

        result = {
            "validation_id": generate_trace_id(),
            "is_valid": is_valid,
            "validations": validations,
            "data_type": request.data_type,
            "validated_at": utc_iso(),
            "validated_by": auth.get("user_id", "internal"),
            "trace_id": trace_id
        }

        return ValidateResponse(**result)

    except Exception as e:
        logger.error(f"[{trace_id}] Error processing validation: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/estimate/{estimate_id}")
async def get_estimate(
    estimate_id: str,
    auth: Dict = Depends(require_scope("estimate.read"))
) -> Dict:
    """Get estimate by ID - requires estimate.read scope"""
    trace_id = generate_trace_id()
    logger.info(f"[{trace_id}] Fetching estimate {estimate_id}")

    # Placeholder - would fetch from database
    return {
        "estimate_id": estimate_id,
        "status": "retrieved",
        "timestamp": utc_iso(),
        "trace_id": trace_id
    }

@router.get("/admin/operations")
async def admin_operations(
    auth: Dict = Depends(require_scope("admin.ops"))
) -> Dict:
    """Admin operations endpoint - requires admin.ops scope"""
    trace_id = generate_trace_id()
    logger.info(f"[{trace_id}] Admin operations accessed by {auth.get('user_id')}")

    return {
        "operations": ["health_check", "clear_cache", "reload_config"],
        "status": "available",
        "timestamp": utc_iso(),
        "trace_id": trace_id
    }