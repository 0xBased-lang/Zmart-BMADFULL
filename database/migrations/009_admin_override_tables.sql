-- BMAD-Zmart Database Migration 009
-- Migration: Admin Override Tables
-- Created: 2025-10-26
-- Story: 2.7 - Implement Admin Override for Disputed Markets
-- Description: Create admin_wallets table for authorization and admin_override_log for audit trail

-- ============================================================================
-- Part 1: Admin Wallets Table (Authorization Whitelist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_wallets (
    wallet_address TEXT PRIMARY KEY,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    added_by TEXT, -- Admin wallet that added this admin
    notes TEXT, -- Optional notes about this admin

    -- Constraints
    CONSTRAINT admin_wallet_valid CHECK (LENGTH(wallet_address) BETWEEN 32 AND 44)
);

-- Index for admin lookup (primary key already provides this)
-- No additional indexes needed for simple whitelist lookup

-- ============================================================================
-- Part 2: Admin Override Log Table (Audit Trail)
-- ============================================================================
-- Purpose: Log all admin override attempts for security audit and compliance

CREATE TABLE IF NOT EXISTS admin_override_log (
    id BIGSERIAL PRIMARY KEY,
    market_id BIGINT NOT NULL,
    admin_wallet TEXT NOT NULL,
    new_outcome TEXT NOT NULL, -- YES, NO, CANCELLED
    override_reason TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    result TEXT NOT NULL, -- Success, Unauthorized, Error message
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT override_log_outcome_check CHECK (new_outcome IN ('YES', 'NO', 'CANCELLED')),
    CONSTRAINT override_log_wallet_valid CHECK (LENGTH(admin_wallet) BETWEEN 32 AND 44)
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_override_log_market ON admin_override_log(market_id);
CREATE INDEX IF NOT EXISTS idx_override_log_admin ON admin_override_log(admin_wallet);
CREATE INDEX IF NOT EXISTS idx_override_log_timestamp ON admin_override_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_override_log_success ON admin_override_log(success);

-- ============================================================================
-- Part 3: Helper Functions for Admin Management
-- ============================================================================

-- Function: Check if wallet is authorized admin
CREATE OR REPLACE FUNCTION is_admin(p_wallet TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_wallets
        WHERE wallet_address = p_wallet
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get all admin override attempts for a market
CREATE OR REPLACE FUNCTION get_market_override_log(p_market_id BIGINT)
RETURNS TABLE (
    attempt_id BIGINT,
    admin_wallet TEXT,
    new_outcome TEXT,
    override_reason TEXT,
    success BOOLEAN,
    result TEXT,
    attempt_time TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        aol.id AS attempt_id,
        aol.admin_wallet,
        aol.new_outcome,
        aol.override_reason,
        aol.success,
        aol.result,
        aol.timestamp AS attempt_time
    FROM admin_override_log aol
    WHERE aol.market_id = p_market_id
    ORDER BY aol.timestamp DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get admin activity log (all overrides by an admin)
CREATE OR REPLACE FUNCTION get_admin_activity(p_admin_wallet TEXT)
RETURNS TABLE (
    market_id BIGINT,
    new_outcome TEXT,
    override_reason TEXT,
    success BOOLEAN,
    result TEXT,
    attempt_time TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        aol.market_id,
        aol.new_outcome,
        aol.override_reason,
        aol.success,
        aol.result,
        aol.timestamp AS attempt_time
    FROM admin_override_log aol
    WHERE aol.admin_wallet = p_admin_wallet
    ORDER BY aol.timestamp DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Part 4: Row Level Security (RLS) for Admin Tables
-- ============================================================================

-- Enable RLS on admin_wallets
ALTER TABLE admin_wallets ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read admin list (transparency)
CREATE POLICY admin_wallets_read_policy ON admin_wallets
    FOR SELECT
    USING (true);

-- Policy: Only service role can insert/update/delete (via Edge Function or migration)
CREATE POLICY admin_wallets_insert_policy ON admin_wallets
    FOR INSERT
    WITH CHECK (false); -- Only service role

CREATE POLICY admin_wallets_update_policy ON admin_wallets
    FOR UPDATE
    USING (false); -- Only service role

CREATE POLICY admin_wallets_delete_policy ON admin_wallets
    FOR DELETE
    USING (false); -- Only service role

-- Enable RLS on admin_override_log
ALTER TABLE admin_override_log ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read override log (transparency and audit)
CREATE POLICY admin_override_log_read_policy ON admin_override_log
    FOR SELECT
    USING (true);

-- Policy: Only service role can insert (via Edge Function)
CREATE POLICY admin_override_log_insert_policy ON admin_override_log
    FOR INSERT
    WITH CHECK (false); -- Only service role

-- Policy: No updates or deletes (immutable audit log)
CREATE POLICY admin_override_log_update_policy ON admin_override_log
    FOR UPDATE
    USING (false);

CREATE POLICY admin_override_log_delete_policy ON admin_override_log
    FOR DELETE
    USING (false);

-- ============================================================================
-- Part 5: Seed Initial Admin (Optional - for MVP setup)
-- ============================================================================

-- Insert a placeholder admin wallet for MVP testing
-- IMPORTANT: Replace this with actual admin wallet address before deploying
-- This is commented out by default - uncomment and set real wallet for production

-- INSERT INTO admin_wallets (wallet_address, added_by, notes)
-- VALUES (
--   'REPLACE_WITH_ACTUAL_ADMIN_WALLET',
--   'system',
--   'Initial admin wallet for MVP - added via migration 009'
-- );

-- ============================================================================
-- Part 6: Comments and Documentation
-- ============================================================================

COMMENT ON TABLE admin_wallets IS
'Whitelist of authorized admin wallets. Only wallets in this table can override market outcomes.';

COMMENT ON COLUMN admin_wallets.wallet_address IS
'Solana wallet address of authorized admin (32-44 characters)';

COMMENT ON COLUMN admin_wallets.added_by IS
'Wallet address of admin who added this entry (or "system" for initial setup)';

COMMENT ON TABLE admin_override_log IS
'Immutable audit log of all admin override attempts (successful and failed). Critical for security and compliance.';

COMMENT ON COLUMN admin_override_log.success IS
'Whether the override attempt succeeded (true) or failed (false - unauthorized, validation error, etc.)';

COMMENT ON COLUMN admin_override_log.result IS
'Outcome of the attempt: "Success", "Unauthorized", or error message';

COMMENT ON FUNCTION is_admin(TEXT) IS
'Checks if a given wallet address is authorized as an admin. Returns true if wallet is in admin_wallets table.';

COMMENT ON FUNCTION get_market_override_log(BIGINT) IS
'Returns all admin override attempts for a specific market, ordered by most recent first. Used for audit and transparency.';

COMMENT ON FUNCTION get_admin_activity(TEXT) IS
'Returns all override attempts by a specific admin, ordered by most recent first. Used for admin activity monitoring.';

-- ============================================================================
-- Part 7: Validation and Verification
-- ============================================================================

DO $$
BEGIN
    -- Verify admin_wallets table exists
    ASSERT (SELECT COUNT(*) FROM information_schema.tables
            WHERE table_name = 'admin_wallets') = 1,
        'admin_wallets table not created';

    -- Verify admin_override_log table exists
    ASSERT (SELECT COUNT(*) FROM information_schema.tables
            WHERE table_name = 'admin_override_log') = 1,
        'admin_override_log table not created';

    -- Verify indexes exist
    ASSERT (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'admin_override_log') >= 4,
        'admin_override_log indexes not created';

    -- Verify helper functions exist
    ASSERT (SELECT COUNT(*) FROM pg_proc WHERE proname = 'is_admin') = 1,
        'is_admin function not created';

    ASSERT (SELECT COUNT(*) FROM pg_proc WHERE proname = 'get_market_override_log') = 1,
        'get_market_override_log function not created';

    ASSERT (SELECT COUNT(*) FROM pg_proc WHERE proname = 'get_admin_activity') = 1,
        'get_admin_activity function not created';

    RAISE NOTICE 'Migration 009: Admin Override Tables - SUCCESS';
END $$;
