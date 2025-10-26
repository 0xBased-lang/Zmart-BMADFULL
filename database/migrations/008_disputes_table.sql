-- BMAD-Zmart Database Migration 008
-- Migration: Disputes Table and Market Dispute Status
-- Created: 2025-10-26
-- Story: 2.6 - Implement Dispute Flagging Mechanism
-- Description: Create disputes table for flagging market resolutions during 48-hour dispute window

-- ============================================================================
-- Part 1: Extend Markets Table Status for Disputed Markets
-- ============================================================================

-- Add UNDER_REVIEW status to markets table
-- Current statuses (from migration 006): ACTIVE, VOTING, DISPUTE_WINDOW, RESOLVED, CANCELLED
-- Adding: UNDER_REVIEW (when market has been disputed)

ALTER TABLE markets
DROP CONSTRAINT IF EXISTS market_status_check;

ALTER TABLE markets
ADD CONSTRAINT market_status_check
CHECK (status IN ('ACTIVE', 'VOTING', 'DISPUTE_WINDOW', 'UNDER_REVIEW', 'RESOLVED', 'CANCELLED'));

-- Note: dispute_window_end column already exists from migration 006
-- Verify it exists for reference
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM information_schema.columns
            WHERE table_name = 'markets' AND column_name = 'dispute_window_end') = 1,
        'markets.dispute_window_end column not found (should exist from migration 006)';
END $$;

-- ============================================================================
-- Part 2: Create Disputes Table
-- ============================================================================
-- Purpose: Store dispute records for markets flagged during 48-hour dispute window
-- Pattern: Off-chain storage for gas-free dispute submission (follows Epic 2 pattern)

CREATE TABLE IF NOT EXISTS disputes (
    -- Primary key
    id BIGSERIAL PRIMARY KEY,

    -- Reference to market (from PostgreSQL)
    market_id BIGINT NOT NULL REFERENCES markets(market_id) ON DELETE CASCADE,

    -- Disputer information
    disputer_wallet TEXT NOT NULL,

    -- Dispute details
    reason_text TEXT NOT NULL,
    evidence_links TEXT[], -- Array of URLs for evidence

    -- Timestamps
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Dispute status
    status TEXT NOT NULL DEFAULT 'pending', -- pending, reviewed, resolved

    -- Admin review
    admin_notes TEXT,

    -- Constraints
    CONSTRAINT disputes_market_disputer_unique UNIQUE (market_id, disputer_wallet),
    CONSTRAINT disputes_status_check CHECK (status IN ('pending', 'reviewed', 'resolved')),
    CONSTRAINT disputes_reason_not_empty CHECK (LENGTH(reason_text) > 0),
    CONSTRAINT disputes_wallet_valid CHECK (LENGTH(disputer_wallet) BETWEEN 32 AND 44)
);

-- ============================================================================
-- Part 3: Create Indexes for Disputes Table
-- ============================================================================

-- Index for fetching all disputes for a market (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_disputes_market_id ON disputes(market_id);

-- Index for filtering disputes by status
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

-- Index for sorting disputes by timestamp (most recent first)
CREATE INDEX IF NOT EXISTS idx_disputes_timestamp ON disputes(timestamp DESC);

-- Index for pending disputes (admin queue)
CREATE INDEX IF NOT EXISTS idx_disputes_pending ON disputes(status) WHERE status = 'pending';

-- Composite index for market + status queries
CREATE INDEX IF NOT EXISTS idx_disputes_market_status ON disputes(market_id, status);

-- ============================================================================
-- Part 4: Helper Functions for Dispute Management
-- ============================================================================

-- Function: Get all disputes for a market
CREATE OR REPLACE FUNCTION get_market_disputes(p_market_id BIGINT)
RETURNS TABLE (
    dispute_id BIGINT,
    disputer_wallet TEXT,
    reason_text TEXT,
    evidence_links TEXT[],
    timestamp TIMESTAMPTZ,
    status TEXT,
    admin_notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id AS dispute_id,
        d.disputer_wallet,
        d.reason_text,
        d.evidence_links,
        d.timestamp,
        d.status,
        d.admin_notes
    FROM disputes d
    WHERE d.market_id = p_market_id
    ORDER BY d.timestamp DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Count disputes for a market
CREATE OR REPLACE FUNCTION count_market_disputes(p_market_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    dispute_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO dispute_count
    FROM disputes
    WHERE market_id = p_market_id;

    RETURN dispute_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Check if user has already disputed a market
CREATE OR REPLACE FUNCTION has_user_disputed_market(
    p_market_id BIGINT,
    p_disputer_wallet TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM disputes
        WHERE market_id = p_market_id
          AND disputer_wallet = p_disputer_wallet
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get markets with pending disputes (admin dashboard)
CREATE OR REPLACE FUNCTION get_disputed_markets()
RETURNS TABLE (
    market_id BIGINT,
    market_title TEXT,
    dispute_count BIGINT,
    first_dispute_at TIMESTAMPTZ,
    latest_dispute_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.market_id,
        m.title AS market_title,
        COUNT(d.id) AS dispute_count,
        MIN(d.timestamp) AS first_dispute_at,
        MAX(d.timestamp) AS latest_dispute_at
    FROM markets m
    INNER JOIN disputes d ON d.market_id = m.market_id
    WHERE d.status = 'pending'
    GROUP BY m.market_id, m.title
    ORDER BY dispute_count DESC, latest_dispute_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Part 5: Dispute Window Validation Function
-- ============================================================================

-- Function: Check if market is within 48-hour dispute window
CREATE OR REPLACE FUNCTION is_market_disputable(p_market_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
    v_dispute_window_end TIMESTAMPTZ;
    v_market_status TEXT;
BEGIN
    -- Get market's dispute window end and status
    SELECT dispute_window_end, status
    INTO v_dispute_window_end, v_market_status
    FROM markets
    WHERE market_id = p_market_id;

    -- Market must exist
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Market must be in DISPUTE_WINDOW status
    IF v_market_status != 'DISPUTE_WINDOW' THEN
        RETURN FALSE;
    END IF;

    -- Dispute window end must not be null
    IF v_dispute_window_end IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Must be within dispute window (not expired)
    RETURN v_dispute_window_end > NOW();
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Part 6: Row Level Security (RLS) for Disputes Table
-- ============================================================================

-- Enable RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read disputes (public transparency)
CREATE POLICY disputes_read_policy ON disputes
    FOR SELECT
    USING (true);

-- Policy: Only service role can insert disputes (via Edge Function)
CREATE POLICY disputes_insert_policy ON disputes
    FOR INSERT
    WITH CHECK (false); -- Only service role can insert (via flag-dispute Edge Function)

-- Policy: Only service role can update disputes (admin review)
CREATE POLICY disputes_update_policy ON disputes
    FOR UPDATE
    USING (false); -- Only service role can update (via admin override in Story 2.7)

-- Policy: No deletes allowed (permanent record)
CREATE POLICY disputes_delete_policy ON disputes
    FOR DELETE
    USING (false);

-- ============================================================================
-- Part 7: Comments and Documentation
-- ============================================================================

COMMENT ON TABLE disputes IS
'Stores dispute records for markets flagged during 48-hour dispute window. Off-chain storage for gas-free dispute submission.';

COMMENT ON COLUMN disputes.market_id IS
'Reference to disputed market (foreign key to markets table)';

COMMENT ON COLUMN disputes.disputer_wallet IS
'Solana wallet address of user filing the dispute';

COMMENT ON COLUMN disputes.reason_text IS
'User-provided reason for disputing the market resolution';

COMMENT ON COLUMN disputes.evidence_links IS
'Array of URLs pointing to evidence supporting the dispute';

COMMENT ON COLUMN disputes.status IS
'Dispute status: pending (awaiting admin review), reviewed (admin has reviewed), resolved (outcome changed or dispute rejected)';

COMMENT ON COLUMN disputes.admin_notes IS
'Admin notes from reviewing the dispute (Story 2.7 - Admin Override)';

COMMENT ON FUNCTION get_market_disputes(BIGINT) IS
'Returns all disputes for a specific market, ordered by timestamp (newest first)';

COMMENT ON FUNCTION count_market_disputes(BIGINT) IS
'Returns total number of disputes filed for a market';

COMMENT ON FUNCTION has_user_disputed_market(BIGINT, TEXT) IS
'Checks if a specific user has already filed a dispute for a market';

COMMENT ON FUNCTION get_disputed_markets() IS
'Returns all markets with pending disputes, ordered by dispute count. Used by admin dashboard (Story 2.7).';

COMMENT ON FUNCTION is_market_disputable(BIGINT) IS
'Validates if a market is within the 48-hour dispute window and accepts disputes. Checks: market exists, status = DISPUTE_WINDOW, dispute_window_end > NOW()';

-- ============================================================================
-- Part 8: Validation and Verification
-- ============================================================================

DO $$
BEGIN
    -- Verify markets table has UNDER_REVIEW status
    ASSERT (SELECT COUNT(*) FROM pg_constraint WHERE conname = 'market_status_check') = 1,
        'Market status constraint not found';

    -- Verify disputes table exists
    ASSERT (SELECT COUNT(*) FROM information_schema.tables
            WHERE table_name = 'disputes') = 1,
        'disputes table not created';

    -- Verify indexes exist
    ASSERT (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'disputes') >= 5,
        'disputes table indexes not created';

    -- Verify unique constraint exists
    ASSERT (SELECT COUNT(*) FROM pg_constraint
            WHERE conname = 'disputes_market_disputer_unique') = 1,
        'disputes unique constraint not found';

    -- Verify helper functions exist
    ASSERT (SELECT COUNT(*) FROM pg_proc WHERE proname = 'get_market_disputes') = 1,
        'get_market_disputes function not created';

    ASSERT (SELECT COUNT(*) FROM pg_proc WHERE proname = 'is_market_disputable') = 1,
        'is_market_disputable function not created';

    RAISE NOTICE 'Migration 008: Disputes Table and Market Dispute Status - SUCCESS';
END $$;
