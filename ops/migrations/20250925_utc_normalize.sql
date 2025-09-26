-- 20250925_utc_normalize.sql
-- Purpose: normalize existing timestamp columns to UTC aware values.
-- NOTE: execute in a controlled maintenance window after taking verified backups.

BEGIN;

-- Example: convert quotes timestamps assuming legacy Asia/Seoul naive storage.
-- UPDATE quotes
--    SET created_at = (created_at AT TIME ZONE ''Asia/Seoul'') AT TIME ZONE ''UTC'',
--        updated_at = (updated_at AT TIME ZONE ''Asia/Seoul'') AT TIME ZONE ''UTC''
--  WHERE created_at::TEXT NOT LIKE ''%+'' OR updated_at::TEXT NOT LIKE ''%+'';

-- TODO: replicate conversion for all tables with TIMESTAMPTZ columns (estimates, approvals, etc.).
-- Capture affected row counts in deployment runbooks.

-- Post-conversion audit: ensure all timestamps emit Z suffix.
-- SELECT id, created_at FROM quotes WHERE to_char(created_at, ''TZ'') <> ''UTC'';

COMMIT;
