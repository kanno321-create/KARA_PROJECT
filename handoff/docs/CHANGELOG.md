# KIS Estimator - Change Log

## Version History: GA-2.0 → GA-2.2C

### GA-2.2C (2025-09-20)
**Type:** Feature Release + Hardening

**Added:**
- Inventory scoring with lead time penalties (cap 0.10)
- Price adder with 0.15 cap enforcement
- AI Manager dashboard integration
- Operations runbook for SRE

**Enhanced:**
- Circuit breaker with 5-minute recovery
- Idempotency via request ID hashing
- Health watchdog with auto-recovery
- Comprehensive audit logging

### GA-2.2 (2025-09-20)
**Type:** Feature Release

**Added:**
- Diff Viewer (read-only mode)
- Autofix proposals (no auto-apply)
- SLO gates (p95 < 2000ms, error rate < 0.5%)
- Nightly regression automation

**Fixed:**
- Unicode handling in evidence generation
- PowerShell BOM issues in packaging

### GA-2.1 (2025-09-19)
**Type:** Stabilization Release

**Enhanced:**
- Evidence generation pipeline
- Masking policy enforcement
- Desktop Guard integration
- SHA256 checksums for all bundles

**Fixed:**
- Template path resolution
- Catalog expiry warnings

### GA-2.0 (2025-09-19)
**Type:** Major Release

**Core Features:**
- FastAPI gateway (FastMCP)
- Multi-format parser (PDF, Excel, JSON)
- Evidence generation (JSON + Parquet)
- PII/cost masking enforcement
- Regression test framework

## Breaking Changes

### GA-2.0 → GA-2.2C
- API endpoint unchanged (backward compatible)
- New required environment variables for inventory
- Circuit breaker may reject requests during failures

## Migration Notes

### From GA-2.0
1. Update pointer to GA-2.2C
2. Set inventory configuration
3. Configure AI Manager connection

### From GA-2.1
1. Update pointer to GA-2.2C
2. Enable inventory scoring feature

### From GA-2.2
1. Update pointer to GA-2.2C
2. Configure lead penalty thresholds

## Deprecations

- Mock catalog will be removed in v3.0
- Legacy XML parser deprecated (use JSON)

## Known Issues

### Current (GA-2.2C)
- Circuit breaker recovery time fixed at 5 minutes
- Inventory snapshots must be CSV format
- Maximum request size: 10MB

### Workarounds
- For large requests: Split into batches
- For inventory: Use provided CSV template
- For circuit breaker: Manual reset available

## Performance Improvements

### GA-2.2 vs GA-2.0
- 30% faster evidence generation
- 50% reduction in memory usage
- 95th percentile latency < 2000ms

### GA-2.2C vs GA-2.2
- 10% improvement in inventory scoring
- Optimized lead time calculations
- Reduced audit log overhead

## Security Enhancements

### Throughout All Versions
- Enforced PII masking (***REDACTED***)
- Cost data protection
- Desktop Guard path restrictions
- Audit trail for all operations
- Request ID tracking for forensics

## Configuration Changes

### New in GA-2.2C
```yaml
inventory:
  enabled: true
  lead_penalty_cap: 0.10
  adder_cap: 0.15

ai_manager:
  enabled: true
  endpoint: "/v1/estimate"
```

### Environment Variables Added
```bash
ENABLE_INVENTORY_SCORING=true
LEAD_PENALTY_CAP=0.10
PRICE_ADDER_CAP=0.15
```

## Testing Coverage

### Regression Tests
- GA-2.0: 30 test cases
- GA-2.1: 35 test cases
- GA-2.2: 40 test cases
- GA-2.2C: 50+ test cases

### Test Categories
- Parser validation
- Evidence generation
- Masking compliance
- Circuit breaker behavior
- Inventory scoring accuracy
- SLO enforcement

## Future Roadmap

### v3.0 (Planned)
- GraphQL API support
- Real-time collaboration
- Advanced analytics dashboard
- Multi-region deployment

### v4.0 (Future)
- AI-powered optimization
- Predictive scoring
- Automated remediation
- Enterprise SSO integration