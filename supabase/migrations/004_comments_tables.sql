-- Migration: Comments and Discussion System
-- Description: Create comments, comment_upvotes, and comment_flags tables for market discussions
-- Story: 3.11 - Implement Comments and Discussion System
-- Date: 2025-10-28

-- ============================================================================
-- COMMENTS TABLE
-- ============================================================================

-- Table: comments
-- Purpose: Store user comments on markets for discussion and evidence sharing
-- Features: Upvote tracking, flagging for moderation, rate limiting support
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id INTEGER NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  commenter_wallet TEXT NOT NULL,
  comment_text TEXT NOT NULL CHECK (length(comment_text) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
  flagged BOOLEAN DEFAULT false
);

-- Performance indexes for comments table
-- Index: market_id (critical for fetching comments by market)
CREATE INDEX IF NOT EXISTS idx_comments_market_id
ON comments(market_id);

-- Index: created_at DESC (critical for chronological sorting)
CREATE INDEX IF NOT EXISTS idx_comments_created_at
ON comments(created_at DESC);

-- Index: commenter_wallet (useful for user comment history)
CREATE INDEX IF NOT EXISTS idx_comments_commenter_wallet
ON comments(commenter_wallet);

-- Index: flagged comments (critical for admin moderation queue)
CREATE INDEX IF NOT EXISTS idx_comments_flagged
ON comments(flagged)
WHERE flagged = true;

-- ============================================================================
-- COMMENT UPVOTES TABLE
-- ============================================================================

-- Table: comment_upvotes
-- Purpose: Track which users upvoted which comments (one upvote per user per comment)
-- Features: Prevents duplicate upvotes, enables toggle functionality
CREATE TABLE IF NOT EXISTS comment_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  voter_wallet TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, voter_wallet)
);

-- Performance indexes for comment_upvotes table
-- Index: comment_id (critical for checking if user upvoted)
CREATE INDEX IF NOT EXISTS idx_comment_upvotes_comment_id
ON comment_upvotes(comment_id);

-- Index: voter_wallet (useful for user upvote history)
CREATE INDEX IF NOT EXISTS idx_comment_upvotes_voter_wallet
ON comment_upvotes(voter_wallet);

-- ============================================================================
-- COMMENT FLAGS TABLE
-- ============================================================================

-- Table: comment_flags
-- Purpose: Track user-reported inappropriate comments for admin review
-- Features: Prevents duplicate flags, supports optional reason
CREATE TABLE IF NOT EXISTS comment_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  flagger_wallet TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, flagger_wallet)
);

-- Performance indexes for comment_flags table
-- Index: comment_id (critical for counting flags per comment)
CREATE INDEX IF NOT EXISTS idx_comment_flags_comment_id
ON comment_flags(comment_id);

-- Index: created_at (useful for admin review queue chronology)
CREATE INDEX IF NOT EXISTS idx_comment_flags_created_at
ON comment_flags(created_at DESC);

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

-- Function: update_updated_at_column
-- Purpose: Automatically update updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: set_updated_at on comments table
-- Purpose: Keep updated_at in sync with modifications
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

-- Note: This schema supports the following features:
-- 1. Comment submission with wallet authentication (API route validates signature)
-- 2. Upvote toggle (one upvote per wallet enforced by UNIQUE constraint)
-- 3. Comment flagging for moderation (duplicate flags prevented by UNIQUE constraint)
-- 4. Rate limiting (API route tracks comment_count per wallet per hour)
-- 5. Real-time updates (Supabase subscriptions filter by market_id)
-- 6. Admin moderation queue (query WHERE flagged = true with flag count)
