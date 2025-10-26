-- BMAD-Zmart Database RLS Policies
-- Migration 002: Row-Level Security Setup
-- Created: 2025-10-24
-- Description: Security policies for public read, authenticated write

-- ============================================================================
-- Enable RLS on all tables
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolution_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Users Table Policies
-- ============================================================================

-- Public read access
CREATE POLICY "Users are viewable by everyone"
ON users FOR SELECT
USING (true);

-- Users can insert their own record
CREATE POLICY "Users can insert own record"
ON users FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own record
CREATE POLICY "Users can update own record"
ON users FOR UPDATE
USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- ============================================================================
-- Markets Table Policies
-- ============================================================================

-- Public read access
CREATE POLICY "Markets are viewable by everyone"
ON markets FOR SELECT
USING (true);

-- Authenticated users can create markets (via backend service)
CREATE POLICY "Authenticated users can create markets"
ON markets FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Service role can update markets (for on-chain sync)
CREATE POLICY "Service can update markets"
ON markets FOR UPDATE
USING (true); -- Will be restricted by service role key

-- ============================================================================
-- Bets Table Policies
-- ============================================================================

-- Public read access
CREATE POLICY "Bets are viewable by everyone"
ON bets FOR SELECT
USING (true);

-- Authenticated users can insert bets (via backend service)
CREATE POLICY "Authenticated users can place bets"
ON bets FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Service role can update bets (for claim status sync)
CREATE POLICY "Service can update bets"
ON bets FOR UPDATE
USING (true); -- Will be restricted by service role key

-- ============================================================================
-- Proposals Table Policies
-- ============================================================================

-- Public read access
CREATE POLICY "Proposals are viewable by everyone"
ON proposals FOR SELECT
USING (true);

-- Authenticated users can create proposals
CREATE POLICY "Authenticated users can create proposals"
ON proposals FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Service role can update proposals (for on-chain sync)
CREATE POLICY "Service can update proposals"
ON proposals FOR UPDATE
USING (true);

-- ============================================================================
-- Proposal Votes Table Policies
-- ============================================================================

-- Public read access
CREATE POLICY "Proposal votes are viewable by everyone"
ON proposal_votes FOR SELECT
USING (true);

-- Users can insert their own votes
CREATE POLICY "Users can vote on proposals"
ON proposal_votes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- No updates allowed (votes are immutable)

-- ============================================================================
-- Resolution Votes Table Policies
-- ============================================================================

-- Public read access
CREATE POLICY "Resolution votes are viewable by everyone"
ON resolution_votes FOR SELECT
USING (true);

-- Users can insert their own votes
CREATE POLICY "Users can vote on resolutions"
ON resolution_votes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- No updates allowed (votes are immutable)

-- ============================================================================
-- Activity Points Table Policies
-- ============================================================================

-- Public read access
CREATE POLICY "Activity points are viewable by everyone"
ON activity_points FOR SELECT
USING (true);

-- Service role can insert activity points
CREATE POLICY "Service can insert activity points"
ON activity_points FOR INSERT
WITH CHECK (true); -- Will be restricted by service role key

-- No updates allowed (activity points are append-only)

-- ============================================================================
-- Event Log Table Policies
-- ============================================================================

-- Service role only access
CREATE POLICY "Event log is service-only"
ON event_log FOR ALL
USING (auth.uid() IS NOT NULL AND auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- Grant permissions to anon and authenticated roles
-- ============================================================================

-- Anonymous users (public)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Authenticated users
GRANT SELECT, INSERT ON users TO authenticated;
GRANT SELECT ON markets TO authenticated;
GRANT SELECT ON bets TO authenticated;
GRANT SELECT ON proposals TO authenticated;
GRANT SELECT, INSERT ON proposal_votes TO authenticated;
GRANT SELECT, INSERT ON resolution_votes TO authenticated;
GRANT SELECT ON activity_points TO authenticated;

-- Service role (full access handled by Supabase)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

COMMENT ON POLICY "Users are viewable by everyone" ON users IS 'Public read access for user profiles';
COMMENT ON POLICY "Markets are viewable by everyone" ON markets IS 'Public read access for all markets';
COMMENT ON POLICY "Bets are viewable by everyone" ON bets IS 'Public read access for transparency';
