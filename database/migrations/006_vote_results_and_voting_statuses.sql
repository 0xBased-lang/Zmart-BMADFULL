-- BMAD-Zmart Database Migration 006
-- Migration: Vote Results and Voting Statuses
-- Created: 2025-10-26
-- Story: 2.3 - Vote Aggregation and On-Chain Result Posting
-- Description: Add vote_results table and extend markets table with VOTING/DISPUTE_WINDOW statuses

-- ============================================================================
-- Part 1: Extend Markets Table for Voting Workflow
-- ============================================================================

-- Add new status values to markets table
-- Current: ACTIVE, RESOLVED, CANCELLED
-- Adding: VOTING, DISPUTE_WINDOW

ALTER TABLE markets
DROP CONSTRAINT IF EXISTS market_status_check;

ALTER TABLE markets
ADD CONSTRAINT market_status_check
CHECK (status IN ('ACTIVE', 'VOTING', 'DISPUTE_WINDOW', 'RESOLVED', 'CANCELLED'));

-- Add voting-related columns to markets table
ALTER TABLE markets
ADD COLUMN IF NOT EXISTS voting_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS voting_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dispute_window_end TIMESTAMP WITH TIME ZONE;

-- Create indexes for voting-related queries
CREATE INDEX IF NOT EXISTS idx_markets_voting_end ON markets(voting_end) WHERE status = 'VOTING';
CREATE INDEX IF NOT EXISTS idx_markets_dispute_end ON markets(dispute_window_end) WHERE status = 'DISPUTE_WINDOW';

-- ============================================================================
-- Part 2: Vote Results Table
-- ============================================================================
-- Purpose: Store final vote aggregation results from Solana blockchain
-- Source: Synced from VoteResultPosted event (on-chain)

CREATE TABLE IF NOT EXISTS vote_results (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Reference to market (from PostgreSQL)
    market_id BIGINT NOT NULL REFERENCES markets(market_id) ON DELETE CASCADE,

    -- Vote outcome
    outcome TEXT NOT NULL CHECK (outcome IN ('YES', 'NO', 'TIE', 'NO_VOTES')),

    -- Vote weights (from off-chain aggregation)
    yes_vote_weight BIGINT NOT NULL DEFAULT 0,
    no_vote_weight BIGINT NOT NULL DEFAULT 0,
    total_votes_count INTEGER NOT NULL DEFAULT 0,

    -- Cryptographic proof (Merkle root from Solana)
    merkle_root TEXT, -- Hex-encoded 32-byte hash

    -- On-chain reference
    vote_result_pubkey TEXT, -- Solana account address

    -- Timestamps
    posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    dispute_window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Metadata
    posted_by TEXT, -- Admin wallet that posted the result
    transaction_signature TEXT, -- Solana tx signature

    -- Constraints
    CONSTRAINT unique_market_vote_result UNIQUE (market_id),
    CONSTRAINT vote_result_outcome_check CHECK (outcome IN ('YES', 'NO', 'TIE', 'NO_VOTES')),
    CONSTRAINT vote_result_weights_non_negative CHECK (
        yes_vote_weight >= 0 AND no_vote_weight >= 0
    ),
    CONSTRAINT vote_result_total_votes_non_negative CHECK (total_votes_count >= 0)
);

-- ============================================================================
-- Indexes for Vote Results
-- ============================================================================

CREATE INDEX idx_vote_results_market_id ON vote_results(market_id);
CREATE INDEX idx_vote_results_outcome ON vote_results(outcome);
CREATE INDEX idx_vote_results_posted_at ON vote_results(posted_at DESC);
CREATE INDEX idx_vote_results_dispute_end ON vote_results(dispute_window_end)
WHERE dispute_window_end > NOW();

-- ============================================================================
-- Part 3: Helper Functions for Vote Results
-- ============================================================================

-- Function: Get vote result for a market
CREATE OR REPLACE FUNCTION get_vote_result(p_market_id BIGINT)
RETURNS TABLE (
    outcome TEXT,
    yes_weight BIGINT,
    no_weight BIGINT,
    total_votes INTEGER,
    merkle_root TEXT,
    posted_at TIMESTAMP WITH TIME ZONE,
    dispute_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        vr.outcome,
        vr.yes_vote_weight,
        vr.no_vote_weight,
        vr.total_votes_count,
        vr.merkle_root,
        vr.posted_at,
        vr.dispute_window_end
    FROM vote_results vr
    WHERE vr.market_id = p_market_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Check if market is in dispute window
CREATE OR REPLACE FUNCTION is_in_dispute_window(p_market_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
    v_dispute_end TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT dispute_window_end INTO v_dispute_end
    FROM vote_results
    WHERE market_id = p_market_id;

    RETURN v_dispute_end IS NOT NULL AND v_dispute_end > NOW();
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get markets ready for vote aggregation
-- (voting period ended but no vote result yet)
CREATE OR REPLACE FUNCTION get_markets_ready_for_aggregation()
RETURNS TABLE (
    market_id BIGINT,
    title TEXT,
    voting_end TIMESTAMP WITH TIME ZONE,
    total_votes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.market_id,
        m.title,
        m.voting_end,
        COUNT(v.id)::INTEGER AS total_votes
    FROM markets m
    LEFT JOIN votes v ON v.market_id = m.market_id::TEXT
    WHERE m.status = 'VOTING'
      AND m.voting_end < NOW()
      AND NOT EXISTS (
          SELECT 1 FROM vote_results vr WHERE vr.market_id = m.market_id
      )
    GROUP BY m.market_id, m.title, m.voting_end
    ORDER BY m.voting_end ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Part 4: Row Level Security (RLS) for Vote Results
-- ============================================================================

-- Enable RLS
ALTER TABLE vote_results ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read vote results (public transparency)
CREATE POLICY vote_results_read_policy ON vote_results
    FOR SELECT
    USING (true);

-- Policy: Only service role can insert vote results (from event listener)
CREATE POLICY vote_results_insert_policy ON vote_results
    FOR INSERT
    WITH CHECK (false); -- Only service role can insert (via event listener)

-- Policy: No updates allowed (immutable after posting)
CREATE POLICY vote_results_update_policy ON vote_results
    FOR UPDATE
    USING (false);

-- Policy: No deletes allowed (permanent record)
CREATE POLICY vote_results_delete_policy ON vote_results
    FOR DELETE
    USING (false);

-- ============================================================================
-- Part 5: Validation and Comments
-- ============================================================================

COMMENT ON TABLE vote_results IS
'Stores final vote aggregation results from Solana blockchain. Synced from VoteResultPosted event.';

COMMENT ON COLUMN vote_results.outcome IS
'Final outcome: YES (>50% yes votes), NO (≤50% yes votes), TIE (exactly 50/50), NO_VOTES (0 votes)';

COMMENT ON COLUMN vote_results.merkle_root IS
'Hex-encoded Merkle root (32 bytes) for cryptographic verification of all votes';

COMMENT ON COLUMN vote_results.dispute_window_end IS
'Timestamp when dispute window closes (48 hours after posting). After this, market can be finalized.';

COMMENT ON FUNCTION get_markets_ready_for_aggregation() IS
'Returns markets in VOTING status where voting_end < NOW() and no vote result exists yet. Used by cron job.';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verification queries (for testing)
DO $$
BEGIN
    -- Verify markets table has new statuses
    ASSERT (SELECT COUNT(*) FROM pg_constraint WHERE conname = 'market_status_check') = 1,
        'Market status constraint not found';

    -- Verify vote_results table exists
    ASSERT (SELECT COUNT(*) FROM information_schema.tables
            WHERE table_name = 'vote_results') = 1,
        'vote_results table not created';

    -- Verify indexes exist
    ASSERT (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'vote_results') >= 4,
        'vote_results indexes not created';

    RAISE NOTICE 'Migration 006: Vote Results and Voting Statuses - SUCCESS';
END $$;
