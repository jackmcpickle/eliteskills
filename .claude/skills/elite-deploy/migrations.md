# Database Migration Patterns

## Contents
- Expand-contract pattern
- Forward-only migrations
- Data backfills
- Migration ordering
- Lock management
- Large table migrations
- Multi-service migrations
- Testing migrations

## Expand-Contract Pattern

The safest way to change schemas without downtime. Three phases:

### Phase 1: Expand (additive only)
Add new columns, tables, or indexes. Don't remove or rename anything. Both old and new code work with this schema.

```sql
-- Add new column (nullable, no default required)
ALTER TABLE users ADD COLUMN display_name TEXT;
```

Deploy code that writes to BOTH old and new columns.

### Phase 2: Migrate
Backfill data from old structure to new structure.

```sql
-- Backfill: copy name → display_name where missing
UPDATE users SET display_name = name WHERE display_name IS NULL;
```

Deploy code that reads from new column only.

### Phase 3: Contract (remove old)
Once all code reads from new structure, remove old columns.

```sql
-- Only after all code uses display_name
ALTER TABLE users DROP COLUMN name;
```

**Key rule:** Each phase is a separate deploy. Never combine expand and contract in the same release.

## Forward-Only Migrations

Don't write rollback SQL. It's almost never correct.

**Why rollback migrations are dangerous:**
- Data loss: `DROP COLUMN` loses data, rollback can't restore it
- Irreversible transforms: data conversion is one-way
- Concurrent state: new data written during migration breaks rollback assumptions

**Instead, use compensating migrations:**
```
# Instead of rolling back "add column X":
# Write a new forward migration: "remove column X"

# Instead of rolling back "rename A → B":
# Write a new forward migration: "rename B → A"
```

**For emergencies:** Restore from backup, don't reverse migrations.

## Data Backfills

Large data migrations that populate new columns or tables.

### Batch Processing
Never update all rows in one transaction. Process in batches.

```
-- Batch update pattern
UPDATE users
SET display_name = name
WHERE display_name IS NULL
  AND id > $last_processed_id
ORDER BY id
LIMIT 1000;
```

### Idempotency
Backfills must be safe to re-run. Use `WHERE new_column IS NULL` or track processed IDs.

### Progress Tracking
For large backfills, log progress so you can resume after failures.

```
-- Track in a migration_progress table
INSERT INTO migration_progress (migration_name, last_id, rows_processed, updated_at)
VALUES ('backfill_display_name', 50000, 50000, NOW())
ON CONFLICT (migration_name)
DO UPDATE SET last_id = 50000, rows_processed = 50000, updated_at = NOW();
```

### Throttling
Don't saturate the database. Add delays between batches in production.

```
for each batch:
  process_batch()
  sleep(100ms)  # let the DB breathe
```

## Migration Ordering

When to run migrations relative to code deploys.

### Additive Changes (expand phase)
**Run migration BEFORE code deploy.** New columns exist but old code ignores them. Safe.

```
Timeline: migration → deploy code → verify
```

### Destructive Changes (contract phase)
**Run migration AFTER code deploy.** Code no longer uses old columns. Safe to remove.

```
Timeline: deploy code → verify no usage → migration
```

### Column Rename
Never rename directly. Use expand-contract:
1. Add new column (migration before deploy)
2. Deploy code that writes both, reads new
3. Backfill old → new
4. Deploy code that only uses new
5. Drop old column (migration after deploy)

## Lock Management

Prevent concurrent migrations from corrupting state.

### Advisory Locks
Take a lock before running migrations. Release after completion.

```sql
-- Take advisory lock (specific to your DB)
SELECT pg_advisory_lock(12345);
-- Run migrations
-- Release lock
SELECT pg_advisory_unlock(12345);
```

### Migration Table
Track which migrations have run. Standard pattern across all migration tools.

```sql
CREATE TABLE migrations (
  id TEXT PRIMARY KEY,           -- migration filename or ID
  applied_at TIMESTAMP NOT NULL,
  checksum TEXT                  -- detect modified migrations
);
```

**Never modify an applied migration.** If you need to change something, write a new migration.

## Large Table Migrations

Schema changes on tables with millions+ rows.

### The Problem
`ALTER TABLE` on large tables can lock the table for minutes or hours. This causes downtime.

### Online DDL / Ghost Tables
Pattern used by tools like `pt-online-schema-change` and `gh-ost`:

1. Create a new table with the desired schema
2. Copy data in batches from old to new
3. Capture changes during copy (triggers or binlog)
4. Swap table names atomically

```
users → users_old  (rename)
users_new → users  (rename)
```

### Non-Blocking Index Creation
Most databases support creating indexes without locking writes:

```sql
-- Create index without blocking (Postgres)
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- SQLite: not possible — plan for brief downtime or use a new table
```

### Chunked Column Addition
For databases where `ADD COLUMN` is expensive:
1. Create new table with extra column
2. Batch-copy from old table
3. Swap

## Multi-Service Migrations

When multiple services share a database (or need coordinated schema changes).

### Shared Database Pattern
If services share a DB, one service "owns" the schema. Others consume via views or defined interfaces.

```
Service A (owner): runs migrations, defines schema
Service B (consumer): reads via views or API, never writes DDL
```

### API Versioning Pattern
If services communicate via APIs, use API versioning to handle schema changes:

1. Service A deploys new API version (v2) alongside old (v1)
2. Service B migrates to v2
3. Service A removes v1

### Coordination
- Use a migration runbook for changes spanning services
- Deploy in order: schema → owner service → consumer services
- Have a rollback plan for each step

## Testing Migrations

### Against Production Clone
The gold standard. Clone production database, run migrations against the clone.

```
1. Snapshot production DB
2. Restore to test environment
3. Run pending migrations
4. Verify: schema correct, data intact, queries work
5. Measure: how long did it take? Any locks?
```

### In CI
Run migrations against a seeded test database on every PR that touches migration files.

```
# CI step
create-test-db
apply-all-migrations
run-seed-data
run-migration-tests
```

### Data Integrity Checks
After migration, verify data consistency:

```sql
-- No nulls where there shouldn't be
SELECT COUNT(*) FROM users WHERE display_name IS NULL AND name IS NOT NULL;

-- Row counts match expectations
SELECT COUNT(*) FROM users;  -- should match pre-migration count

-- Foreign keys still valid
SELECT COUNT(*) FROM orders o
  LEFT JOIN users u ON o.user_id = u.id
  WHERE u.id IS NULL;  -- should be 0
```
