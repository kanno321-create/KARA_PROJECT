# MCP Gateway

Model Context Protocol Gateway for KIS orchestration system.

## Features

- **JSON-RPC 2.0 API**: Standard protocol for method invocation
- **WebSocket Support**: Real-time streaming and event subscription
- **Agent Orchestration**: KARA/Codex/Sonnet integration points
- **Evidence Generation**: Automatic artifact tracking and SHA256 hashing
- **Gate Evaluation**: Quality gates and threshold enforcement

## Quick Start

```bash
# Install dependencies
pip install -r ops/requirements.txt

# Run locally
uvicorn mcp-gateway.api.main:app --reload --port 8080

# Test health
curl http://localhost:8080/health

# Test ping
curl -X POST http://localhost:8080/mcp/gateway \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"ping","id":"test"}'
```

## API Endpoints

### Health Check
- **GET** `/health` - Service health status

### JSON-RPC Gateway
- **POST** `/mcp/gateway` - JSON-RPC 2.0 endpoint
  - Methods: `ping`, `orchestrate.run`, `gate.evaluate`, `report.handoff`

### WebSocket Stream
- **WS** `/mcp/gateway/stream` - Real-time event streaming
  - 20-second heartbeat
  - Event subscription support

## Deployment

### Vercel
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy using `vercel.json` configuration

### Environment Variables
See `.env.example` for required configuration.

## Testing

```bash
# Run unit tests
pytest api/tests -v

# Run smoke tests
./scripts/smoke_gateway.sh
```

## Architecture

```
MCP Gateway
├── API Layer (FastAPI)
├── Orchestrator (Workflow Engine)
├── Agent Connectors (KARA/Codex/Sonnet)
├── Evidence System (Artifacts + SHA256)
└── Gate Evaluator (Quality Thresholds)
```

## License

PROPRIETARY - KIS Project