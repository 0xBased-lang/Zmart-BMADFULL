-- BMAD-Zmart Database Performance Testing
-- Purpose: Validate <100ms query performance target
-- Created: 2025-10-24

-- ============================================================================
-- Setup: Generate Test Data
-- ============================================================================

-- Generate test users
INSERT INTO users (wallet, total_earned, markets_created, bets_placed, bets_won)
SELECT
    'test_wallet_' || generate_series AS wallet,
    random() * 1000000 AS total_earned,
    floor(random() * 10)::INT AS markets_created,
    floor(random() * 100)::INT AS bets_placed,
    floor(random() * 50)::INT AS bets_won
FROM generate_series(1, 1000);

-- Generate test markets
INSERT INTO markets (market_id, creator, title, description, category, end_date, status, yes_pool, no_pool, total_bets)
SELECT
    'test_market_' || generate_series AS market_id,
    'test_wallet_' || (1 + floor(random() * 1000))::INT AS creator,
    'Test Market ' || generate_series AS title,
    'This is a test market for performance testing' AS description,
    (ARRAY['crypto', 'politics', 'sports', 'entertainment'])[1 + floor(random() * 4)] AS category,
    NOW() + (random() * interval '90 days') AS end_date,
    (ARRAY['active', 'active', 'active', 'resolved'])[1 + floor(random() * 4)] AS status,
    floor(random() * 10000000000)::BIGINT AS yes_pool,
    floor(random() * 10000000000)::BIGINT AS no_pool,
    floor(random() * 1000)::INT AS total_bets
FROM generate_series(1, 10000);

-- Generate test bets
INSERT INTO bets (bet_id, market_id, user_wallet, position, amount, shares, timestamp)
SELECT
    'test_bet_' || generate_series AS bet_id,
    'test_market_' || (1 + floor(random() * 10000))::INT AS market_id,
    'test_wallet_' || (1 + floor(random() * 1000))::INT AS user_wallet,
    (ARRAY['yes', 'no'])[1 + floor(random() * 2)] AS position,
    floor(1000000 + random() * 100000000)::BIGINT AS amount,
    floor(900000 + random() * 95000000)::BIGINT AS shares,
    NOW() - (random() * interval '30 days') AS timestamp
FROM generate_series(1, 50000);

ANALYZE users;
ANALYZE markets;
ANALYZE bets;

-- ============================================================================
-- Performance Test Suite
-- ============================================================================

-- Test 1: Market Listing (Most Common Query)
\timing on
EXPLAIN ANALYZE
SELECT
    market_id,
    title,
    category,
    status,
    yes_pool,
    no_pool,
    total_bets,
    end_date
FROM markets
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 20;
\timing off

-- Expected: <10ms with idx_markets_status_created

-- Test 2: Market Search (Full-Text)
\timing on
EXPLAIN ANALYZE
SELECT
    market_id,
    title,
    description,
    ts_rank(to_tsvector('english', title || ' ' || description), to_tsquery('english', 'crypto'))
FROM markets
WHERE to_tsvector('english', title || ' ' || description) @@ to_tsquery('english', 'crypto')
ORDER BY ts_rank(to_tsvector('english', title || ' ' || description), to_tsquery('english', 'crypto')) DESC
LIMIT 10;
\timing off

-- Expected: <50ms with idx_markets_title_desc_gin

-- Test 3: User Bet History
\timing on
EXPLAIN ANALYZE
SELECT
    b.bet_id,
    b.market_id,
    m.title,
    b.position,
    b.amount,
    b.timestamp
FROM bets b
JOIN markets m ON b.market_id = m.market_id
WHERE b.user_wallet = 'test_wallet_500'
ORDER BY b.timestamp DESC
LIMIT 50;
\timing off

-- Expected: <20ms with idx_bets_user_wallet

-- Test 4: Market Detail with Stats
\timing on
EXPLAIN ANALYZE
SELECT
    m.*,
    COUNT(b.bet_id) AS total_bets_verified,
    SUM(CASE WHEN b.position = 'yes' THEN b.amount ELSE 0 END) AS yes_pool_verified,
    SUM(CASE WHEN b.position = 'no' THEN b.amount ELSE 0 END) AS no_pool_verified
FROM markets m
LEFT JOIN bets b ON m.market_id = b.market_id
WHERE m.market_id = 'test_market_5000'
GROUP BY m.market_id;
\timing off

-- Expected: <50ms with idx_bets_market_id

-- Test 5: Leaderboard Query
\timing on
EXPLAIN ANALYZE
SELECT * FROM get_leaderboard(100);
\timing off

-- Expected: <100ms for top 100 users

-- Test 6: Category Aggregation
\timing on
EXPLAIN ANALYZE
SELECT
    category,
    COUNT(*) AS market_count,
    SUM(yes_pool + no_pool) AS total_volume,
    AVG(total_bets) AS avg_bets_per_market
FROM markets
WHERE status = 'active'
GROUP BY category
ORDER BY total_volume DESC;
\timing off

-- Expected: <30ms with idx_markets_category

-- Test 7: Recent Activity Feed
\timing on
EXPLAIN ANALYZE
SELECT
    b.bet_id,
    b.user_wallet,
    b.market_id,
    m.title,
    b.position,
    b.amount,
    b.timestamp
FROM bets b
JOIN markets m ON b.market_id = m.market_id
WHERE b.timestamp > NOW() - INTERVAL '24 hours'
ORDER BY b.timestamp DESC
LIMIT 100;
\timing off

-- Expected: <50ms with idx_bets_timestamp

-- Test 8: User Stats Aggregation
\timing on
EXPLAIN ANALYZE
SELECT
    u.wallet,
    u.total_points,
    COUNT(DISTINCT b.market_id) AS markets_participated,
    SUM(b.amount) AS total_wagered,
    COUNT(b.bet_id) AS total_bets
FROM users u
LEFT JOIN bets b ON u.wallet = b.user_wallet
WHERE u.wallet = 'test_wallet_250'
GROUP BY u.wallet, u.total_points;
\timing off

-- Expected: <30ms with idx_bets_user_wallet

-- ============================================================================
-- Performance Summary
-- ============================================================================

-- Query all test results
SELECT
    'Market Listing' AS query_name,
    '<10ms' AS target,
    'Most common query' AS importance
UNION ALL
SELECT 'Market Search', '<50ms', 'High importance'
UNION ALL
SELECT 'User Bet History', '<20ms', 'High importance'
UNION ALL
SELECT 'Market Detail', '<50ms', 'Medium importance'
UNION ALL
SELECT 'Leaderboard', '<100ms', 'Medium importance'
UNION ALL
SELECT 'Category Aggregation', '<30ms', 'Low importance'
UNION ALL
SELECT 'Recent Activity', '<50ms', 'Medium importance'
UNION ALL
SELECT 'User Stats', '<30ms', 'Medium importance';

-- ============================================================================
-- Index Usage Report
-- ============================================================================

SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- ============================================================================
-- Table Statistics
-- ============================================================================

SELECT
    schemaname,
    tablename,
    n_live_tup AS row_count,
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public';

-- ============================================================================
-- Cleanup Test Data (Optional)
-- ============================================================================

/*
-- Uncomment to remove test data:

DELETE FROM bets WHERE bet_id LIKE 'test_%';
DELETE FROM markets WHERE market_id LIKE 'test_%';
DELETE FROM users WHERE wallet LIKE 'test_%';

VACUUM ANALYZE users;
VACUUM ANALYZE markets;
VACUUM ANALYZE bets;
*/

-- ============================================================================
-- Performance Recommendations
-- ============================================================================

/*
Based on test results:

1. If any query exceeds target:
   - Check EXPLAIN ANALYZE output for sequential scans
   - Verify appropriate indexes are being used
   - Consider adding composite indexes for common filters

2. Index optimization:
   - Monitor idx_scan for unused indexes
   - Remove indexes with 0 scans after 1 week
   - Add indexes for queries with high seq_scans

3. Vacuum and analyze:
   - Run VACUUM ANALYZE weekly
   - Monitor bloat with pg_stat_user_tables
   - Set autovacuum_naptime = 60s for high-write tables

4. Connection pooling:
   - Use Supabase connection pooling (enabled by default)
   - Set max_connections appropriately
   - Monitor active connections with pg_stat_activity

5. Query optimization:
   - Use materialized views for complex aggregations
   - Implement caching layer for frequently accessed data
   - Consider partitioning for tables >1M rows
*/
