# Supabase Migrations

This directory contains database migrations for the KIS project.

## Migration Files (Placeholders)

Future migrations will include:
- `001_initial_schema.sql` - Base tables for KIS system
- `002_auth_tables.sql` - Authentication and authorization
- `003_evidence_tables.sql` - Evidence tracking system
- `004_mcp_gateway_logs.sql` - MCP Gateway activity logs

## Running Migrations

```bash
# Apply migrations
supabase migration up

# Create new migration
supabase migration new <migration_name>

# Reset database
supabase db reset
```

## Schema Overview

```sql
-- Example schema (to be implemented)
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payload JSONB,
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id),
    artifact_type VARCHAR(20),
    path TEXT,
    sha256 VARCHAR(64),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```