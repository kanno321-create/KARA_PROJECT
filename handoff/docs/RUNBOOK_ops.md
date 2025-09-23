# KIS Estimator v1 - Operations Runbook

## Quick Health Checks

```bash
# Service health
curl http://localhost:8000/v1/health

# Circuit breaker status
curl http://localhost:8000/v1/circuit/status

# Recent errors
tail -100 logs/structured_ops.ndjson | grep ERROR
```

## Common Operations

### Start/Stop Service

**Start:**
```bash
./deploy/run.sh
# or
systemctl start kis-estimator
```

**Stop:**
```bash
pkill -f fastmcp_gateway
# or
systemctl stop kis-estimator
```

**Restart:**
```bash
systemctl restart kis-estimator
# or
pkill -f fastmcp_gateway && ./deploy/run.sh
```

### Mode Switching

**To MOCK mode (testing):**
```bash
export MODE=MOCK
./deploy/run.sh
```

**To LIVE mode (production):**
```bash
export MODE=LIVE
# Ensure API keys are set
./deploy/run.sh
```

## Alert Response Procedures

### Circuit Breaker OPEN

**Symptoms:** All requests returning 503 Service Unavailable

**Response:**
1. Check recent failures:
   ```bash
   grep "circuit_breaker" logs/*.ndjson | tail -20
   ```
2. Wait 5 minutes for auto-recovery
3. Manual reset if needed:
   ```bash
   curl -X POST http://localhost:8000/v1/circuit/reset
   ```

### SLO Breach (p95 > 2000ms)

**Response:**
1. Check current metrics:
   ```bash
   curl http://localhost:8000/v1/metrics
   ```
2. Identify slow operations in logs
3. Scale horizontally if load-related
4. Review recent deployments

### Masking Failure

**Symptoms:** PII or costs visible in evidence

**Response:**
1. **IMMEDIATE:** Stop service
2. Enable emergency masking:
   ```bash
   export FORCE_MASKING=true
   ```
3. Clear unmasked evidence:
   ```bash
   rm out/evidence/*.json
   ```
4. Restart with masking enforced

### High Error Rate

**Threshold:** > 0.5% errors

**Response:**
1. Check error patterns:
   ```bash
   grep ERROR logs/*.ndjson | awk '{print $4}' | sort | uniq -c
   ```
2. Common causes:
   - Invalid API keys
   - Catalog expiry
   - Template corruption

## Monitoring

### Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| P95 Latency | < 2000ms | > 2000ms |
| Error Rate | < 0.5% | > 1% |
| Circuit State | CLOSED | OPEN |
| Memory Usage | < 1GB | > 2GB |
| CPU Usage | < 80% | > 90% |

### Log Locations

- Application: `/var/log/kis/estimator.log`
- Audit: `logs/audit_events.ndjson`
- Operations: `logs/structured_ops.ndjson`
- Evidence: `out/evidence/*.json`

### Health Endpoints

```bash
# Main health
GET /v1/health

# Component health
GET /v1/templates/health
GET /v1/evidence/health
GET /v1/catalog/health
```

## Rollback Procedures

### To Previous Version

1. Stop current service
2. Backup current state:
   ```bash
   tar -czf backup_$(date +%Y%m%d).tar.gz out/ logs/
   ```
3. Switch pointer:
   ```bash
   cp release/GA-2.2.pointer release/current.pointer
   ```
4. Restart service

### Emergency Stop

```bash
# Immediate stop
pkill -9 -f fastmcp_gateway

# Create stop flag
touch /tmp/EMERGENCY_STOP

# Service will refuse to start while flag exists
```

## Maintenance Tasks

### Daily
- Check health endpoint
- Review error logs
- Monitor SLO metrics
- Verify evidence masking

### Weekly
- Audit log review
- Performance analysis
- Catalog expiry check
- Backup evidence

### Monthly
- Rotate logs
- Update dependencies
- Security patches
- Capacity planning

## Troubleshooting

### Service Won't Start

1. Check port conflict:
   ```bash
   lsof -i :8000
   ```
2. Verify Python path:
   ```bash
   which python3
   ```
3. Check dependencies:
   ```bash
   pip freeze | grep fastapi
   ```

### Slow Response Times

1. Check worker count:
   ```bash
   ps aux | grep uvicorn | wc -l
   ```
2. Memory pressure:
   ```bash
   free -h
   ```
3. Circuit breaker state:
   ```bash
   curl http://localhost:8000/v1/circuit/status
   ```

### Evidence Not Generated

1. Check write permissions:
   ```bash
   ls -la out/evidence/
   ```
2. Disk space:
   ```bash
   df -h /app
   ```
3. Masking policy:
   ```bash
   cat config/mode.yaml | grep masking
   ```

## Contact & Escalation

### Support Levels

- **L1:** Monitor, restart, basic checks
- **L2:** Log analysis, configuration changes
- **L3:** Code changes, architecture decisions

### Escalation Path

1. Service down > L1 immediate response
2. SLO breach > L2 investigation within 30min
3. Data leak > L3 + Security team IMMEDIATE

## Security Reminders

- **NEVER** log API keys
- **ALWAYS** verify masking before release
- **CHECK** audit logs for anomalies
- **ROTATE** credentials quarterly