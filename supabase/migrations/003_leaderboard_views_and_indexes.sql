-- Migration: Leaderboard Views and Indexes
-- Description: Create database views for efficient leaderboard calculations and add performance indexes
-- Story: 3.9 - Build Leaderboards and User Profiles
-- Date: 2025-10-28

-- ============================================================================
-- DATABASE VIEWS FOR LEADERBOARDS
-- ============================================================================

-- View: user_stats
-- Purpose: Aggregate user statistics for leaderboards
-- Includes: activity points, total bets, win rate, profit, volume
CREATE OR REPLACE VIEW user_stats AS
SELECT
  u.wallet_address,
  COALESCE(u.activity_points, 0) as activity_points,
  COUNT(DISTINCT b.id) as total_bets,
  COALESCE(
    SUM(CASE WHEN b.profit_loss > 0 THEN 1 ELSE 0 END)::float /
    NULLIF(COUNT(b.id), 0),
    0
  ) as win_rate,
  COALESCE(SUM(b.profit_loss), 0) as total_profit,
  COALESCE(SUM(b.amount), 0) as total_volume
FROM users u
LEFT JOIN bets b ON u.wallet_address = b.user_wallet
GROUP BY u.wallet_address, u.activity_points;

-- View: creator_stats
-- Purpose: Track market creation statistics
-- Includes: markets created, total volume, active/resolved counts
CREATE OR REPLACE VIEW creator_stats AS
SELECT
  creator_wallet,
  COUNT(*) as markets_created,
  COALESCE(SUM(total_volume), 0) as creator_total_volume,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_markets,
  SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_markets
FROM markets
WHERE creator_wallet IS NOT NULL
GROUP BY creator_wallet;

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Index: Activity Points (for Top by Points leaderboard)
-- Critical for points leaderboard sorting
CREATE INDEX IF NOT EXISTS idx_users_activity_points
ON users(activity_points DESC)
WHERE activity_points > 0;

-- Index: User Wallet in Bets (for profile queries)
-- Critical for fetching user's betting history
CREATE INDEX IF NOT EXISTS idx_bets_user_wallet
ON bets(user_wallet);

-- Index: Creator Wallet in Markets (for profile queries)
-- Critical for fetching user's created markets
CREATE INDEX IF NOT EXISTS idx_markets_creator_wallet
ON markets(creator_wallet)
WHERE creator_wallet IS NOT NULL;

-- Index: Bet Amount (for volume leaderboard - optional but helpful)
CREATE INDEX IF NOT EXISTS idx_bets_amount
ON bets(amount DESC)
WHERE amount > 0;

-- Index: Market Total Volume (for creator stats)
CREATE INDEX IF NOT EXISTS idx_markets_total_volume
ON markets(total_volume DESC)
WHERE total_volume > 0;

-- ============================================================================
-- QUERY PERFORMANCE TESTING
-- ============================================================================

-- Test Query 1: Top 100 by Activity Points
-- Expected: <100ms for 1000s of users
-- SELECT * FROM user_stats ORDER BY activity_points DESC LIMIT 100;

-- Test Query 2: Top 100 by Win Rate (min 10 bets)
-- Expected: <100ms for 1000s of users
-- SELECT * FROM user_stats WHERE total_bets >= 10 ORDER BY win_rate DESC LIMIT 100;

-- Test Query 3: Top 100 by Volume
-- Expected: <100ms for 1000s of users
-- SELECT * FROM user_stats ORDER BY total_volume DESC LIMIT 100;

-- Test Query 4: Top 100 Creators
-- Expected: <100ms for 100s of creators
-- SELECT * FROM creator_stats ORDER BY markets_created DESC LIMIT 100;

-- Test Query 5: User Profile Stats
-- Expected: <50ms for single user
-- SELECT * FROM user_stats WHERE wallet_address = 'user_wallet_address';

-- ============================================================================
-- NOTES FOR DEVELOPERS
-- ============================================================================

-- 1. Views are automatically updated when underlying tables change
-- 2. Indexes improve read performance but slightly slow writes
-- 3. Consider materialized views if performance is insufficient
-- 4. Monitor query execution time in Supabase dashboard
-- 5. Win rate calculation handles division by zero with NULLIF
-- 6. All COALESCE ensure no NULL values in aggregations

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================

-- DROP VIEW IF EXISTS user_stats CASCADE;
-- DROP VIEW IF EXISTS creator_stats CASCADE;
-- DROP INDEX IF EXISTS idx_users_activity_points;
-- DROP INDEX IF EXISTS idx_bets_user_wallet;
-- DROP INDEX IF EXISTS idx_markets_creator_wallet;
-- DROP INDEX IF EXISTS idx_bets_amount;
-- DROP INDEX IF EXISTS idx_markets_total_volume;
