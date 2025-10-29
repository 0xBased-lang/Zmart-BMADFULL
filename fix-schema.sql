-- BMAD-Zmart Schema Fix
-- Story 4.8: Fix missing columns for dashboard and betting
-- Date: 2025-10-28

-- ============================================================================
-- FIX MARKETS TABLE
-- ============================================================================

-- Add missing columns to markets table
ALTER TABLE markets
  ADD COLUMN IF NOT EXISTS outcome TEXT,
  ADD COLUMN IF NOT EXISTS yes_pool NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS no_pool NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

-- Copy winning_outcome to outcome for backwards compatibility
UPDATE markets SET outcome = winning_outcome WHERE outcome IS NULL;

-- Set default end_date (30 days from creation for active markets)
UPDATE markets
SET end_date = created_at + INTERVAL '30 days'
WHERE end_date IS NULL AND status = 'active';

-- Set resolved_at for resolved markets
UPDATE markets
SET resolved_at = created_at + INTERVAL '7 days'
WHERE resolved_at IS NULL AND status = 'resolved';

-- Initialize pool values based on total_volume
UPDATE markets
SET
  yes_pool = total_volume / 2,
  no_pool = total_volume / 2
WHERE yes_pool = 0 AND no_pool = 0 AND total_volume > 0;

-- ============================================================================
-- FIX BETS TABLE
-- ============================================================================

-- Add missing columns to bets table
ALTER TABLE bets
  ADD COLUMN IF NOT EXISTS shares NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS claimed BOOLEAN DEFAULT FALSE;

-- Calculate shares based on amount (1:1 ratio for now)
UPDATE bets SET shares = amount WHERE shares = 0;

-- ============================================================================
-- ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for end_date queries
CREATE INDEX IF NOT EXISTS idx_markets_end_date ON markets(end_date) WHERE end_date IS NOT NULL;

-- Index for outcome queries
CREATE INDEX IF NOT EXISTS idx_markets_outcome ON markets(outcome) WHERE outcome IS NOT NULL;

-- Index for pool queries
CREATE INDEX IF NOT EXISTS idx_markets_pools ON markets(yes_pool, no_pool);

-- Index for claimed status
CREATE INDEX IF NOT EXISTS idx_bets_claimed ON bets(claimed) WHERE NOT claimed;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show updated schema
SELECT
  'Markets columns:' as info,
  COUNT(column_name) as column_count
FROM information_schema.columns
WHERE table_name = 'markets';

SELECT
  'Bets columns:' as info,
  COUNT(column_name) as column_count
FROM information_schema.columns
WHERE table_name = 'bets';

-- Show sample data
SELECT
  'Sample market data:' as info,
  id,
  question,
  status,
  outcome,
  yes_pool,
  no_pool,
  end_date
FROM markets LIMIT 1;

SELECT
  'Sample bet data:' as info,
  id,
  outcome,
  amount,
  shares,
  claimed
FROM bets LIMIT 1;
