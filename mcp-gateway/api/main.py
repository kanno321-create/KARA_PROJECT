"""
MCP Gateway - FastAPI Application
JSON-RPC 2.0 + WebSocket Support for KARA orchestration
With JWT/HMAC authentication
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, Optional
import asyncio
import json
import logging
from datetime import datetime, timezone
from .schemas import JobRequest, JobResult, JSONRPCRequest, JSONRPCResponse
from .orchestrator import Orchestrator
from .utils import utc_iso, generate_trace_id
from .auth import get_auth_context, require_auth
from .endpoints import router as v1_router
from .security import security_middleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="MCP Gateway",
    version="1.0.0",
    description="Model Context Protocol Gateway for KIS orchestration"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://kis.company.com", "https://mcp.kis.company.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Add security middleware
app.middleware("http")(security_middleware)

# Initialize orchestrator
orchestrator = Orchestrator()

# Include v1 endpoints with authentication
app.include_router(v1_router)

@app.get("/health")
async def health_check():
    """Public health check endpoint (no auth required)"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": utc_iso(),
        "service": "mcp-gateway",
        "auth": "not_required"
    }

@app.post("/mcp/gateway")
async def json_rpc_gateway(
    request: JSONRPCRequest,
    auth: Optional[Dict] = Depends(get_auth_context)
) -> JSONRPCResponse:
    """JSON-RPC 2.0 gateway endpoint"""
    trace_id = generate_trace_id()
    logger.info(f"[{trace_id}] Received JSON-RPC request: {request.method}")

    try:
        if request.method == "ping":
            # Simple ping-pong response
            result = {"message": "pong", "timestamp": utc_iso()}

        elif request.method == "orchestrate.run":
            # Run orchestration job
            job_request = JobRequest(**request.params)
            result = await orchestrator.execute(job_request, trace_id)

        elif request.method == "gate.evaluate":
            # Evaluate gate conditions
            result = await orchestrator.evaluate_gates(request.params, trace_id)

        elif request.method == "report.handoff":
            # Generate handoff report
            result = await orchestrator.generate_handoff(request.params, trace_id)

        else:
            # Method not found
            return JSONRPCResponse(
                jsonrpc="2.0",
                id=request.id,
                error={
                    "code": -32601,
                    "message": "Method not found",
                    "data": {"method": request.method}
                }
            )

        return JSONRPCResponse(
            jsonrpc="2.0",
            id=request.id,
            result=result
        )

    except Exception as e:
        logger.error(f"[{trace_id}] Error processing request: {str(e)}")
        return JSONRPCResponse(
            jsonrpc="2.0",
            id=request.id,
            error={
                "code": -32603,
                "message": "Internal error",
                "data": {"trace_id": trace_id, "error": str(e)}
            }
        )

@app.websocket("/mcp/gateway/stream")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for streaming operations"""
    await websocket.accept()
    trace_id = generate_trace_id()
    logger.info(f"[{trace_id}] WebSocket connection established")

    heartbeat_task = None
    try:
        # Start heartbeat task
        heartbeat_task = asyncio.create_task(send_heartbeat(websocket))

        while True:
            # Receive message
            data = await websocket.receive_text()
            message = json.loads(data)

            # Process message
            if message.get("type") == "ping":
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": utc_iso()
                })

            elif message.get("type") == "subscribe":
                # Handle subscription to events
                await websocket.send_json({
                    "type": "subscribed",
                    "channel": message.get("channel"),
                    "timestamp": utc_iso()
                })

            elif message.get("type") == "job":
                # Stream job progress
                job_request = JobRequest(**message.get("payload", {}))
                async for event in orchestrator.stream_execute(job_request, trace_id):
                    await websocket.send_json({
                        "type": "event",
                        "data": event,
                        "timestamp": utc_iso()
                    })

    except WebSocketDisconnect:
        logger.info(f"[{trace_id}] WebSocket disconnected")
    except Exception as e:
        logger.error(f"[{trace_id}] WebSocket error: {str(e)}")
        await websocket.close(code=1011, reason=str(e))
    finally:
        if heartbeat_task:
            heartbeat_task.cancel()

async def send_heartbeat(websocket: WebSocket):
    """Send periodic heartbeat to keep connection alive"""
    while True:
        try:
            await asyncio.sleep(20)  # 20 seconds interval
            await websocket.send_json({
                "type": "heartbeat",
                "timestamp": utc_iso()
            })
            logger.debug("Heartbeat sent")
        except Exception:
            break

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("MCP Gateway starting up...")
    await orchestrator.initialize()
    logger.info("MCP Gateway ready")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("MCP Gateway shutting down...")
    await orchestrator.cleanup()
    logger.info("MCP Gateway shutdown complete")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)