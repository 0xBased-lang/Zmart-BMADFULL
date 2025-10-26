-- BMAD-Zmart Database Migration 007
-- Migration: Proposal Voting (Snapshot-Style Off-Chain)
-- Created: 2025-10-26
-- Story: 2.4 - Proposal Voting via Snapshot
-- Description: Extend proposal_votes table for Snapshot-style voting (Story 2.1 integration)

-- ============================================================================
-- Part 1: Extend Proposals Table for Voting Workflow
-- ============================================================================

-- Add new status values: VOTING, VOTE_COMPLETE
ALTER TABLE proposals
DROP CONSTRAINT IF EXISTS proposal_status_check;

ALTER TABLE proposals
ADD CONSTRAINT proposal_status_check
CHECK (status IN ('PENDING', 'VOTING', 'VOTE_COMPLETE', 'APPROVED', 'REJECTED'));

-- Add voting period columns
ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS voting_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS voting_end TIMESTAMP WITH TIME ZONE;

-- Create indexes for voting queries
CREATE INDEX IF NOT EXISTS idx_proposals_voting_status ON proposals(status) WHERE status = 'VOTING';
CREATE INDEX IF NOT EXISTS idx_proposals_voting_end ON proposals(voting_end) WHERE status = 'VOTING';

-- ============================================================================
-- Part 2: Extend proposal_votes Table for Snapshot-Style Voting
-- ============================================================================

-- Add columns for off-chain voting (Story 2.1 integration)
ALTER TABLE proposal_votes
ADD COLUMN IF NOT EXISTS signature TEXT,           -- Ed25519 signature from wallet
ADD COLUMN IF NOT EXISTS vote_weight INTEGER DEFAULT 1 CHECK (vote_weight > 0),
ADD COLUMN IF NOT EXISTS nonce TEXT;               -- Replay attack prevention

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_proposal_votes_signature ON proposal_votes(signature);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_nonce ON proposal_votes(nonce);

-- ============================================================================
-- Part 3: Real-Time Vote Tally View
-- ============================================================================

-- Drop existing view if exists (for clean migration)
DROP VIEW IF EXISTS proposal_vote_summary;

-- Create view for real-time aggregation
CREATE VIEW proposal_vote_summary AS
SELECT
    proposal_id,
    COUNT(*) AS total_votes,
    SUM(CASE WHEN vote_choice = 'YES' THEN vote_weight ELSE 0 END) AS yes_weight,
    SUM(CASE WHEN vote_choice = 'NO' THEN vote_weight ELSE 0 END) AS no_weight,
    COUNT(DISTINCT voter_wallet) AS unique_voters,
    (SUM(CASE WHEN vote_choice = 'YES' THEN vote_weight ELSE 0 END)::FLOAT /
     NULLIF(SUM(vote_weight), 0)) * 100 AS yes_percentage
FROM proposal_votes
GROUP BY proposal_id;

-- Index on proposal_id for view performance
CREATE INDEX IF NOT EXISTS idx_proposal_votes_proposal_agg ON proposal_votes(proposal_id, vote_choice, vote_weight);

-- ============================================================================
-- Part 4: Helper Functions for Proposal Voting
-- ============================================================================

-- Function: Get vote tally for a proposal
CREATE OR REPLACE FUNCTION get_proposal_vote_tally(p_proposal_id BIGINT)
RETURNS TABLE (
    yes_weight BIGINT,
    no_weight BIGINT,
    total_votes INTEGER,
    unique_voters INTEGER,
    yes_percentage FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pvs.yes_weight,
        pvs.no_weight,
        pvs.total_votes::INTEGER,
        pvs.unique_voters::INTEGER,
        pvs.yes_percentage
    FROM proposal_vote_summary pvs
    WHERE pvs.proposal_id = p_proposal_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Check if user has voted on proposal
CREATE OR REPLACE FUNCTION has_user_voted_on_proposal(
    p_proposal_id BIGINT,
    p_voter_wallet TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM proposal_votes
        WHERE proposal_id = p_proposal_id
          AND voter_wallet = p_voter_wallet
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get proposals in VOTING status with active voting periods
CREATE OR REPLACE FUNCTION get_active_voting_proposals()
RETURNS TABLE (
    proposal_id BIGINT,
    title TEXT,
    voting_start TIMESTAMP WITH TIME ZONE,
    voting_end TIMESTAMP WITH TIME ZONE,
    current_yes_weight BIGINT,
    current_no_weight BIGINT,
    total_votes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.proposal_id,
        p.title,
        p.voting_start,
        p.voting_end,
        COALESCE(pvs.yes_weight, 0) AS current_yes_weight,
        COALESCE(pvs.no_weight, 0) AS current_no_weight,
        COALESCE(pvs.total_votes, 0)::INTEGER AS total_votes
    FROM proposals p
    LEFT JOIN proposal_vote_summary pvs ON pvs.proposal_id = p.proposal_id
    WHERE p.status = 'VOTING'
      AND p.voting_start <= NOW()
      AND p.voting_end >= NOW()
    ORDER BY p.voting_end ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get proposals ready for status transition
CREATE OR REPLACE FUNCTION get_proposals_ready_for_transition()
RETURNS TABLE (
    proposal_id BIGINT,
    current_status TEXT,
    target_status TEXT,
    voting_start TIMESTAMP WITH TIME ZONE,
    voting_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    -- PENDING → VOTING (voting_start reached)
    SELECT
        p.proposal_id,
        p.status AS current_status,
        'VOTING'::TEXT AS target_status,
        p.voting_start,
        p.voting_end
    FROM proposals p
    WHERE p.status = 'PENDING'
      AND p.voting_start IS NOT NULL
      AND p.voting_start <= NOW()

    UNION ALL

    -- VOTING → VOTE_COMPLETE (voting_end reached)
    SELECT
        p.proposal_id,
        p.status AS current_status,
        'VOTE_COMPLETE'::TEXT AS target_status,
        p.voting_start,
        p.voting_end
    FROM proposals p
    WHERE p.status = 'VOTING'
      AND p.voting_end IS NOT NULL
      AND p.voting_end <= NOW()

    ORDER BY voting_end ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Part 5: Proposal Status Transition Automation (Cron Job)
-- ============================================================================

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop existing job if exists (for clean migration)
SELECT cron.unschedule('transition-proposal-status')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'transition-proposal-status'
);

-- Create cron job for proposal status transitions
-- Runs every 5 minutes
SELECT cron.schedule(
    'transition-proposal-status',
    '*/5 * * * *',
    $$
    -- PENDING → VOTING (when voting_start reached)
    UPDATE proposals
    SET status = 'VOTING'
    WHERE status = 'PENDING'
      AND voting_start IS NOT NULL
      AND voting_start <= NOW();

    -- VOTING → VOTE_COMPLETE (when voting_end reached)
    UPDATE proposals
    SET status = 'VOTE_COMPLETE'
    WHERE status = 'VOTING'
      AND voting_end IS NOT NULL
      AND voting_end <= NOW();
    $$
);

-- ============================================================================
-- Part 6: Row Level Security (RLS) Updates
-- ============================================================================

-- Enable RLS on proposal_votes (if not already enabled)
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (for clean migration)
DROP POLICY IF EXISTS proposal_votes_read_policy ON proposal_votes;
DROP POLICY IF EXISTS proposal_votes_insert_policy ON proposal_votes;
DROP POLICY IF EXISTS proposal_votes_update_policy ON proposal_votes;
DROP POLICY IF EXISTS proposal_votes_delete_policy ON proposal_votes;

-- Policy: Anyone can read proposal votes (public transparency)
CREATE POLICY proposal_votes_read_policy ON proposal_votes
    FOR SELECT
    USING (true);

-- Policy: Only service role can insert votes (via Edge Function)
CREATE POLICY proposal_votes_insert_policy ON proposal_votes
    FOR INSERT
    WITH CHECK (false); -- Only service role can insert (via Edge Function)

-- Policy: No updates allowed (votes are immutable)
CREATE POLICY proposal_votes_update_policy ON proposal_votes
    FOR UPDATE
    USING (false);

-- Policy: No deletes allowed (permanent record)
CREATE POLICY proposal_votes_delete_policy ON proposal_votes
    FOR DELETE
    USING (false);

-- ============================================================================
-- Part 7: Comments and Documentation
-- ============================================================================

COMMENT ON COLUMN proposal_votes.signature IS
'Ed25519 signature from voter wallet (Story 2.1 integration)';

COMMENT ON COLUMN proposal_votes.vote_weight IS
'Vote weight: 1 (democratic) or activity_points (activity-weighted)';

COMMENT ON COLUMN proposal_votes.nonce IS
'Unique nonce for replay attack prevention (Story 2.1)';

COMMENT ON VIEW proposal_vote_summary IS
'Real-time aggregation of proposal votes with yes/no weights and percentage';

COMMENT ON FUNCTION get_proposal_vote_tally(BIGINT) IS
'Returns vote tally for a specific proposal';

COMMENT ON FUNCTION has_user_voted_on_proposal(BIGINT, TEXT) IS
'Checks if a user has already voted on a proposal';

COMMENT ON FUNCTION get_active_voting_proposals() IS
'Returns all proposals currently in VOTING status with active voting periods';

COMMENT ON FUNCTION get_proposals_ready_for_transition() IS
'Returns proposals ready for status transition (PENDING → VOTING or VOTING → VOTE_COMPLETE)';

-- ============================================================================
-- Part 8: Validation and Verification
-- ============================================================================

DO $$
BEGIN
    -- Verify proposals table has new statuses
    ASSERT (SELECT COUNT(*) FROM pg_constraint WHERE conname = 'proposal_status_check') = 1,
        'Proposal status constraint not found';

    -- Verify proposal_votes table has new columns
    ASSERT (SELECT COUNT(*) FROM information_schema.columns
            WHERE table_name = 'proposal_votes' AND column_name = 'signature') = 1,
        'proposal_votes.signature column not found';

    ASSERT (SELECT COUNT(*) FROM information_schema.columns
            WHERE table_name = 'proposal_votes' AND column_name = 'vote_weight') = 1,
        'proposal_votes.vote_weight column not found';

    ASSERT (SELECT COUNT(*) FROM information_schema.columns
            WHERE table_name = 'proposal_votes' AND column_name = 'nonce') = 1,
        'proposal_votes.nonce column not found';

    -- Verify view exists
    ASSERT (SELECT COUNT(*) FROM information_schema.views
            WHERE table_name = 'proposal_vote_summary') = 1,
        'proposal_vote_summary view not created';

    -- Verify cron job exists
    ASSERT (SELECT COUNT(*) FROM cron.job WHERE jobname = 'transition-proposal-status') = 1,
        'Cron job not created';

    RAISE NOTICE 'Migration 007: Proposal Voting (Snapshot-Style) - SUCCESS';
END $$;
