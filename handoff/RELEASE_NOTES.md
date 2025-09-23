# KIS Estimator v1 - Handoff Package Release Notes

## Package Information
- **Version:** GA-2.2C
- **Type:** Production Handoff Bundle
- **Date:** 2025-09-20
- **Scope:** Estimation Service Only (No ERP Functions)

## Package Contents

### Core Components
- **API Gateway:** FastMCP-based REST API
- **OpenAPI Specification:** v1 estimation endpoints
- **Evidence Pipeline:** JSON/Parquet generation with masking
- **Test Suite:** 10 regression test seeds

### Configuration
- **Mode Control:** LIVE/MOCK operation modes
- **Environment Template:** API key placeholders (secrets not included)
- **Feature Flags:** Diff viewer, autofix, inventory scoring

### Documentation
- **Installation Guide:** Setup and smoke test procedures
- **Operations Runbook:** Alert response and troubleshooting
- **Change Log:** Version history GA-2.0 through GA-2.2C

## Security & Compliance

### Data Protection
- **PII Masking:** All personal data shows as ***REDACTED***
- **Cost Masking:** Financial data protected
- **No Secrets:** API keys must be injected at runtime

### Boundaries
- **Estimator Only:** No ERP functionality included
- **Read-Only:** Diff viewer in observation mode
- **Proposal-Only:** Autofix suggestions without auto-apply

## Operational Requirements

### System Requirements
- Python 3.8+
- 2GB RAM minimum
- FastAPI, Uvicorn, PyYAML

### Service Level Objectives
- P95 Latency: < 2000ms
- Error Rate: < 0.5%
- Availability: > 99.9%

### Monitoring Points
- Health: `/v1/health`
- Circuit Breaker: Auto-recovery after 5 minutes
- Audit Logs: NDJSON format

## Known Limitations

### Current Constraints
- Maximum request size: 10MB
- Inventory snapshots: CSV format only
- Circuit breaker timeout: Fixed 5 minutes
- Single-node deployment only

### Not Included
- Database persistence
- External service integrations (except APIs)
- User authentication system
- Multi-tenant support

## Rollback Procedures

### Version Rollback
```bash
# To GA-2.2
cp release/GA-2.2.pointer release/current.pointer

# To GA-2.1 (stable)
cp release/GA-2.1.pointer release/current.pointer
```

### Emergency Stop
```bash
# Immediate halt
pkill -f fastmcp_gateway
echo '{"stopped": true}' > /tmp/EMERGENCY_STOP
```

## Deployment Checklist

### Pre-Deployment
- [ ] Verify Python 3.8+ installed
- [ ] Install dependencies from requirements
- [ ] Set environment variables (API keys)
- [ ] Configure mode (LIVE or MOCK)

### Deployment
- [ ] Run health check endpoint
- [ ] Execute smoke test with seed data
- [ ] Verify evidence generation
- [ ] Confirm masking active

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check SLO metrics
- [ ] Verify circuit breaker CLOSED
- [ ] Review audit trail

## Testing

### Included Test Seeds
- 10 regression test cases in `/tests/regression/`
- Pre-validated for PASS status
- Covers core estimation scenarios

### Running Tests
```bash
# Single test
curl -X POST http://localhost:8000/v1/estimate \
  -d @tests/regression/seed_001.json

# Batch testing
for seed in tests/regression/*.json; do
  curl -X POST http://localhost:8000/v1/estimate -d @$seed
done
```

## Support Information

### Documentation
- API Specification: `/openapi.yaml`
- Operations Guide: `/docs/RUNBOOK_ops.md`
- Installation: `/docs/INSTALL.md`

### Troubleshooting Priority
1. Check health endpoint
2. Review error logs
3. Verify API keys loaded
4. Check circuit breaker state
5. Confirm masking policy

## Important Notes

### Security Reminders
- Never commit real API keys
- Always verify masking before production
- Monitor audit logs for anomalies
- Rotate credentials quarterly

### Operational Reminders
- Circuit breaker protects downstream services
- Evidence files accumulate - implement rotation
- SLO breaches trigger alerts
- Inventory scoring affects pricing

## Handoff Validation

Before going live, verify:
- [ ] SHA256SUMS.txt matches all files
- [ ] No ERP-related components present
- [ ] Masking active on sample evidence
- [ ] Health endpoint returns "healthy"
- [ ] Test seed produces valid response

---
**Package Integrity:** See SHA256SUMS.txt for checksums
**Boundary Compliance:** Estimator-only, no ERP access
**Contact:** Refer to escalation paths in RUNBOOK_ops.md