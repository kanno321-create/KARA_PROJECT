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

# Estimate schemas
class EstimateItem(BaseModel):
    """Single item in an estimate"""
    item_id: Optional[str] = None
    description: str
    quantity: float
    unit_price: float
    unit: Optional[str] = "EA"

class EstimateRequest(BaseModel):
    """Request for creating an estimate"""
    items: List[Dict[str, Any]]
    customer_id: Optional[str] = None
    project_name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class EstimateResponse(BaseModel):
    """Response for estimate creation"""
    estimate_id: str
    status: str
    items: List[Dict[str, Any]]
    total: float
    created_at: str
    created_by: str
    trace_id: str

# Validation schemas
class ValidateRequest(BaseModel):
    """Request for data validation"""
    data_type: str  # "estimate", "invoice", "configuration"
    data: Dict[str, Any]
    rules: Optional[List[str]] = None

class ValidationResult(BaseModel):
    """Single validation result"""
    field: str
    error: str

class ValidateResponse(BaseModel):
    """Response for validation request"""
    validation_id: str
    is_valid: bool
    validations: List[Dict[str, str]]
    data_type: str
    validated_at: str
    validated_by: str
    trace_id: str