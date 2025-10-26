-- Migration 012: Creator Fees Table
-- Story 2.11: Implement Creator Fee Claims
-- Created: 2025-10-26

-- ============================================================
-- Creator Fees Table
-- ============================================================
-- Tracks accumulated creator fees per market with bond tier information
-- Fees accumulate during betting (place_bet) and can be claimed after resolution

CREATE TABLE IF NOT EXISTS creator_fees (
  id BIGSERIAL PRIMARY KEY,

  -- Market and Creator Information
  market_id BIGINT NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  creator_wallet TEXT NOT NULL,

  -- Bond Tier Information (determines fee percentage)
  bond_tier TEXT NOT NULL CHECK (bond_tier IN ('LOW', 'MEDIUM', 'HIGH')),
  bond_amount BIGINT NOT NULL, -- Stored for audit/display purposes

  -- Fee Accumulation
  accumulated_fees BIGINT NOT NULL DEFAULT 0, -- Total fees accumulated in lamports

  -- Claim Status
  claimed BOOLEAN NOT NULL DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  claimed_amount BIGINT, -- Amount claimed (for audit trail)

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_market_creator UNIQUE (market_id, creator_wallet),
  CONSTRAINT positive_fees CHECK (accumulated_fees >= 0),
  CONSTRAINT positive_bond CHECK (bond_amount > 0),
  CONSTRAINT claimed_amount_valid CHECK (
    (claimed = FALSE AND claimed_at IS NULL AND claimed_amount IS NULL) OR
    (claimed = TRUE AND claimed_at IS NOT NULL AND claimed_amount IS NOT NULL AND claimed_amount > 0)
  )
);

-- ============================================================
-- Indexes for Query Performance
-- ============================================================

-- Index for looking up creator fees by market
CREATE INDEX IF NOT EXISTS idx_creator_fees_market
ON creator_fees(market_id);

-- Index for looking up all fees for a creator
CREATE INDEX IF NOT EXISTS idx_creator_fees_creator
ON creator_fees(creator_wallet);

-- Index for unclaimed fees queries
CREATE INDEX IF NOT EXISTS idx_creator_fees_unclaimed
ON creator_fees(claimed)
WHERE claimed = FALSE;

-- Composite index for creator + unclaimed fees
CREATE INDEX IF NOT EXISTS idx_creator_fees_creator_unclaimed
ON creator_fees(creator_wallet, claimed)
WHERE claimed = FALSE;

-- Index for fee amount queries (top earners, analytics)
CREATE INDEX IF NOT EXISTS idx_creator_fees_amount
ON creator_fees(accumulated_fees DESC);

-- ============================================================
-- Updated At Trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_creator_fees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_creator_fees_updated_at
  BEFORE UPDATE ON creator_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_creator_fees_updated_at();

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

ALTER TABLE creator_fees ENABLE ROW LEVEL SECURITY;

-- Policy 1: Creators can view their own fee records
CREATE POLICY creator_fees_select_own
ON creator_fees
FOR SELECT
USING (creator_wallet = current_user);

-- Policy 2: System can insert fee records (for Event Listener)
CREATE POLICY creator_fees_insert_system
ON creator_fees
FOR INSERT
WITH CHECK (true); -- Event Listener uses service role

-- Policy 3: System can update fee records (for accumulation and claims)
CREATE POLICY creator_fees_update_system
ON creator_fees
FOR UPDATE
USING (true); -- Event Listener uses service role

-- Policy 4: Public can view aggregated statistics (read-only)
-- This allows leaderboards and analytics without exposing individual creator data
CREATE POLICY creator_fees_select_public_stats
ON creator_fees
FOR SELECT
USING (true); -- Will be filtered by application layer for privacy

-- ============================================================
-- Comments for Documentation
-- ============================================================

COMMENT ON TABLE creator_fees IS 'Tracks accumulated creator fees per market based on bond tier. Fees accumulate from betting and can be claimed after market resolution.';

COMMENT ON COLUMN creator_fees.market_id IS 'Reference to the market (foreign key to markets.id)';
COMMENT ON COLUMN creator_fees.creator_wallet IS 'Creator wallet address (Solana public key)';
COMMENT ON COLUMN creator_fees.bond_tier IS 'Bond tier: LOW (<100 ZMart), MEDIUM (100-499 ZMart), HIGH (≥500 ZMart)';
COMMENT ON COLUMN creator_fees.bond_amount IS 'Actual bond amount in lamports (for audit and display)';
COMMENT ON COLUMN creator_fees.accumulated_fees IS 'Total accumulated fees in lamports from all bets placed on this market';
COMMENT ON COLUMN creator_fees.claimed IS 'Whether the fees have been claimed by the creator';
COMMENT ON COLUMN creator_fees.claimed_at IS 'Timestamp when fees were claimed';
COMMENT ON COLUMN creator_fees.claimed_amount IS 'Amount that was claimed (for audit trail, may differ from accumulated if partial claims allowed)';

-- ============================================================
-- Sample Query Examples (for reference)
-- ============================================================

-- Query 1: Get unclaimed fees for a creator
-- SELECT market_id, bond_tier, accumulated_fees
-- FROM creator_fees
-- WHERE creator_wallet = 'CREATOR_PUBKEY' AND claimed = FALSE;

-- Query 2: Get total unclaimed fees for a creator
-- SELECT SUM(accumulated_fees) as total_unclaimed
-- FROM creator_fees
-- WHERE creator_wallet = 'CREATOR_PUBKEY' AND claimed = FALSE;

-- Query 3: Get top earning creators (leaderboard)
-- SELECT creator_wallet, SUM(accumulated_fees) as total_earnings, COUNT(*) as market_count
-- FROM creator_fees
-- GROUP BY creator_wallet
-- ORDER BY total_earnings DESC
-- LIMIT 10;

-- Query 4: Get fees for a specific market
-- SELECT * FROM creator_fees WHERE market_id = 123;
