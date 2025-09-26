"""
MCP Gateway Orchestrator
Manages KARA/Codex/Sonnet agent orchestration
"""
import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, List
from .schemas import JobRequest, JobResult, GateResult, HandoffReport, EventMessage, ArtifactRef
from .utils import utc_iso, write_artifact_local, sha256sum_file, update_sha256sums

logger = logging.getLogger(__name__)

class Orchestrator:
    """Main orchestration engine"""

    def __init__(self):
        self.active_jobs: Dict[str, Dict[str, Any]] = {}
        self.event_sequence = 0

    async def initialize(self):
        """Initialize orchestrator resources"""
        logger.info("Orchestrator initializing...")
        # Future: Initialize agent connections, load configurations

    async def cleanup(self):
        """Cleanup orchestrator resources"""
        logger.info("Orchestrator cleaning up...")
        # Cancel all active jobs
        for job_id in list(self.active_jobs.keys()):
            await self.cancel_job(job_id)

    async def execute(self, request: JobRequest, trace_id: str) -> Dict[str, Any]:
        """Execute orchestration job"""
        logger.info(f"[{trace_id}] Executing job {request.job_id}: {request.task_type}")

        # Record job start
        start_time = datetime.now(timezone.utc)
        self.active_jobs[request.job_id] = {
            "status": "RUNNING",
            "started_at": start_time.isoformat(),
            "trace_id": trace_id
        }

        try:
            # Execute workflow phases
            result = await self._execute_workflow(request, trace_id)

            # Calculate duration
            end_time = datetime.now(timezone.utc)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)

            # Build response
            job_result = JobResult(
                job_id=request.job_id,
                status="COMPLETED",
                result=result,
                artifacts=result.get("artifacts", []),
                metrics={
                    "duration_ms": duration_ms,
                    "phases_completed": result.get("phases_completed", 0)
                },
                timestamp=utc_iso(),
                duration_ms=duration_ms
            )

            # Log completion
            await self._log_event({
                "job_id": request.job_id,
                "status": "COMPLETED",
                "duration_ms": duration_ms,
                "trace_id": trace_id
            })

            return job_result.dict()

        except Exception as e:
            logger.error(f"[{trace_id}] Job {request.job_id} failed: {str(e)}")

            # Build error response
            job_result = JobResult(
                job_id=request.job_id,
                status="FAILED",
                error=str(e),
                timestamp=utc_iso()
            )

            return job_result.dict()
        finally:
            # Clean up job
            if request.job_id in self.active_jobs:
                del self.active_jobs[request.job_id]

    async def stream_execute(self, request: JobRequest, trace_id: str) -> AsyncGenerator[Dict[str, Any], None]:
        """Execute job with streaming events"""
        logger.info(f"[{trace_id}] Streaming execution for job {request.job_id}")

        # Workflow phases
        phases = ["READY", "DEV", "TEST", "COLLECT", "REPORT", "DECIDE"]

        for phase in phases:
            # Simulate phase execution
            await asyncio.sleep(0.5)

            # Generate event
            event = EventMessage(
                event_type="phase_transition",
                event_data={
                    "job_id": request.job_id,
                    "phase": phase,
                    "status": "IN_PROGRESS"
                },
                trace_id=trace_id,
                timestamp=utc_iso(),
                sequence=self._next_sequence()
            )

            yield event.dict()

            # Log phase
            await self._log_event({
                "job_id": request.job_id,
                "phase": phase,
                "trace_id": trace_id
            })

        # Final completion event
        yield EventMessage(
            event_type="job_complete",
            event_data={
                "job_id": request.job_id,
                "status": "COMPLETED"
            },
            trace_id=trace_id,
            timestamp=utc_iso(),
            sequence=self._next_sequence()
        ).dict()

    async def evaluate_gates(self, params: Dict[str, Any], trace_id: str) -> Dict[str, Any]:
        """Evaluate gate conditions"""
        logger.info(f"[{trace_id}] Evaluating gates")

        # Sample gate evaluation (stub)
        gates = []

        # Enclosure gate
        gates.append(GateResult(
            gate_name="ENCLOSURE",
            passed=True,
            actual_value=0.92,
            threshold=0.90,
            message="Fit score meets requirement",
            timestamp=utc_iso()
        ).dict())

        # Breaker gate
        gates.append(GateResult(
            gate_name="BREAKER",
            passed=True,
            actual_value=3.5,
            threshold=5.0,
            message="Phase imbalance within tolerance",
            timestamp=utc_iso()
        ).dict())

        # Document gate
        gates.append(GateResult(
            gate_name="DOC_LINT",
            passed=True,
            actual_value=0,
            threshold=0,
            message="No documentation errors",
            timestamp=utc_iso()
        ).dict())

        return {
            "gates": gates,
            "all_passed": all(g["passed"] for g in gates),
            "timestamp": utc_iso()
        }

    async def generate_handoff(self, params: Dict[str, Any], trace_id: str) -> Dict[str, Any]:
        """Generate handoff report"""
        logger.info(f"[{trace_id}] Generating handoff report")

        # Generate sample artifacts
        artifacts = []

        # Create evidence artifact
        evidence_data = {
            "job_id": params.get("job_id", "unknown"),
            "phase": params.get("from_phase", "DEV"),
            "timestamp": utc_iso(),
            "metrics": {
                "coverage": 0.95,
                "quality_score": 98
            }
        }

        artifact_path = await write_artifact_local(
            "handoff_evidence.json",
            json.dumps(evidence_data, indent=2)
        )

        if artifact_path:
            sha256 = await sha256sum_file(artifact_path)
            artifacts.append(ArtifactRef(
                artifact_id=f"handoff_{params.get('job_id', 'unknown')}",
                artifact_type="json",
                path=artifact_path,
                size_bytes=len(json.dumps(evidence_data)),
                sha256=sha256,
                created_at=utc_iso(),
                metadata={"phase": params.get("from_phase", "DEV")}
            ).dict())

        # Build handoff report
        handoff = HandoffReport(
            from_phase=params.get("from_phase", "DEV"),
            to_phase=params.get("to_phase", "TEST"),
            status="READY",
            artifacts=artifacts,
            gates=[],
            metadata=params.get("metadata", {}),
            timestamp=utc_iso()
        )

        return handoff.dict()

    async def cancel_job(self, job_id: str):
        """Cancel an active job"""
        if job_id in self.active_jobs:
            logger.info(f"Cancelling job {job_id}")
            self.active_jobs[job_id]["status"] = "CANCELLED"
            del self.active_jobs[job_id]

    async def _execute_workflow(self, request: JobRequest, trace_id: str) -> Dict[str, Any]:
        """Execute the main workflow phases"""
        artifacts = []
        phases_completed = 0

        # Phase 1: READY
        await self._log_event({"phase": "READY", "job_id": request.job_id, "trace_id": trace_id})
        phases_completed += 1

        # Phase 2: DEV
        await asyncio.sleep(0.1)  # Simulate work
        await self._log_event({"phase": "DEV", "job_id": request.job_id, "trace_id": trace_id})
        phases_completed += 1

        # Phase 3: TEST
        await asyncio.sleep(0.1)
        await self._log_event({"phase": "TEST", "job_id": request.job_id, "trace_id": trace_id})
        phases_completed += 1

        # Phase 4: COLLECT
        await asyncio.sleep(0.1)
        await self._log_event({"phase": "COLLECT", "job_id": request.job_id, "trace_id": trace_id})
        phases_completed += 1

        # Phase 5: REPORT
        # Generate sample artifact
        report_data = {
            "job_id": request.job_id,
            "task_type": request.task_type,
            "phases_completed": phases_completed,
            "timestamp": utc_iso()
        }
        artifact_path = await write_artifact_local(
            f"job_{request.job_id}_report.json",
            json.dumps(report_data, indent=2)
        )
        if artifact_path:
            artifacts.append(artifact_path)

        await self._log_event({"phase": "REPORT", "job_id": request.job_id, "trace_id": trace_id})
        phases_completed += 1

        # Phase 6: DECIDE
        await self._log_event({"phase": "DECIDE", "job_id": request.job_id, "trace_id": trace_id})
        phases_completed += 1

        return {
            "phases_completed": phases_completed,
            "artifacts": artifacts,
            "final_status": "SUCCESS"
        }

    async def _log_event(self, event_data: Dict[str, Any]):
        """Log event to artifacts"""
        event_line = json.dumps({
            "timestamp": utc_iso(),
            **event_data
        })
        await write_artifact_local("orchestrator_events.jsonl", event_line + "\n", append=True)

    def _next_sequence(self) -> int:
        """Get next sequence number"""
        self.event_sequence += 1
        return self.event_sequence