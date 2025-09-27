from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ..utils.time import ensure_utc
from ..logging.live_jsonl import LiveJsonlSink

# Main router with /v1 prefix (for consistency with other APIs)
router = APIRouter(prefix="/v1", tags=["orders"])

# Additional router without prefix (for direct access)
router_direct = APIRouter(tags=["orders-direct"])

# Create orders directory
ORDERS_DIR = Path("./orders")
ORDERS_DIR.mkdir(exist_ok=True)

# Create logs directory and event logger
LOGS_DIR = Path("./logs")
LOGS_DIR.mkdir(exist_ok=True)
event_logger = LiveJsonlSink(LOGS_DIR / "events.log")


async def log_event(event_data: dict) -> None:
    """Log event to events.log file."""
    await event_logger.write(event_data)


class OrderCreateRequest(BaseModel):
    target: str  # "gpt5_codex" or "claude_code"
    title: str
    order: str
    accept_criteria: str
    attachments: Optional[list[str]] = None


class OrderCreateResponse(BaseModel):
    ok: bool
    job_id: str


class OrderSummary(BaseModel):
    job_id: str
    title: str
    order: str


class OrderListResponse(BaseModel):
    ok: bool
    jobs: list[OrderSummary]


class OrderDetailResponse(BaseModel):
    job_id: str
    target: str
    title: str
    order: str
    accept_criteria: str
    attachments: Optional[list[str]]
    timestamp: str


@router.post("/orders", response_model=OrderCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_order(payload: OrderCreateRequest) -> OrderCreateResponse:
    """Create a new order and save to file system."""
    try:
        # Generate job_id with target prefix and UTC timestamp
        timestamp = datetime.utcnow().isoformat()
        job_id = f"{payload.target}_{timestamp}Z"

        # Create order data with timestamp
        order_data = {
            "job_id": job_id,
            "target": payload.target,
            "title": payload.title,
            "order": payload.order,
            "accept_criteria": payload.accept_criteria,
            "attachments": payload.attachments or [],
            "timestamp": ensure_utc(datetime.utcnow()).isoformat().replace("+00:00", "Z"),
        }

        # Save to file (use safe filename with timestamp replacement)
        safe_filename = job_id.replace(":", "-").replace(".", "-")
        order_file = ORDERS_DIR / f"{safe_filename}.json"
        with open(order_file, "w", encoding="utf-8") as f:
            json.dump(order_data, f, ensure_ascii=False, indent=2)

        # Log event
        await log_event({
            "type": "order_created",
            "job_id": job_id,
            "target": payload.target,
            "title": payload.title,
            "timestamp": order_data["timestamp"]
        })

        return OrderCreateResponse(ok=True, job_id=job_id)

    except Exception as e:
        trace_id = str(uuid.uuid4())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "order_creation_failed",
                    "message": f"Failed to create order: {str(e)}",
                    "traceId": trace_id,
                }
            }
        )


@router.get("/get_orders_for/{role}", response_model=OrderListResponse)
async def get_orders_for_role(role: str) -> OrderListResponse:
    """Get all orders for a specific role/target."""
    try:
        jobs = []

        # Scan orders directory for matching target
        for order_file in ORDERS_DIR.glob("*.json"):
            try:
                with open(order_file, "r", encoding="utf-8") as f:
                    order_data = json.load(f)

                if order_data.get("target") == role:
                    jobs.append(OrderSummary(
                        job_id=order_data["job_id"],
                        title=order_data["title"],
                        order=order_data["order"][:100] + "..." if len(order_data["order"]) > 100 else order_data["order"]
                    ))
            except (json.JSONDecodeError, KeyError):
                # Skip corrupted files
                continue

        # Log event
        await log_event({
            "type": "order_fetched",
            "role": role,
            "count": len(jobs),
            "timestamp": ensure_utc(datetime.utcnow()).isoformat().replace("+00:00", "Z")
        })

        return OrderListResponse(ok=True, jobs=jobs)

    except Exception as e:
        trace_id = str(uuid.uuid4())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "order_fetch_failed",
                    "message": f"Failed to fetch orders: {str(e)}",
                    "traceId": trace_id,
                }
            }
        )


@router.get("/get_order_detail/{job_id}", response_model=OrderDetailResponse)
async def get_order_detail(job_id: str) -> OrderDetailResponse:
    """Get detailed information for a specific order."""
    try:
        # Convert job_id to safe filename format
        safe_filename = job_id.replace(":", "-").replace(".", "-")
        order_file = ORDERS_DIR / f"{safe_filename}.json"

        if not order_file.exists():
            trace_id = str(uuid.uuid4())
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": {
                        "code": "order_not_found",
                        "message": f"Order with job_id '{job_id}' not found",
                        "traceId": trace_id,
                    }
                }
            )

        with open(order_file, "r", encoding="utf-8") as f:
            order_data = json.load(f)

        return OrderDetailResponse(
            job_id=order_data["job_id"],
            target=order_data["target"],
            title=order_data["title"],
            order=order_data["order"],
            accept_criteria=order_data["accept_criteria"],
            attachments=order_data.get("attachments"),
            timestamp=order_data["timestamp"]
        )

    except HTTPException:
        raise
    except json.JSONDecodeError:
        trace_id = str(uuid.uuid4())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "order_corrupted",
                    "message": f"Order file for job_id '{job_id}' is corrupted",
                    "traceId": trace_id,
                }
            }
        )
    except Exception as e:
        trace_id = str(uuid.uuid4())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "order_detail_failed",
                    "message": f"Failed to get order detail: {str(e)}",
                    "traceId": trace_id,
                }
            }
        )


# ==== Direct access routes (without /v1 prefix) ====

@router_direct.post("/orders", response_model=OrderCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_order_direct(payload: OrderCreateRequest) -> OrderCreateResponse:
    """Create a new order and save to file system (direct access)."""
    return await create_order(payload)


@router_direct.get("/get_orders_for/{role}", response_model=OrderListResponse)
async def get_orders_for_role_direct(role: str) -> OrderListResponse:
    """Get all orders for a specific role/target (direct access)."""
    return await get_orders_for_role(role)


@router_direct.get("/get_order_detail/{job_id}", response_model=OrderDetailResponse)
async def get_order_detail_direct(job_id: str) -> OrderDetailResponse:
    """Get detailed information for a specific order (direct access)."""
    return await get_order_detail(job_id)