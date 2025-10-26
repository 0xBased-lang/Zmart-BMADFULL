# BMAD-Zmart Database Setup

**PostgreSQL + Supabase for sub-100ms queries**

## Overview

This directory contains SQL migration scripts for the BMAD-Zmart prediction markets database, designed for deployment on Supabase.

## Quick Start

1. **Create Supabase Project**: https://supabase.com/dashboard/projects
2. **Run Migrations**: Execute SQL files in order
3. **Test Connection**: Verify with sample queries
4. **Configure Environment**: Add connection string to `.env`

## Database Architecture

### Tables

- `users` - User profiles and statistics
- `markets` - Prediction markets (synced from Solana)
- `bets` - Individual bets (synced from Solana)
- `proposals` - Market creation proposals
- `proposal_votes` - Votes on proposals
- `resolution_votes` - Votes on market outcomes
- `activity_points` - User activity tracking
- `event_log` - On-chain event synchronization

### Performance

- **Indexes**: 30+ indexes on critical columns
- **Full-text search**: GiN indexes on titles/descriptions
- **Views**: Pre-computed aggregations for leaderboards
- **Target**: <100ms query response time

## Setup Instructions

### 1. Create Supabase Project

```bash
# Go to: https://supabase.com/dashboard
# Click: "New Project"
# Name: "bmad-zmart"
# Region: Choose closest to users
# Database Password: Generate strong password
```

### 2. Run Migrations

```bash
# In Supabase Dashboard:
# 1. Go to "SQL Editor"
# 2. Run migrations in order:

# Migration 001: Initial Schema
# Paste contents of: database/migrations/001_initial_schema.sql
# Click: "Run"

# Migration 002: RLS Policies
# Paste contents of: database/migrations/002_rls_policies.sql
# Click: "Run"
```

### 3. Verify Setup

```sql
-- Check tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### 4. Test Queries

```sql
-- Insert test user
INSERT INTO users (wallet_address, username)
VALUES ('4MkybTASDtmzQnfUWztHmfgyHgBREw74eTKipVADqQLA', 'TestUser');

-- Insert test market
INSERT INTO markets (market_id, creator_wallet, title, description, end_date, category)
VALUES (1, '4MkybTASDtmzQnfUWztHmfgyHgBREw74eTKipVADqQLA',
        'Will Bitcoin hit $100K in 2025?',
        'Market resolves YES if BTC reaches $100,000 USD',
        NOW() + INTERVAL '30 days',
        'Crypto');

-- Test full-text search
SELECT market_id, title, category
FROM markets
WHERE to_tsvector('english', title || ' ' || description) @@ to_tsquery('english', 'Bitcoin');

-- Test active markets view
SELECT * FROM active_markets_with_odds LIMIT 10;
```

### 5. Configure Environment

```bash
# Get connection details from Supabase Dashboard:
# Settings > Database > Connection String

# Add to .env:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres
```

## Migration Management

### Adding New Migrations

```bash
# Create new migration file
touch database/migrations/003_your_migration_name.sql

# Follow naming convention:
# {number}_{description}.sql

# Always include:
# - Header comment with description
# - Rollback instructions if applicable
# - Indexes for new columns
# - RLS policies if adding tables
```

### Rollback Strategy

```sql
-- To rollback migration 002:
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
-- ... drop all policies from 002

-- To rollback migration 001:
DROP VIEW IF EXISTS market_statistics;
DROP VIEW IF EXISTS user_leaderboard;
DROP VIEW IF EXISTS active_markets_with_odds;
DROP TABLE IF EXISTS event_log CASCADE;
DROP TABLE IF EXISTS activity_points CASCADE;
-- ... drop all tables in reverse order
```

## Performance Optimization

### Query Optimization Tips

```sql
-- Use indexes for filtering
EXPLAIN ANALYZE
SELECT * FROM markets WHERE status = 'ACTIVE'; -- Uses idx_markets_status

-- Use prepared statements to cache query plans
PREPARE get_market AS SELECT * FROM markets WHERE market_id = $1;
EXECUTE get_market(1);

-- Use materialized views for expensive aggregations
CREATE MATERIALIZED VIEW market_stats_cached AS
SELECT * FROM market_statistics;
REFRESH MATERIALIZED VIEW market_stats_cached;
```

### Monitoring

```sql
-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- Find slow queries (in Supabase Dashboard > Database > Query Performance)
```

## Security

### RLS Policies Summary

- **Public Read**: All tables allow SELECT without authentication
- **Authenticated Write**: Users must be logged in to INSERT/UPDATE
- **Service Role**: Full access for backend event synchronization
- **Immutable**: Votes cannot be updated/deleted after insertion

### Best Practices

1. **Never expose `service_role` key** in frontend
2. **Use `anon` key** for public reads
3. **Use `authenticated` context** for user actions
4. **Validate on-chain** before database sync
5. **Rate limit** API calls to prevent abuse

## Troubleshooting

### Common Issues

**Issue**: RLS blocking queries
```sql
-- Temporarily disable for debugging (DEV ONLY!)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- Remember to re-enable!
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

**Issue**: Index not being used
```sql
-- Force index usage
SET enable_seqscan = OFF;
-- Check query plan
EXPLAIN ANALYZE SELECT ...;
```

**Issue**: Slow full-text search
```sql
-- Rebuild GiN index
REINDEX INDEX idx_markets_combined_search;
```

## Next Steps

- **Story 1.9**: Implement event listener for Solana → Database sync
- **Story 1.11**: Build frontend with Supabase Realtime subscriptions
- **Epic 2**: Add analytics tables and materialized views

## Support

- Supabase Docs: https://supabase.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Full-text Search: https://www.postgresql.org/docs/current/textsearch.html
