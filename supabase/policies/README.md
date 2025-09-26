# Supabase Row Level Security Policies

This directory contains RLS policies for the KIS project.

## Policy Files (Placeholders)

Future policies:
- `auth_policies.sql` - User authentication policies
- `job_policies.sql` - Job access control
- `artifact_policies.sql` - Artifact visibility rules

## Example Policies

```sql
-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own jobs
CREATE POLICY "Users can view own jobs"
ON jobs FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admins can view all jobs
CREATE POLICY "Admins view all jobs"
ON jobs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

## Best Practices

1. Always enable RLS on sensitive tables
2. Use `auth.uid()` for user identification
3. Test policies thoroughly in development
4. Document policy intentions clearly