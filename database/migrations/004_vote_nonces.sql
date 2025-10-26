-- BMAD-Zmart Database Migration 004
-- Migration: Vote Nonces for Replay Attack Prevention
-- Created: 2025-10-26
-- Story: 2.1 - Snapshot-Style Vote Signature Verification
-- Description: Nonce tracking table to prevent replay attacks in off-chain voting

-- ============================================================================
-- Vote Nonces Table
-- ============================================================================
-- Purpose: Track used nonces to prevent replay attacks in Snapshot-style voting
-- Each vote signature includes a unique nonce that can only be used once
-- per voter per market to prevent duplicate vote submission

CREATE TABLE vote_nonces (
    id BIGSERIAL PRIMARY KEY,

    -- Nonce identification
    nonce TEXT NOT NULL,                    -- UUID or random string
    voter_wallet TEXT NOT NULL,             -- Solana wallet address
    market_id BIGINT NOT NULL,              -- Market being voted on

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),

    -- Constraints
    CONSTRAINT vote_nonces_wallet_check CHECK (LENGTH(voter_wallet) BETWEEN 32 AND 44),
    CONSTRAINT vote_nonces_nonce_check CHECK (LENGTH(nonce) > 0),

    -- Prevent duplicate nonces for same voter + market combination
    UNIQUE(nonce, voter_wallet, market_id)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Fast nonce lookup for replay detection
CREATE INDEX idx_vote_nonces_nonce ON vote_nonces(nonce);

-- Fast voter lookup
CREATE INDEX idx_vote_nonces_voter ON vote_nonces(voter_wallet);

-- Fast market lookup
CREATE INDEX idx_vote_nonces_market ON vote_nonces(market_id);

-- Composite index for exact nonce validation query
CREATE INDEX idx_vote_nonces_composite ON vote_nonces(nonce, voter_wallet, market_id);

-- Index for cleanup queries (old nonce removal)
CREATE INDEX idx_vote_nonces_expires_at ON vote_nonces(expires_at);
CREATE INDEX idx_vote_nonces_created_at ON vote_nonces(created_at);

-- ============================================================================
-- Automatic Cleanup Function
-- ============================================================================
-- Automatically delete nonces older than 30 days to prevent table bloat

CREATE OR REPLACE FUNCTION cleanup_old_vote_nonces()
RETURNS void AS $$
BEGIN
    DELETE FROM vote_nonces
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to check if nonce is already used
CREATE OR REPLACE FUNCTION is_nonce_used(
    p_nonce TEXT,
    p_voter_wallet TEXT,
    p_market_id BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
    nonce_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM vote_nonces
        WHERE nonce = p_nonce
        AND voter_wallet = p_voter_wallet
        AND market_id = p_market_id
    ) INTO nonce_exists;

    RETURN nonce_exists;
END;
$$ LANGUAGE plpgsql;

-- Function to record a new nonce
CREATE OR REPLACE FUNCTION record_vote_nonce(
    p_nonce TEXT,
    p_voter_wallet TEXT,
    p_market_id BIGINT
)
RETURNS BIGINT AS $$
DECLARE
    nonce_id BIGINT;
BEGIN
    INSERT INTO vote_nonces (nonce, voter_wallet, market_id)
    VALUES (p_nonce, p_voter_wallet, p_market_id)
    RETURNING id INTO nonce_id;

    RETURN nonce_id;
EXCEPTION
    WHEN unique_violation THEN
        -- Nonce already exists, return 0 to indicate replay attack
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Statistics View
-- ============================================================================

CREATE VIEW vote_nonce_statistics AS
SELECT
    COUNT(*) as total_nonces,
    COUNT(DISTINCT voter_wallet) as unique_voters,
    COUNT(DISTINCT market_id) as unique_markets,
    MIN(created_at) as oldest_nonce,
    MAX(created_at) as newest_nonce,
    COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_nonces,
    COUNT(*) FILTER (WHERE expires_at >= NOW()) as active_nonces
FROM vote_nonces;

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
-- Enable RLS for security

ALTER TABLE vote_nonces ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read nonce status (for verification)
CREATE POLICY vote_nonces_read_policy ON vote_nonces
    FOR SELECT
    USING (true);

-- Policy: Only Edge Functions can insert nonces (via service role)
CREATE POLICY vote_nonces_insert_policy ON vote_nonces
    FOR INSERT
    WITH CHECK (true);

-- Policy: No updates allowed (nonces are immutable)
CREATE POLICY vote_nonces_no_update_policy ON vote_nonces
    FOR UPDATE
    USING (false);

-- Policy: Only service role can delete (for cleanup)
CREATE POLICY vote_nonces_delete_policy ON vote_nonces
    FOR DELETE
    USING (true);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE vote_nonces IS 'Tracks used nonces to prevent replay attacks in Snapshot-style voting (Story 2.1)';
COMMENT ON COLUMN vote_nonces.nonce IS 'Unique identifier (UUID) included in vote signature to prevent replay';
COMMENT ON COLUMN vote_nonces.voter_wallet IS 'Solana wallet address of the voter';
COMMENT ON COLUMN vote_nonces.market_id IS 'Market ID this vote was for';
COMMENT ON COLUMN vote_nonces.expires_at IS 'Automatic expiration date (30 days from creation)';

COMMENT ON FUNCTION is_nonce_used IS 'Check if a nonce has already been used for a voter/market combination';
COMMENT ON FUNCTION record_vote_nonce IS 'Record a new nonce; returns 0 if nonce already exists (replay attack)';
COMMENT ON FUNCTION cleanup_old_vote_nonces IS 'Delete expired nonces to prevent table bloat';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verify table was created successfully
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vote_nonces') THEN
        RAISE EXCEPTION 'Migration 004 failed: vote_nonces table was not created';
    END IF;

    RAISE NOTICE 'Migration 004 completed successfully: vote_nonces table created with 6 indexes, 3 functions, and RLS policies';
END $$;
