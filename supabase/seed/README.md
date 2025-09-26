# Supabase Seed Data

This directory contains seed data for development and testing.

## Seed Files (Placeholders)

Future seed files:
- `users.sql` - Test users and roles
- `jobs.sql` - Sample job records
- `test_data.sql` - General test data

## Usage

```bash
# Run seed scripts
supabase db seed

# Custom seed file
psql $DATABASE_URL < seed/custom_seed.sql
```

## Sample Seed Data

```sql
-- Example seed data (to be implemented)
INSERT INTO users (email, role) VALUES
  ('admin@kis.local', 'admin'),
  ('operator@kis.local', 'operator'),
  ('viewer@kis.local', 'viewer');
```