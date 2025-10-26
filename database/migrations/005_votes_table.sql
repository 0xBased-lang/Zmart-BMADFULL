-- BMAD-Zmart Database Migration 005
-- Migration: Votes Table for Off-Chain Vote Storage
-- Created: 2025-10-26
-- Story: 2.2 - Vote Collection and Storage
-- Description: PostgreSQL table for storing Snapshot-style votes with aggregation support

-- ============================================================================
-- Votes Table
-- ============================================================================
-- Purpose: Store off-chain votes for markets using Snapshot-style voting
-- Each vote is cryptographically verified (Story 2.1) before storage
-- Votes are immutable (no updates/deletes) to preserve audit trail

CREATE TABLE votes (
    id BIGSERIAL PRIMARY KEY,

    -- Vote identification
    market_id BIGINT NOT NULL REFERENCES markets(market_id) ON DELETE CASCADE,
    voter_wallet TEXT NOT NULL,

    -- Vote content
    vote_choice TEXT NOT NULL,      -- 'YES' or 'NO'
    vote_weight BIGINT NOT NULL DEFAULT 1,

    -- Verification data (from Story 2.1)
    signature TEXT NOT NULL,        -- Base58-encoded Ed25519 signature
    nonce TEXT NOT NULL,            -- UUID used in signature (prevents replay)

    -- Metadata
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    vote_message JSONB,             -- Original signed message for audit trail

    -- Constraints
    CONSTRAINT votes_choice_check CHECK (vote_choice IN ('YES', 'NO')),
    CONSTRAINT votes_wallet_check CHECK (LENGTH(voter_wallet) BETWEEN 32 AND 44),
    CONSTRAINT votes_weight_positive CHECK (vote_weight > 0),
    CONSTRAINT votes_signature_not_empty CHECK (LENGTH(signature) > 0),
    CONSTRAINT votes_nonce_not_empty CHECK (LENGTH(nonce) > 0),

    -- Prevent double-voting: one vote per wallet per market
    UNIQUE(market_id, voter_wallet)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Fast market lookup (most common query)
CREATE INDEX idx_votes_market ON votes(market_id);

-- Fast voter lookup (user vote history)
CREATE INDEX idx_votes_voter ON votes(voter_wallet);

-- Fast vote choice filtering (for aggregation)
CREATE INDEX idx_votes_choice ON votes(vote_choice);

-- Fast timestamp sorting (recent votes)
CREATE INDEX idx_votes_timestamp ON votes(timestamp DESC);

-- Composite index for vote counting by market + choice
CREATE INDEX idx_votes_market_choice ON votes(market_id, vote_choice);

-- Composite index for vote aggregation with weight
CREATE INDEX idx_votes_market_weight ON votes(market_id, vote_choice, vote_weight);

-- Index for nonce lookup (reference to vote_nonces table)
CREATE INDEX idx_votes_nonce ON votes(nonce);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function: Get vote counts for a market
CREATE OR REPLACE FUNCTION get_vote_counts(p_market_id BIGINT)
RETURNS TABLE(
    yes_count BIGINT,
    no_count BIGINT,
    yes_weight BIGINT,
    no_weight BIGINT,
    total_votes BIGINT,
    total_weight BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE vote_choice = 'YES') as yes_count,
        COUNT(*) FILTER (WHERE vote_choice = 'NO') as no_count,
        COALESCE(SUM(vote_weight) FILTER (WHERE vote_choice = 'YES'), 0) as yes_weight,
        COALESCE(SUM(vote_weight) FILTER (WHERE vote_choice = 'NO'), 0) as no_weight,
        COUNT(*) as total_votes,
        COALESCE(SUM(vote_weight), 0) as total_weight
    FROM votes
    WHERE market_id = p_market_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Calculate vote weight for a voter
CREATE OR REPLACE FUNCTION calculate_vote_weight(
    p_voter_wallet TEXT,
    p_mode TEXT DEFAULT 'democratic'
)
RETURNS BIGINT AS $$
DECLARE
    user_points INTEGER;
BEGIN
    -- Democratic mode: everyone has weight = 1
    IF p_mode = 'democratic' THEN
        RETURN 1;
    END IF;

    -- Weighted mode: use activity points
    SELECT activity_points INTO user_points
    FROM users
    WHERE wallet_address = p_voter_wallet;

    -- Default to 1 if user not found or has 0 points
    IF user_points IS NULL OR user_points = 0 THEN
        RETURN 1;
    END IF;

    -- Return activity points as weight (minimum 1)
    RETURN GREATEST(1, user_points);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Check if user has voted on a market
CREATE OR REPLACE FUNCTION has_voted(
    p_market_id BIGINT,
    p_voter_wallet TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM votes
        WHERE market_id = p_market_id
        AND voter_wallet = p_voter_wallet
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get user's vote on a market
CREATE OR REPLACE FUNCTION get_user_vote(
    p_market_id BIGINT,
    p_voter_wallet TEXT
)
RETURNS TABLE(
    vote_choice TEXT,
    vote_weight BIGINT,
    timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT v.vote_choice, v.vote_weight, v.timestamp
    FROM votes v
    WHERE v.market_id = p_market_id
    AND v.voter_wallet = p_voter_wallet;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Views for Aggregation
-- ============================================================================

-- View: Market vote summary with participation rate
CREATE VIEW market_vote_summary AS
SELECT
    m.market_id,
    m.title,
    m.status,
    m.end_date,

    -- Vote counts
    COUNT(DISTINCT v.voter_wallet) as total_voters,
    COUNT(v.id) FILTER (WHERE v.vote_choice = 'YES') as yes_votes,
    COUNT(v.id) FILTER (WHERE v.vote_choice = 'NO') as no_votes,

    -- Vote weights
    COALESCE(SUM(v.vote_weight) FILTER (WHERE v.vote_choice = 'YES'), 0) as yes_weight,
    COALESCE(SUM(v.vote_weight) FILTER (WHERE v.vote_choice = 'NO'), 0) as no_weight,
    COALESCE(SUM(v.vote_weight), 0) as total_weight,

    -- Participation rate (voters / unique bettors)
    CASE
        WHEN m.unique_bettors = 0 THEN 0
        ELSE (COUNT(DISTINCT v.voter_wallet)::NUMERIC / m.unique_bettors * 100)
    END as participation_rate,

    -- Winning side (>50% of weight)
    CASE
        WHEN COALESCE(SUM(v.vote_weight) FILTER (WHERE v.vote_choice = 'YES'), 0) >
             COALESCE(SUM(v.vote_weight) FILTER (WHERE v.vote_choice = 'NO'), 0)
        THEN 'YES'
        WHEN COALESCE(SUM(v.vote_weight) FILTER (WHERE v.vote_choice = 'NO'), 0) >
             COALESCE(SUM(v.vote_weight) FILTER (WHERE v.vote_choice = 'YES'), 0)
        THEN 'NO'
        ELSE 'TIE'
    END as winning_side

FROM markets m
LEFT JOIN votes v ON m.market_id = v.market_id
GROUP BY m.market_id, m.title, m.status, m.end_date, m.unique_bettors;

-- View: Recent votes across all markets
CREATE VIEW recent_votes AS
SELECT
    v.id,
    v.market_id,
    m.title as market_title,
    v.voter_wallet,
    v.vote_choice,
    v.vote_weight,
    v.timestamp
FROM votes v
JOIN markets m ON v.market_id = m.market_id
ORDER BY v.timestamp DESC
LIMIT 100;

-- View: Voter participation history
CREATE VIEW voter_participation AS
SELECT
    v.voter_wallet,
    COUNT(DISTINCT v.market_id) as markets_voted,
    COUNT(v.id) FILTER (WHERE v.vote_choice = 'YES') as yes_votes,
    COUNT(v.id) FILTER (WHERE v.vote_choice = 'NO') as no_votes,
    SUM(v.vote_weight) as total_weight_cast,
    MIN(v.timestamp) as first_vote,
    MAX(v.timestamp) as last_vote
FROM votes v
GROUP BY v.voter_wallet;

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read votes (transparency)
CREATE POLICY votes_read_policy ON votes
    FOR SELECT
    USING (true);

-- Policy: Only Edge Functions can insert votes (via service role)
-- This prevents direct database inserts bypassing signature verification
CREATE POLICY votes_insert_policy ON votes
    FOR INSERT
    WITH CHECK (true);

-- Policy: No updates allowed (votes are immutable)
CREATE POLICY votes_no_update_policy ON votes
    FOR UPDATE
    USING (false);

-- Policy: No deletes allowed (preserve audit trail)
CREATE POLICY votes_no_delete_policy ON votes
    FOR DELETE
    USING (false);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Trigger: Update users.activity_points when vote is cast
CREATE OR REPLACE FUNCTION increment_vote_activity_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Add activity points for voting (configurable amount)
    INSERT INTO activity_points (user_wallet, activity_type, points, reference_id)
    VALUES (NEW.voter_wallet, 'VOTE_CAST', 10, NEW.market_id);

    -- Update user's total activity points
    UPDATE users
    SET activity_points = activity_points + 10
    WHERE wallet_address = NEW.voter_wallet;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vote_activity_trigger
    AFTER INSERT ON votes
    FOR EACH ROW
    EXECUTE FUNCTION increment_vote_activity_points();

-- ============================================================================
-- Statistics View
-- ============================================================================

CREATE VIEW vote_statistics AS
SELECT
    COUNT(*) as total_votes,
    COUNT(DISTINCT voter_wallet) as unique_voters,
    COUNT(DISTINCT market_id) as markets_with_votes,
    SUM(vote_weight) as total_weight_cast,
    AVG(vote_weight) as average_vote_weight,
    MIN(timestamp) as first_vote,
    MAX(timestamp) as last_vote,
    COUNT(*) FILTER (WHERE vote_choice = 'YES') as total_yes_votes,
    COUNT(*) FILTER (WHERE vote_choice = 'NO') as total_no_votes
FROM votes;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE votes IS 'Off-chain votes for markets using Snapshot-style voting (Story 2.2)';
COMMENT ON COLUMN votes.market_id IS 'Market being voted on (FK to markets table)';
COMMENT ON COLUMN votes.voter_wallet IS 'Solana wallet address of voter';
COMMENT ON COLUMN votes.vote_choice IS 'Vote selection: YES or NO';
COMMENT ON COLUMN votes.vote_weight IS 'Vote weight (1 for democratic, activity_points for weighted)';
COMMENT ON COLUMN votes.signature IS 'Base58-encoded Ed25519 signature from wallet';
COMMENT ON COLUMN votes.nonce IS 'UUID from signature message (prevents replay attacks)';
COMMENT ON COLUMN votes.vote_message IS 'Original signed message for audit trail';

COMMENT ON FUNCTION get_vote_counts IS 'Get vote counts and weights for a market';
COMMENT ON FUNCTION calculate_vote_weight IS 'Calculate vote weight for a voter (democratic or weighted mode)';
COMMENT ON FUNCTION has_voted IS 'Check if a user has voted on a market';
COMMENT ON FUNCTION get_user_vote IS 'Get a user''s vote on a specific market';

COMMENT ON VIEW market_vote_summary IS 'Aggregated vote statistics per market with participation rate';
COMMENT ON VIEW recent_votes IS 'Most recent 100 votes across all markets';
COMMENT ON VIEW voter_participation IS 'Voter participation statistics per wallet';
COMMENT ON VIEW vote_statistics IS 'Global vote statistics across all markets';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verify table was created successfully
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'votes') THEN
        RAISE EXCEPTION 'Migration 005 failed: votes table was not created';
    END IF;

    RAISE NOTICE 'Migration 005 completed successfully';
    RAISE NOTICE '- votes table created with 7 indexes';
    RAISE NOTICE '- 4 helper functions created (get_vote_counts, calculate_vote_weight, has_voted, get_user_vote)';
    RAISE NOTICE '- 4 views created (market_vote_summary, recent_votes, voter_participation, vote_statistics)';
    RAISE NOTICE '- RLS policies enabled (read: anyone, insert: edge functions, no updates/deletes)';
    RAISE NOTICE '- Activity points trigger configured (+10 points per vote)';
END $$;
