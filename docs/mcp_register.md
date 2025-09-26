# MCP Tool Registration

Configuration for `.mcp/config.yaml` to register MCP Gateway tools.

## Sample Configuration

```yaml
version: "1.0"
name: "KIS MCP Gateway"
description: "Model Context Protocol tools for KIS orchestration"

tools:
  orchestrate.run:
    description: "Execute orchestration workflow"
    endpoint: "${MCP_GATEWAY_URL}/mcp/gateway"
    method: "POST"
    schema:
      type: object
      required:
        - job_id
        - task_type
      properties:
        job_id:
          type: string
          description: "Unique job identifier"
        task_type:
          type: string
          enum: ["analyze", "generate", "validate", "report"]
        payload:
          type: object
          description: "Task-specific data"

  gate.evaluate:
    description: "Evaluate quality gates"
    endpoint: "${MCP_GATEWAY_URL}/mcp/gateway"
    method: "POST"
    schema:
      type: object
      required:
        - gates
      properties:
        gates:
          type: array
          items:
            type: object
            properties:
              name:
                type: string
              threshold:
                type: number
              condition:
                type: string

  stream.subscribe:
    description: "Subscribe to event stream"
    endpoint: "${MCP_GATEWAY_URL}/mcp/gateway/stream"
    protocol: "websocket"
    schema:
      type: object
      properties:
        channel:
          type: string
          description: "Event channel to subscribe"
        filter:
          type: object
          description: "Event filter criteria"

  report.handoff:
    description: "Generate handoff report"
    endpoint: "${MCP_GATEWAY_URL}/mcp/gateway"
    method: "POST"
    schema:
      type: object
      required:
        - from_phase
        - to_phase
      properties:
        from_phase:
          type: string
        to_phase:
          type: string
        artifacts:
          type: array
          items:
            type: string

environments:
  development:
    MCP_GATEWAY_URL: "http://localhost:8080"

  staging:
    MCP_GATEWAY_URL: "${STAGING_URL}"

  production:
    MCP_GATEWAY_URL: "${VERCEL_URL}"
```

## Registration Steps

1. Create `.mcp/` directory in project root
2. Copy above configuration to `.mcp/config.yaml`
3. Set environment variables:
   ```bash
   export MCP_GATEWAY_URL=http://localhost:8080
   ```
4. Register tools with MCP runtime:
   ```bash
   mcp register --config .mcp/config.yaml
   ```

## Tool Usage Examples

```javascript
// JavaScript/TypeScript
const result = await mcp.tools.orchestrate.run({
  job_id: "job_123",
  task_type: "analyze",
  payload: { data: "..." }
});

// Python
result = mcp.tools["gate.evaluate"]({
  "gates": [
    {"name": "coverage", "threshold": 0.8, "condition": ">"}
  ]
})
```

## Verification

```bash
# List registered tools
mcp tools list

# Test tool invocation
mcp tools test orchestrate.run --dry-run
```