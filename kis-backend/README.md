# KIS견적 AI ERP Backend

Evidence-based Industrial Estimation System with 7-Layer Safety Net (안전망 7종)

## Overview

Complete backend implementation for the KIS ERP system, designed specifically for Korean industrial electrical panel estimation with AI-powered evidence generation, knowledge versioning, and comprehensive security architecture.

## 🛡️ Safety Net Architecture (안전망 7종)

### Layer 1-2: Security & Input Validation
- **API Key Authentication**: X-API-Key header enforcement
- **Rate Limiting**: Request throttling with configurable limits
- **Input Sanitization**: Zod schema validation with XSS/injection prevention
- **Pre-Gate Validation**: Input normalization and constraint checking

### Layer 3-4: Evidence & Integrity
- **Evidence Signatures**: HMAC-SHA256 cryptographic integrity
- **Audit Trail**: Complete operation logging with Evidence packages
- **Idempotency**: Transaction safety with duplicate request handling
- **Rollback Capability**: Database transaction management

### Layer 5-6: Knowledge Management
- **Version Control**: KnowledgeVersion/KnowledgeTable versioning system
- **Hot Swap Cache**: Thread-safe knowledge updates without service interruption
- **Golden Set Regression**: Automated testing of knowledge changes
- **CSV Import/Validation**: Strict data validation with staging workflow

### Layer 7: Contract & CI
- **OpenAPI 3.1**: Complete API contract documentation
- **Spectral Linting**: Automated API quality assurance
- **GitHub Actions**: 13-step CI pipeline with comprehensive testing
- **Automated Testing**: Contract, Integration, and E2E test suites

## Technology Stack

- **Framework**: Fastify with TypeScript
- **Database**: SQLite with Prisma ORM
- **Validation**: Zod schemas with Evidence signatures
- **Knowledge**: Versioned CSV tables with hot swap capability
- **Testing**: Vitest with Contract/Integration/E2E suites
- **Documentation**: OpenAPI 3.1 with Spectral linting
- **CI/CD**: GitHub Actions with 7-layer safety net verification

## Project Structure

```
src/
├── lib/
│   ├── validators.ts         # Zod schemas for API requests/responses
│   ├── size-tables-v2.ts     # Versioned knowledge cache with hot swap
│   ├── csv.ts                # Strict CSV parser with validation
│   ├── hash.ts               # SHA-256 utilities for data integrity
│   ├── enclosure-rules.ts    # Size calculation algorithms
│   ├── evidence.ts           # Evidence package generation with signatures
│   ├── pre-gates.ts          # Input validation and normalization
│   ├── security-middleware.ts # Rate limiting and API key auth
│   ├── idempotency.ts        # Transaction safety and duplicate handling
│   └── errors.ts             # KIS-specific error handling
├── services/
│   ├── estimate.service.ts   # Core estimation with evidence generation
│   └── abstain.service.ts    # Knowledge gap tracking and resolution
├── routes/
│   ├── estimate.ts           # Estimation API endpoints
│   ├── admin-knowledge.ts    # Knowledge management API (admin-only)
│   └── admin.ts              # System administration endpoints
├── regression/
│   └── golden.ts             # Golden set regression testing framework
├── jobs/
│   └── cleanup.ts            # Background job management
├── scripts/
│   ├── test-idempotency-concurrency.js    # CI automation scripts
│   ├── admin-activate-and-regress.js      # Knowledge workflow testing
│   └── collect-evidence-samples.js        # Evidence integrity testing
├── test/
│   ├── contract/             # API contract validation tests
│   └── integration/          # System integration tests
├── app.ts                    # Fastify application with all safety nets
├── index.ts                  # Server entry point
└── config.ts                 # Environment configuration
```

## Key Features

### 1. Versioned Knowledge Management
- **KnowledgeVersion**: Label-based versioning (e.g., "v2025-09-24-01")
- **Active/Inactive States**: Single active version with historical tracking
- **Staging Workflow**: Import → Validate → Activate with regression testing
- **Hot Swap**: Zero-downtime knowledge updates with thread safety
- **Audit Trail**: Complete change tracking with user attribution

### 2. Evidence-Based Architecture
- **Signature Generation**: HMAC-SHA256 with configurable secret
- **Snapshot Integrity**: SHA-256 hashing of normalized request data
- **Table References**: Exact CSV rows used in calculations
- **Version Consistency**: Evidence tied to specific knowledge versions
- **Verification API**: Independent signature validation endpoint

### 3. Admin Knowledge API
- **POST /v1/knowledge/tables/import** - CSV/JSON import to staging
- **POST /v1/knowledge/tables/validate** - Sample validation with estimates
- **POST /v1/knowledge/tables/activate** - Hot swap with regression tests
- **POST /v1/knowledge/tables/rollback** - Version rollback capability
- **GET /v1/knowledge/versions** - Version history and status

### 4. Comprehensive Testing
- **Contract Tests**: API schema compliance and error handling
- **Integration Tests**: Complete workflow validation
- **Security Tests**: Authentication, authorization, input validation
- **Regression Tests**: Golden set validation across knowledge versions
- **CI Automation**: Scripts for idempotency, workflow, and evidence testing

### 5. OpenAPI 3.1 Documentation
- **Complete Schema**: All endpoints with request/response definitions
- **Error Documentation**: Standard error formats with examples
- **Security Schemes**: API key authentication documentation
- **Spectral Linting**: Automated quality assurance and style enforcement
- **Interactive Docs**: Swagger UI with live API testing

## API Endpoints

### Core Estimation
- `POST /v1/estimate/create` - Full estimation with evidence generation
- `GET /v1/estimate/:id` - Retrieve estimate with evidence
- `GET /v1/evidence/:estimateId` - Evidence package access
- `POST /v1/evidence/verify` - Signature verification

### Knowledge Management (Admin)
- `GET /v1/knowledge/versions` - List all knowledge versions
- `GET /v1/knowledge/versions/active` - Get active version
- `POST /v1/knowledge/tables/import` - Import CSV data to staging
- `POST /v1/knowledge/tables/validate` - Validate staging with samples
- `POST /v1/knowledge/tables/activate` - Activate version with regression
- `POST /v1/knowledge/tables/rollback` - Rollback to previous version

### System Health
- `GET /health` - System status with knowledge version info
- `GET /api-docs` - OpenAPI documentation (Swagger UI)

## Security Architecture

### Authentication & Authorization
- **API Key**: X-API-Key header required for all endpoints
- **Admin Privileges**: Knowledge management requires admin API key
- **Rate Limiting**: Configurable request throttling per IP/key

### Data Integrity
- **Evidence Signatures**: HMAC-SHA256 with timing-safe comparison
- **Input Validation**: Zod schemas with sanitization
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **XSS Prevention**: Input sanitization and output encoding

### Operational Security
- **Secret Management**: Environment-based secret configuration
- **Audit Logging**: Complete operation tracking
- **Error Sanitization**: No sensitive data in error responses
- **Idempotency Keys**: Prevent replay attacks

## Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration:
   # - DATABASE_URL
   # - API_KEY (admin access)
   # - EVIDENCE_SECRET (signature generation)
   ```

4. **Development Server**
   ```bash
   npm run dev
   ```

5. **Testing**
   ```bash
   npm test                    # Unit tests
   npm run test:contract       # API contract tests
   npm run test:integration    # Integration tests
   npm run test:all           # All test suites
   ```

## Knowledge Management Workflow

### 1. Import New Knowledge
```bash
# CSV import to staging
curl -X POST http://localhost:3000/v1/knowledge/tables/import \
  -H "X-API-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "csv",
    "content": "brand,series,model,af,poles,width_mm,height_mm,depth_mm,meta\n...",
    "versionLabel": "v2025-09-24-02"
  }'
```

### 2. Validate Staging Data
```bash
# Test staging with sample estimates
curl -X POST http://localhost:3000/v1/knowledge/tables/validate \
  -H "X-API-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "versionLabel": "v2025-09-24-02",
    "sampleSize": 10
  }'
```

### 3. Activate Version (Hot Swap)
```bash
# Activate with regression testing
curl -X POST http://localhost:3000/v1/knowledge/tables/activate \
  -H "X-API-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "versionLabel": "v2025-09-24-02",
    "runRegression": true
  }'
```

### 4. Monitor and Rollback if Needed
```bash
# Rollback if issues detected
curl -X POST http://localhost:3000/v1/knowledge/tables/rollback \
  -H "X-API-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "targetVersionLabel": "v2025-09-24-01",
    "reason": "Performance regression detected"
  }'
```

## CI/CD Pipeline

### GitHub Actions Workflow
The `.github/workflows/kis-audit.yml` implements a 13-step audit process:

1. **Environment Setup** - Node.js, pnpm, dependencies
2. **Static Analysis** - TypeScript, ESLint, Prettier
3. **Database Setup** - Prisma migrations and seeding
4. **OpenAPI Validation** - Spectral linting and contract verification
5. **Server Startup** - Background server for testing
6. **Smoke Tests** - Basic endpoint health checks
7. **Validation Tests** - Input validation and error handling
8. **Idempotency Testing** - Concurrent request handling
9. **Load Testing** - Performance under stress
10. **Knowledge Workflow** - Import → Validate → Activate cycle
11. **Evidence Integrity** - Signature verification and samples
12. **Artifact Collection** - Test results and evidence samples
13. **PR Comments** - Automated audit summary

### Local CI Testing
```bash
# Run full audit locally
npm run audit:full

# Individual test suites
npm run test:idempotency
npm run test:knowledge-workflow
npm run test:evidence-collection
```

## Production Deployment

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

3. **Environment Variables**
   ```bash
   # Required production environment variables
   DATABASE_URL=file:./production.db
   API_KEY=your-secure-admin-key
   EVIDENCE_SECRET=your-cryptographic-secret
   NODE_ENV=production
   PORT=3000
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

## Error Handling

### Standard Error Format
```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description",
  "statusCode": 422,
  "details": {
    "field": "specific validation details"
  }
}
```

### KIS-Specific Error Codes
- `MISSING_API_KEY` - Authentication required
- `BRAND_CONFLICT` - Single brand principle violation
- `NEED_KNOWLEDGE_UPDATE` - Missing dimension data
- `VERSION_NOT_FOUND` - Invalid knowledge version
- `VERSION_ALREADY_EXISTS` - Duplicate version label
- `EVIDENCE_INVALID` - Signature verification failed

## Performance Monitoring

### Metrics and Health Checks
- **Response Times**: Built-in request timing
- **Cache Hit Rates**: Knowledge cache performance
- **Error Rates**: Validation and system errors
- **Knowledge Version**: Active version tracking
- **Evidence Integrity**: Signature verification rates

### Optimization Features
- **In-Memory Cache**: Size tables loaded at startup
- **Hot Swap**: Zero-downtime knowledge updates
- **Connection Pooling**: Database connection management
- **Request Batching**: Efficient bulk operations

## Security Best Practices

### Production Security Checklist
- [ ] Strong API keys with rotation policy
- [ ] EVIDENCE_SECRET with high entropy (256-bit recommended)
- [ ] Rate limiting configured for production load
- [ ] Database access restricted to application
- [ ] Error logging without sensitive data exposure
- [ ] Regular security audits and dependency updates

### Compliance Features
- **Audit Trail**: Complete operation logging
- **Data Integrity**: Cryptographic evidence verification
- **Access Control**: Role-based API key management
- **Change Tracking**: Knowledge version history
- **Rollback Capability**: Quick recovery from issues

---

**Contact**: KARA PROJECT Team
**License**: Proprietary
**Version**: 2.0.0 (안전망 7종 Complete Implementation)
**Documentation**: [OpenAPI Specification](./openapi.yaml)
**CI Status**: [GitHub Actions](/.github/workflows/kis-audit.yml)