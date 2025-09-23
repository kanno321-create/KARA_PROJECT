# KIS견적 AI ERP Backend

Evidence-based Industrial Estimation System

## Overview

This is the complete backend implementation for the KIS ERP system, designed specifically for Korean industrial electrical panel estimation with AI-powered evidence generation and strict CEO knowledge-based validation.

## Architecture

### Core Principles
- **Evidence-Based**: Every decision backed by CEO's knowledge only
- **ABSTAIN on Missing Data**: Never guess, always ask specific questions
- **Single Brand Principle**: SANGDO/LS separation (MIXED only when explicit)
- **Economic Form Default**: 8:2 ratio preference for compact layouts
- **3-Gate Validation**: Main breaker, Branch breakers, Accessories all required

### Technology Stack
- **Framework**: Fastify with TypeScript
- **Database**: SQLite with Prisma ORM
- **Validation**: Zod schemas
- **Testing**: Vitest
- **Documentation**: Swagger/OpenAPI

## Project Structure

```
src/
├── lib/
│   ├── validators.ts         # Zod schemas for all API requests/responses
│   ├── size-tables.ts        # CSV parser and dimension lookup
│   ├── brand-rules.ts        # Brand validation and 3-gate checks
│   ├── enclosure-rules.ts    # Size calculation algorithms
│   ├── evidence.ts           # Evidence package generation
│   └── errors.ts             # KIS-specific error handling
├── services/
│   ├── estimate.service.ts   # Core estimation business logic
│   ├── calendar.service.ts   # Calendar and event management
│   ├── email.service.ts      # Email grouping and threading
│   ├── drawing.service.ts    # Drawing version control
│   └── settings.service.ts   # System configuration (singleton)
├── routes/
│   ├── estimate.ts           # Estimation API endpoints
│   ├── calendar.ts           # Calendar API endpoints
│   ├── email.ts              # Email API endpoints
│   ├── drawing.ts            # Drawing API endpoints
│   └── settings.ts           # Settings API endpoints
├── data/
│   ├── KIS_Enclosure_Rules.md                    # CEO knowledge rules
│   ├── LS_Metasol_MCCB_dimensions_by_AF_and_poles.csv
│   └── Sangdo_MCCB_dimensions_by_AF_model_poles.csv
├── app.ts                    # Fastify application setup
├── index.ts                  # Server entry point
└── config.ts                 # Environment configuration
```

## Key Features

### 1. Validation Schemas (`src/lib/validators.ts`)
- **Enums**: Brand, Form, Location, Mount, DeviceType, Poles
- **Request/Response**: EstimateRequest, EstimateResponse, EnclosureResult
- **Evidence**: EvidenceSchema with tables and rules references
- **ABSTAIN**: AbstainSchema for knowledge gap tracking
- **All Modules**: Calendar, Email, Drawing, Settings schemas

### 2. Size Tables Engine (`src/lib/size-tables.ts`)
- **CSV Loading**: Auto-parse LS_Metasol and Sangdo dimension files
- **Memory Cache**: In-memory storage for fast lookups
- **getSize()**: Main lookup function with ELCB mapping (SBS→SES, SBE→SEE)
- **Availability Checks**: getAvailableModels, getAvailableAFs, getAvailablePoles
- **Hot Reload**: reloadSizeTables() for runtime updates

### 3. Brand Rules Engine (`src/lib/brand-rules.ts`)
- **Single Brand Validation**: Prevent SANGDO/LS mixing
- **3-Gate Validation**: Main + Branches + Accessories completeness
- **Device Type Matching**: MCCB vs ELCB series validation
- **Poles Verification**: Model-poles compatibility checking
- **Economic Default**: Form validation with drawing analysis hooks

### 4. Enclosure Rules Engine (`src/lib/enclosure-rules.ts`)
- **Layout Algorithm**: Economic vs Standard form calculations
- **Sorting Logic**: Frame size → Poles count → Quantity prioritization
- **Size Calculation**: W/H/D with proper margins and tolerances
- **Mixed Brand Support**: Validation for allowMixedBrand settings
- **Row Management**: Intelligent wrap and height calculations

### 5. Evidence Service (`src/lib/evidence.ts`)
- **Rules Documentation**: Links to specific KIS_Enclosure_Rules.md sections
- **Table References**: Exact CSV rows used in calculations
- **Brand Policy**: Single-brand or explicit MIXED documentation
- **Request Snapshot**: Normalized and sanitized input capture
- **Version Tracking**: Knowledge base version stamps

### 6. Estimate Service (`src/services/estimate.service.ts`)
- **Complete Validation**: All rule engines + data verification
- **Size Calculation**: Enclosure dimension computation
- **Evidence Generation**: Auto-create audit trail packages
- **ABSTAIN Management**: Missing data queue with specific questions
- **Audit Logging**: Complete operation tracking

## API Endpoints

### Estimation
- `POST /v1/estimate/validate` - Input validation with detailed error reporting
- `POST /v1/estimate/create` - Full estimation with enclosure calculations
- `GET /v1/estimate/:id` - Retrieve estimate with evidence
- `GET /v1/estimate/:id/evidence` - Evidence package access
- `GET /v1/estimate/abstain` - ABSTAIN queue for knowledge gaps

### Calendar Management
- `GET/POST/PUT/DELETE /v1/calendar` - Event CRUD operations
- `GET /v1/calendar/export/ics` - ICS file generation
- `GET /v1/calendar/summary/:year/:month` - Monthly statistics

### Email Management
- `GET/POST/PUT/DELETE /v1/email/groups` - Email group management
- `GET/POST/PUT/DELETE /v1/email/threads` - Thread management
- `GET /v1/email/stats` - Email statistics and auto-classification

### Drawing Management
- `GET/POST/PUT/DELETE /v1/drawings` - Drawing CRUD with name+rev uniqueness
- `GET /v1/drawings/by-name/:name/revisions` - Version history
- `POST/DELETE /v1/drawings/:id/links/estimates/:estimateId` - Cross-linking

### Settings Management
- `GET/PUT /v1/settings` - System configuration (singleton)
- `GET/PUT /v1/settings/rules` - Business rule configuration
- `GET/PUT /v1/settings/knowledge-version` - Knowledge base versioning

## Error Handling

### KIS-Specific Error Codes
- `REQ_MORE_INFO` - Missing required input fields
- `NEED_KNOWLEDGE_UPDATE` - CEO knowledge gap requiring update
- `BRAND_CONFLICT` - Single brand principle violation
- `POLES_MISMATCH` - Model-poles incompatibility
- `DEVICE_TYPE_MISMATCH` - MCCB/ELCB series mismatch
- `GATE_MISSING` - 3-gate validation failure

### ABSTAIN System
When knowledge is insufficient, the system:
1. Creates failed estimate with detailed question
2. Adds to ABSTAIN queue with specific request path
3. Returns 422 with exact information needed
4. Tracks resolution for knowledge base updates

## Database Schema

### Core Tables
- **Setting** - Singleton system configuration
- **Estimate** - Estimation requests and results
- **Evidence** - Audit trail and evidence packages
- **Abstain** - Knowledge gap tracking queue

### Supporting Tables
- **CalendarEvent** - Schedule management with conflict detection
- **EmailGroup/EmailThread** - Email organization and auto-classification
- **Drawing** - Version-controlled drawing management
- **AuditLog** - Complete system operation logging
- **KnowledgeTable** - CSV metadata and checksums

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
   # Edit .env with your configuration
   ```

4. **Development Server**
   ```bash
   npm run dev
   ```

5. **Testing**
   ```bash
   npm test
   npm run test:ui
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

3. **Start Production Server**
   ```bash
   npm start
   ```

## Knowledge Base Updates

The system supports runtime knowledge updates:

1. **CSV Updates**: Upload new dimension files → `reloadSizeTables()`
2. **Rules Updates**: Modify KIS_Enclosure_Rules.md → Update knowledge version
3. **ABSTAIN Resolution**: Process queue → Update tables → Mark resolved

## Monitoring and Health

- **Health Check**: `GET /health` - System status and size table info
- **API Info**: `GET /info` - Version and knowledge base status
- **Swagger Docs**: `GET /docs` - Complete API documentation

## Security Considerations

- **Input Validation**: Zod schemas for all endpoints
- **Error Sanitization**: No sensitive data in error responses
- **Evidence Integrity**: Immutable audit trails
- **Knowledge Verification**: CEO-only data sources

## Performance Optimization

- **In-Memory Cache**: Size tables loaded on startup
- **Efficient Lookups**: Optimized search algorithms
- **Minimal Database**: SQLite for fast local operations
- **Parallel Processing**: Concurrent validation where possible

---

**Contact**: KARA PROJECT Team
**License**: Proprietary
**Version**: 1.0.0