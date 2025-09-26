CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    customer_info JSONB NOT NULL,
    enclosure_info JSONB NOT NULL,
    main_breaker_info JSONB NOT NULL,
    branch_breakers JSONB NOT NULL,
    accessories JSONB NOT NULL,
    dedup_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS estimates (
    id UUID PRIMARY KEY,
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    currency TEXT NOT NULL,
    subtotal NUMERIC NOT NULL,
    tax NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    items JSONB NOT NULL,
    risk_score NUMERIC,
    dedup_key TEXT,
    evidence_bundle_id UUID,
    meta JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS breaker_settings (
    id INTEGER PRIMARY KEY,
    main_brand TEXT NOT NULL,
    branch_brand TEXT NOT NULL,
    accessory_brand TEXT NOT NULL,
    updated_by TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_packs (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    rule TEXT NOT NULL,
    counter_examples JSONB NOT NULL,
    tests JSONB NOT NULL,
    hash TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_by TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS policy_agreements (
    id UUID PRIMARY KEY,
    plan_id UUID NOT NULL,
    approvers JSONB NOT NULL,
    locked BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    signed_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID PRIMARY KEY,
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    risk_note TEXT NOT NULL,
    approvers JSONB NOT NULL,
    status TEXT NOT NULL,
    due_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_queue_cards (
    id UUID PRIMARY KEY,
    quote_id UUID,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    gate_pass_probability NUMERIC,
    cost_toggle_used BOOLEAN NOT NULL DEFAULT FALSE,
    evidence_bundle_id UUID,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_bundles (
    id UUID PRIMARY KEY,
    quote_id UUID,
    items JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS file_analysis_jobs (
    id UUID PRIMARY KEY,
    quote_id UUID,
    status TEXT NOT NULL,
    file_names JSONB NOT NULL,
    auto_fill_payload JSONB,
    evidence_bundle_id UUID,
    messages JSONB NOT NULL,
    errors JSONB NOT NULL,
    dedup_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS file_guard_audits (
    id UUID PRIMARY KEY,
    action TEXT NOT NULL,
    path TEXT NOT NULL,
    allowed BOOLEAN NOT NULL,
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS mail_sessions (
    id UUID PRIMARY KEY,
    message_id TEXT NOT NULL,
    quote_id UUID,
    session_id UUID NOT NULL,
    metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS mail_drafts (
    id UUID PRIMARY KEY,
    quote_id UUID NOT NULL,
    session_id UUID,
    mjml TEXT NOT NULL,
    warnings JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS quote_revisions (
    id UUID PRIMARY KEY,
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    summary TEXT,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);