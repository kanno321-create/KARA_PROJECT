# Secret Injection Guide

## Required Environment Variables

The KIS Estimator requires the following secrets to be injected at runtime:

### API Keys (REQUIRED for LIVE mode)
```bash
export PDF_API_KEY="your-pdf-api-key"
export OCR_API_KEY="your-ocr-api-key"
export CATALOG_API_KEY="your-catalog-api-key"
```

### Optional Configuration
```bash
export MODE="LIVE"              # LIVE or MOCK
export PORT="8000"              # API port
export WORKERS="4"              # Worker processes
export LOG_LEVEL="INFO"        # DEBUG, INFO, WARNING, ERROR
```

## Loading Methods

### 1. Using .env file (Recommended)
```bash
cp .env.live.template .env
# Edit .env with your actual keys
source .env
./run.sh
```

### 2. Direct environment injection
```bash
PDF_API_KEY=xxx OCR_API_KEY=yyy CATALOG_API_KEY=zzz ./run.sh
```

### 3. Docker Compose
```yaml
environment:
  - PDF_API_KEY=${PDF_API_KEY}
  - OCR_API_KEY=${OCR_API_KEY}
  - CATALOG_API_KEY=${CATALOG_API_KEY}
```

### 4. Kubernetes Secret
```yaml
envFrom:
- secretRef:
    name: kis-estimator-secrets
```

## Security Notes

- NEVER commit actual keys to version control
- Use secret management systems in production
- Rotate keys regularly
- Monitor key usage for anomalies

## Validation

After loading secrets, verify:
```bash
curl http://localhost:8000/v1/health
# Should show "mode: LIVE" if secrets loaded correctly
```