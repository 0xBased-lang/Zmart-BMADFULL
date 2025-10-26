-- BMAD-Zmart Database Schema
-- Migration 001: Initial Schema Setup
-- Created: 2025-10-24
-- Description: Core tables for markets, bets, users, proposals, votes, and activity points

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- ============================================================================
-- Users Table
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    username TEXT,
    avatar_url TEXT,
    total_bets INTEGER DEFAULT 0,
    total_markets_created INTEGER DEFAULT 0,
    total_proposals_created INTEGER DEFAULT 0,
    total_volume_wagered BIGINT DEFAULT 0, -- in lamports
    total_winnings BIGINT DEFAULT 0, -- in lamports
    activity_points INTEGER DEFAULT 0,
    reputation_score DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes
    CONSTRAINT wallet_address_check CHECK (LENGTH(wallet_address) BETWEEN 32 AND 44)
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_activity_points ON users(activity_points DESC);
CREATE INDEX idx_users_reputation ON users(reputation_score DESC);

-- ============================================================================
-- Markets Table
-- ============================================================================
CREATE TABLE markets (
    id BIGSERIAL PRIMARY KEY,
    market_id BIGINT UNIQUE NOT NULL, -- On-chain market ID
    creator_wallet TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Liquidity pools (in lamports)
    yes_pool BIGINT DEFAULT 0,
    no_pool BIGINT DEFAULT 0,
    total_volume BIGINT DEFAULT 0,

    -- Status
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, RESOLVED, CANCELLED
    resolved_outcome TEXT, -- YES, NO, CANCELLED

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,

    -- Tracking
    total_bets INTEGER DEFAULT 0,
    unique_bettors INTEGER DEFAULT 0,

    -- On-chain reference
    on_chain_address TEXT,

    -- Constraints
    CONSTRAINT market_status_check CHECK (status IN ('ACTIVE', 'RESOLVED', 'CANCELLED')),
    CONSTRAINT market_outcome_check CHECK (resolved_outcome IN ('YES', 'NO', 'CANCELLED') OR resolved_outcome IS NULL),
    CONSTRAINT market_title_length CHECK (LENGTH(title) BETWEEN 1 AND 128),
    CONSTRAINT market_description_length CHECK (LENGTH(description) BETWEEN 1 AND 512)
);

-- Indexes for markets
CREATE INDEX idx_markets_market_id ON markets(market_id);
CREATE INDEX idx_markets_creator ON markets(creator_wallet);
CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_markets_category ON markets(category);
CREATE INDEX idx_markets_end_date ON markets(end_date DESC);
CREATE INDEX idx_markets_created_at ON markets(created_at DESC);
CREATE INDEX idx_markets_total_volume ON markets(total_volume DESC);

-- Full-text search index on title and description
CREATE INDEX idx_markets_title_search ON markets USING gin(to_tsvector('english', title));
CREATE INDEX idx_markets_description_search ON markets USING gin(to_tsvector('english', description));
CREATE INDEX idx_markets_combined_search ON markets USING gin(to_tsvector('english', title || ' ' || description));

-- Trigram index for fuzzy search
CREATE INDEX idx_markets_title_trgm ON markets USING gin(title gin_trgm_ops);

-- ============================================================================
-- Bets Table
-- ============================================================================
CREATE TABLE bets (
    id BIGSERIAL PRIMARY KEY,
    market_id BIGINT NOT NULL REFERENCES markets(market_id) ON DELETE CASCADE,
    bettor_wallet TEXT NOT NULL,

    -- Bet details
    bet_side TEXT NOT NULL, -- YES, NO
    amount BIGINT NOT NULL, -- in lamports
    amount_to_pool BIGINT NOT NULL, -- after fees
    platform_fee BIGINT NOT NULL,
    creator_fee BIGINT NOT NULL,

    -- Odds snapshot
    odds_at_bet INTEGER NOT NULL, -- basis points (5000 = 50%)

    -- Status
    claimed BOOLEAN DEFAULT FALSE,
    payout_amount BIGINT,

    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claimed_at TIMESTAMP WITH TIME ZONE,

    -- On-chain reference
    on_chain_address TEXT,
    transaction_signature TEXT,

    -- Constraints
    CONSTRAINT bet_side_check CHECK (bet_side IN ('YES', 'NO')),
    CONSTRAINT bet_amount_positive CHECK (amount > 0),
    CONSTRAINT bet_odds_range CHECK (odds_at_bet BETWEEN 0 AND 10000)
);

-- Indexes for bets
CREATE INDEX idx_bets_market_id ON bets(market_id);
CREATE INDEX idx_bets_bettor ON bets(bettor_wallet);
CREATE INDEX idx_bets_timestamp ON bets(timestamp DESC);
CREATE INDEX idx_bets_claimed ON bets(claimed);
CREATE INDEX idx_bets_market_bettor ON bets(market_id, bettor_wallet);

-- ============================================================================
-- Proposals Table
-- ============================================================================
CREATE TABLE proposals (
    id BIGSERIAL PRIMARY KEY,
    proposal_id BIGINT UNIQUE NOT NULL, -- On-chain proposal ID
    creator_wallet TEXT NOT NULL,

    -- Proposal details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    bond_amount BIGINT NOT NULL, -- in lamports
    bond_tier TEXT NOT NULL, -- TIER1, TIER2, TIER3
    proposal_tax BIGINT NOT NULL, -- 1% non-refundable

    -- Voting
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    yes_votes INTEGER DEFAULT 0,
    no_votes INTEGER DEFAULT 0,
    total_voters INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,

    -- Market creation
    market_id BIGINT REFERENCES markets(market_id),

    -- On-chain reference
    on_chain_address TEXT,

    -- Constraints
    CONSTRAINT proposal_status_check CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT proposal_bond_tier_check CHECK (bond_tier IN ('TIER1', 'TIER2', 'TIER3')),
    CONSTRAINT proposal_title_length CHECK (LENGTH(title) BETWEEN 1 AND 128),
    CONSTRAINT proposal_description_length CHECK (LENGTH(description) BETWEEN 1 AND 512)
);

-- Indexes for proposals
CREATE INDEX idx_proposals_proposal_id ON proposals(proposal_id);
CREATE INDEX idx_proposals_creator ON proposals(creator_wallet);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_created_at ON proposals(created_at DESC);
CREATE INDEX idx_proposals_end_date ON proposals(end_date DESC);

-- Full-text search for proposals
CREATE INDEX idx_proposals_title_search ON proposals USING gin(to_tsvector('english', title));
CREATE INDEX idx_proposals_description_search ON proposals USING gin(to_tsvector('english', description));

-- ============================================================================
-- Proposal Votes Table
-- ============================================================================
CREATE TABLE proposal_votes (
    id BIGSERIAL PRIMARY KEY,
    proposal_id BIGINT NOT NULL REFERENCES proposals(proposal_id) ON DELETE CASCADE,
    voter_wallet TEXT NOT NULL,
    vote_choice TEXT NOT NULL, -- YES, NO
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- On-chain reference
    on_chain_address TEXT,
    transaction_signature TEXT,

    -- Constraints
    CONSTRAINT proposal_vote_choice_check CHECK (vote_choice IN ('YES', 'NO')),
    CONSTRAINT proposal_vote_unique UNIQUE (proposal_id, voter_wallet)
);

-- Indexes for proposal votes
CREATE INDEX idx_proposal_votes_proposal ON proposal_votes(proposal_id);
CREATE INDEX idx_proposal_votes_voter ON proposal_votes(voter_wallet);
CREATE INDEX idx_proposal_votes_timestamp ON proposal_votes(timestamp DESC);

-- ============================================================================
-- Market Resolution Votes Table
-- ============================================================================
CREATE TABLE resolution_votes (
    id BIGSERIAL PRIMARY KEY,
    market_id BIGINT NOT NULL REFERENCES markets(market_id) ON DELETE CASCADE,
    voter_wallet TEXT NOT NULL,
    vote_choice TEXT NOT NULL, -- YES, NO, CANCEL
    vote_weight BIGINT NOT NULL DEFAULT 1,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- On-chain reference
    on_chain_address TEXT,
    transaction_signature TEXT,

    -- Constraints
    CONSTRAINT resolution_vote_choice_check CHECK (vote_choice IN ('YES', 'NO', 'CANCEL')),
    CONSTRAINT resolution_vote_unique UNIQUE (market_id, voter_wallet)
);

-- Indexes for resolution votes
CREATE INDEX idx_resolution_votes_market ON resolution_votes(market_id);
CREATE INDEX idx_resolution_votes_voter ON resolution_votes(voter_wallet);
CREATE INDEX idx_resolution_votes_timestamp ON resolution_votes(timestamp DESC);

-- ============================================================================
-- Activity Points Table
-- ============================================================================
CREATE TABLE activity_points (
    id BIGSERIAL PRIMARY KEY,
    user_wallet TEXT NOT NULL,
    activity_type TEXT NOT NULL, -- BET_PLACED, MARKET_CREATED, PROPOSAL_CREATED, VOTE_CAST
    points INTEGER NOT NULL,
    reference_id BIGINT, -- market_id, proposal_id, etc.
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT activity_type_check CHECK (activity_type IN (
        'BET_PLACED', 'MARKET_CREATED', 'PROPOSAL_CREATED',
        'VOTE_CAST', 'MARKET_RESOLVED', 'PAYOUT_CLAIMED'
    ))
);

-- Indexes for activity points
CREATE INDEX idx_activity_points_user ON activity_points(user_wallet);
CREATE INDEX idx_activity_points_type ON activity_points(activity_type);
CREATE INDEX idx_activity_points_timestamp ON activity_points(timestamp DESC);

-- ============================================================================
-- Event Log Table (for debugging and reconciliation)
-- ============================================================================
CREATE TABLE event_log (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    program_id TEXT NOT NULL,
    transaction_signature TEXT UNIQUE NOT NULL,
    slot BIGINT NOT NULL,
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for event log
CREATE INDEX idx_event_log_type ON event_log(event_type);
CREATE INDEX idx_event_log_signature ON event_log(transaction_signature);
CREATE INDEX idx_event_log_processed ON event_log(processed);
CREATE INDEX idx_event_log_created_at ON event_log(created_at DESC);
CREATE INDEX idx_event_log_slot ON event_log(slot DESC);

-- ============================================================================
-- Triggers for updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Views for common queries
-- ============================================================================

-- Active markets with current odds
CREATE VIEW active_markets_with_odds AS
SELECT
    m.*,
    CASE
        WHEN (m.yes_pool + m.no_pool) = 0 THEN 5000
        ELSE ((m.yes_pool::NUMERIC * 10000) / (m.yes_pool + m.no_pool))::INTEGER
    END as current_yes_odds
FROM markets m
WHERE m.status = 'ACTIVE' AND m.end_date > NOW();

-- User leaderboard
CREATE VIEW user_leaderboard AS
SELECT
    u.wallet_address,
    u.username,
    u.total_bets,
    u.total_volume_wagered,
    u.total_winnings,
    u.activity_points,
    u.reputation_score,
    (u.total_winnings::NUMERIC / NULLIF(u.total_volume_wagered, 0)) * 100 as roi_percentage
FROM users u
ORDER BY u.activity_points DESC, u.total_winnings DESC;

-- Market statistics
CREATE VIEW market_statistics AS
SELECT
    m.market_id,
    m.title,
    m.status,
    m.total_bets,
    m.unique_bettors,
    m.total_volume,
    COUNT(DISTINCT CASE WHEN b.bet_side = 'YES' THEN b.bettor_wallet END) as yes_bettors,
    COUNT(DISTINCT CASE WHEN b.bet_side = 'NO' THEN b.bettor_wallet END) as no_bettors,
    SUM(CASE WHEN b.bet_side = 'YES' THEN b.amount_to_pool ELSE 0 END) as yes_volume,
    SUM(CASE WHEN b.bet_side = 'NO' THEN b.amount_to_pool ELSE 0 END) as no_volume
FROM markets m
LEFT JOIN bets b ON m.market_id = b.market_id
GROUP BY m.market_id, m.title, m.status, m.total_bets, m.unique_bettors, m.total_volume;

COMMENT ON SCHEMA public IS 'BMAD-Zmart prediction markets database schema v1.0';
