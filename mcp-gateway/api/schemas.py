"""
MCP Gateway Schemas
Data models for request/response handling
"""
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from datetime import datetime

class JobRequest(BaseModel):
    """Request model for orchestration jobs"""
    job_id: str = Field(..., description="Unique job identifier")
    task_type: str = Field(..., description="Type of task to execute")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Task-specific payload")
    context: Dict[str, Any] = Field(default_factory=dict, description="Execution context")
    priority: int = Field(default=5, ge=1, le=10, description="Priority level (1-10)")
    timeout: Optional[int] = Field(default=300, description="Timeout in seconds")

class JobResult(BaseModel):
    """Result model for orchestration jobs"""
    job_id: str
    status: str  # READY, RUNNING, COMPLETED, FAILED
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    artifacts: List[str] = Field(default_factory=list)
    metrics: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str
    duration_ms: Optional[int] = None

class ArtifactRef(BaseModel):
    """Reference to generated artifacts"""
    artifact_id: str
    artifact_type: str  # json, csv, log, svg, png
    path: str
    size_bytes: int
    sha256: str
    created_at: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

class JSONRPCRequest(BaseModel):
    """JSON-RPC 2.0 Request"""
    jsonrpc: str = "2.0"
    method: str
    params: Dict[str, Any] = Field(default_factory=dict)
    id: Optional[Any] = None

class JSONRPCResponse(BaseModel):
    """JSON-RPC 2.0 Response"""
    jsonrpc: str = "2.0"
    result: Optional[Any] = None
    error: Optional[Dict[str, Any]] = None
    id: Optional[Any] = None

class GateCondition(BaseModel):
    """Gate evaluation condition"""
    gate_name: str
    condition: str  # Expression to evaluate
    threshold: float
    operator: str  # >, <, >=, <=, ==, !=
    required: bool = True

class GateResult(BaseModel):
    """Gate evaluation result"""
    gate_name: str
    passed: bool
    actual_value: float
    threshold: float
    message: str
    timestamp: str

class HandoffReport(BaseModel):
    """Handoff report for phase transitions"""
    from_phase: str
    to_phase: str
    status: str
    artifacts: List[ArtifactRef]
    gates: List[GateResult]
    metadata: Dict[str, Any]
    timestamp: str

class EventMessage(BaseModel):
    """WebSocket event message"""
    event_type: str
    event_data: Dict[str, Any]
    trace_id: str
    timestamp: str
    sequence: int