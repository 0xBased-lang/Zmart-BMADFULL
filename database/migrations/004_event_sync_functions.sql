-- BMAD-Zmart Event Sync Helper Functions
-- Migration 004: Database functions for event listener
-- Created: 2025-10-24
-- Description: Helper functions used by Supabase Edge Function for event sync

-- ============================================================================
-- Pool Increment Function
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_market_pool(
    p_market_id TEXT,
    p_pool_field TEXT,
    p_amount BIGINT
) RETURNS VOID AS $$
BEGIN
    IF p_pool_field = 'yes_pool' THEN
        UPDATE markets
        SET
            yes_pool = yes_pool + p_amount,
            total_bets = total_bets + 1
        WHERE market_id = p_market_id;
    ELSIF p_pool_field = 'no_pool' THEN
        UPDATE markets
        SET
            no_pool = no_pool + p_amount,
            total_bets = total_bets + 1
        WHERE market_id = p_market_id;
    ELSE
        RAISE EXCEPTION 'Invalid pool_field: %', p_pool_field;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- User Stats Update Function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_stats(
    p_wallet TEXT,
    p_fees_earned BIGINT DEFAULT 0,
    p_markets_created INT DEFAULT 0,
    p_bets_placed INT DEFAULT 0,
    p_bets_won INT DEFAULT 0
) RETURNS VOID AS $$
BEGIN
    -- Ensure user exists
    INSERT INTO users (wallet, total_earned, markets_created, bets_placed, bets_won)
    VALUES (p_wallet, 0, 0, 0, 0)
    ON CONFLICT (wallet) DO NOTHING;

    -- Update stats
    UPDATE users
    SET
        total_earned = total_earned + p_fees_earned,
        markets_created = markets_created + p_markets_created,
        bets_placed = bets_placed + p_bets_placed,
        bets_won = bets_won + p_bets_won
    WHERE wallet = p_wallet;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Idempotency Check Function
-- ============================================================================

CREATE OR REPLACE FUNCTION check_event_processed(
    p_signature TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM event_log
        WHERE signature = p_signature
        AND success = true
    ) INTO v_exists;

    RETURN v_exists;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Bulk User Creation (for new bettors)
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_user_exists(
    p_wallet TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO users (wallet, total_earned, markets_created, bets_placed, bets_won)
    VALUES (p_wallet, 0, 0, 0, 0)
    ON CONFLICT (wallet) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Market Statistics Aggregation
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_market_stats(
    p_market_id TEXT
) RETURNS VOID AS $$
DECLARE
    v_yes_pool BIGINT;
    v_no_pool BIGINT;
    v_total_bets INT;
BEGIN
    -- Recalculate pools and bet count from bets table
    SELECT
        COALESCE(SUM(CASE WHEN position = 'yes' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN position = 'no' THEN amount ELSE 0 END), 0),
        COUNT(*)
    INTO v_yes_pool, v_no_pool, v_total_bets
    FROM bets
    WHERE market_id = p_market_id;

    -- Update market
    UPDATE markets
    SET
        yes_pool = v_yes_pool,
        no_pool = v_no_pool,
        total_bets = v_total_bets
    WHERE market_id = p_market_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Reconciliation: Find Missing Events
-- ============================================================================

CREATE OR REPLACE FUNCTION find_missing_events(
    p_start_slot BIGINT,
    p_end_slot BIGINT
) RETURNS TABLE (
    slot BIGINT,
    signature TEXT,
    program_id TEXT,
    event_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.slot,
        e.signature,
        e.program_id,
        e.event_type
    FROM event_log e
    WHERE e.slot BETWEEN p_start_slot AND p_end_slot
    AND e.success = false
    ORDER BY e.slot ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION increment_market_pool TO service_role;
GRANT EXECUTE ON FUNCTION update_user_stats TO service_role;
GRANT EXECUTE ON FUNCTION check_event_processed TO service_role;
GRANT EXECUTE ON FUNCTION ensure_user_exists TO service_role;
GRANT EXECUTE ON FUNCTION refresh_market_stats TO service_role;
GRANT EXECUTE ON FUNCTION find_missing_events TO service_role;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Index on event_log for idempotency checks
CREATE INDEX IF NOT EXISTS idx_event_log_signature_success
ON event_log (signature, success);

-- Index on event_log for slot-based queries
CREATE INDEX IF NOT EXISTS idx_event_log_slot
ON event_log (slot);

-- Index on event_log for program-based queries
CREATE INDEX IF NOT EXISTS idx_event_log_program
ON event_log (program_id, slot);
