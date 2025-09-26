-- Schema snapshot
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    customer_company TEXT NOT NULL,
    customer_contact TEXT NOT NULL,
    customer_email TEXT,
    enclosure_type TEXT NOT NULL,
    enclosure_material TEXT NOT NULL,
    main_breaker_type TEXT NOT NULL,
    main_breaker_poles TEXT NOT NULL,
    main_breaker_capacity TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    dedup_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
