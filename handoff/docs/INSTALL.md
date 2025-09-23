# KIS Estimator v1 - Installation Guide

## Prerequisites

- Python 3.8 or higher
- pip package manager
- 2GB RAM minimum
- 1GB disk space

## Quick Start

### 1. Extract Package
```bash
unzip KIS_Estimator_v1_HANDOFF_*.zip
cd handoff/
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
# or
pip install fastapi uvicorn pydantic pyyaml
```

### 3. Configure Environment
```bash
cp config/.env.live.template .env
# Edit .env with your API keys
```

### 4. Start Service
```bash
./deploy/run.sh
# or
python -m uvicorn KIS.Tools.gateway.fastmcp_gateway:app --port 8000
```

### 5. Verify Health
```bash
curl http://localhost:8000/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "GA-2.2C",
  "mode": "LIVE",
  "timestamp": "..."
}
```

## Smoke Test

### Basic Estimation Test
```bash
# Using provided test case
curl -X POST http://localhost:8000/v1/estimate \
  -H "Content-Type: application/json" \
  -d @tests/regression/seed_001.json
```

### Check Evidence Generation
```bash
ls -la out/evidence/
# Should see masked JSON files
```

### Verify Masking
```bash
grep "REDACTED" out/evidence/*.json
# Should find PII/cost masking
```

## Docker Installation (Optional)

### Build Image
```bash
docker build -t kis-estimator:v1 .
```

### Run Container
```bash
docker run -d \
  -p 8000:8000 \
  -e PDF_API_KEY=$PDF_API_KEY \
  -e OCR_API_KEY=$OCR_API_KEY \
  -e CATALOG_API_KEY=$CATALOG_API_KEY \
  kis-estimator:v1
```

## Configuration

### Mode Selection
- **LIVE**: Production mode with real API calls
- **MOCK**: Testing mode with simulated responses

Edit `config/mode.yaml` to change mode.

### Performance Tuning
```bash
export WORKERS=4          # Number of worker processes
export REQUEST_TIMEOUT=30 # Request timeout in seconds
```

### Logging
```bash
export LOG_LEVEL=INFO     # DEBUG for troubleshooting
export LOG_FILE=/var/log/kis/estimator.log
```

## Troubleshooting

### Service Won't Start
1. Check Python version: `python --version`
2. Verify dependencies: `pip list | grep fastapi`
3. Check port availability: `netstat -an | grep 8000`

### API Keys Not Working
1. Verify environment: `echo $PDF_API_KEY`
2. Check mode: Should be LIVE, not MOCK
3. Review logs for auth errors

### Performance Issues
1. Increase workers: `export WORKERS=8`
2. Check circuit breaker: May be in OPEN state
3. Review SLO metrics in logs

## Directory Structure

```
handoff/
├── deploy/          # Startup scripts
├── config/          # Configuration files
├── prompts/         # System prompts
├── tests/           # Test cases
├── tools/           # Utilities
├── out/             # Output/evidence
├── docs/            # Documentation
└── openapi.yaml     # API specification
```

## Security Notes

- Never expose API keys in logs
- Use HTTPS in production
- Enable Desktop Guard for path protection
- Review audit logs regularly

## Support

For issues, check:
1. `docs/RUNBOOK_ops.md` - Operations guide
2. `RELEASE_NOTES.md` - Known limitations
3. Health endpoint - `/v1/health`
4. Logs - Application and audit logs