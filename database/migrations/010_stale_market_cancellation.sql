-- BMAD-Zmart Database Migration 010
-- Migration: Stale Market Auto-Cancellation Support
-- Created: 2025-10-26
-- Story: 2.9 - Implement Stale Market Auto-Cancellation
-- Description: Add columns for market cancellation tracking and audit log table

-- ============================================================================
-- Part 1: Extend Markets Table for Cancellation Tracking
-- ============================================================================

-- Add cancellation tracking columns to markets table
ALTER TABLE markets
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add index for cancelled markets queries
CREATE INDEX IF NOT EXISTS idx_markets_cancelled_at ON markets(cancelled_at) WHERE cancelled_at IS NOT NULL;

-- ============================================================================
-- Part 2: Stale Market Cancellations Audit Log
-- ============================================================================

CREATE TABLE IF NOT EXISTS stale_market_cancellations (
    id BIGSERIAL PRIMARY KEY,
    market_id BIGINT NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    cancelled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    threshold_days INTEGER NOT NULL,
    bet_count INTEGER NOT NULL,
    total_refunded BIGINT NOT NULL,

    -- Foreign key to markets table
    CONSTRAINT fk_stale_market FOREIGN KEY (market_id) REFERENCES markets(market_id) ON DELETE CASCADE
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_stale_cancellations_market ON stale_market_cancellations(market_id);
CREATE INDEX IF NOT EXISTS idx_stale_cancellations_date ON stale_market_cancellations(cancelled_at DESC);

-- ============================================================================
-- Part 3: Helper Function to Identify Stale Markets
-- ============================================================================

CREATE OR REPLACE FUNCTION get_stale_markets(p_threshold_days INTEGER)
RETURNS TABLE (
    market_id BIGINT,
    title TEXT,
    end_date TIMESTAMPTZ,
    days_since_end NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.market_id,
        m.title,
        m.end_date,
        EXTRACT(EPOCH FROM (NOW() - m.end_date)) / 86400 AS days_since_end
    FROM markets m
    WHERE m.status = 'ENDED'
      AND m.end_date + (p_threshold_days || ' days')::INTERVAL < NOW()
      AND m.cancelled_at IS NULL
    ORDER BY m.end_date ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Part 4: Comments and Documentation
-- ============================================================================

COMMENT ON COLUMN markets.cancelled_at IS
'Timestamp when market was cancelled due to staleness or other reasons';

COMMENT ON COLUMN markets.cancellation_reason IS
'Reason for market cancellation (e.g., "Stale market - no resolution after 30 days")';

COMMENT ON TABLE stale_market_cancellations IS
'Audit log for all stale market auto-cancellations. Provides transparency and compliance trail for cancelled markets.';

COMMENT ON FUNCTION get_stale_markets(INTEGER) IS
'Returns all markets that have been ENDED for longer than threshold_days and have not been cancelled yet. Used by check-stale-markets cron job.';

-- ============================================================================
-- Part 5: Validation
-- ============================================================================

DO $$
BEGIN
    -- Verify cancelled_at column exists
    ASSERT (SELECT COUNT(*) FROM information_schema.columns
            WHERE table_name = 'markets' AND column_name = 'cancelled_at') = 1,
        'markets.cancelled_at column not created';

    -- Verify cancellation_reason column exists
    ASSERT (SELECT COUNT(*) FROM information_schema.columns
            WHERE table_name = 'markets' AND column_name = 'cancellation_reason') = 1,
        'markets.cancellation_reason column not created';

    -- Verify stale_market_cancellations table exists
    ASSERT (SELECT COUNT(*) FROM information_schema.tables
            WHERE table_name = 'stale_market_cancellations') = 1,
        'stale_market_cancellations table not created';

    -- Verify get_stale_markets function exists
    ASSERT (SELECT COUNT(*) FROM pg_proc WHERE proname = 'get_stale_markets') = 1,
        'get_stale_markets function not created';

    RAISE NOTICE 'Migration 010: Stale Market Auto-Cancellation Support - SUCCESS';
END $$;
