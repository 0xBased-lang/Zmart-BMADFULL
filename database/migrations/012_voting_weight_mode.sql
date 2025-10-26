-- BMAD-Zmart Database Migration 012
-- Migration: Voting Weight Mode Configuration
-- Created: 2025-10-26
-- Story: 2.8 - Implement Voting Weight Modes (Democratic vs Activity-Based)
-- Description: Add global configuration for voting weight mode

-- ============================================================================
-- Part 1: Create Global Configuration Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS global_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT
);

-- ============================================================================
-- Part 2: Insert Voting Weight Mode Configuration
-- ============================================================================

INSERT INTO global_config (key, value, description)
VALUES (
    'voting_weight_mode',
    'DEMOCRATIC',
    'Voting weight calculation mode: DEMOCRATIC (all votes weight = 1) or ACTIVITY_WEIGHTED (weight = activity_points)'
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Part 3: Helper Function to Get Voting Weight Mode
-- ============================================================================

CREATE OR REPLACE FUNCTION get_voting_weight_mode()
RETURNS TEXT AS $$
DECLARE
    mode_value TEXT;
BEGIN
    SELECT value INTO mode_value
    FROM global_config
    WHERE key = 'voting_weight_mode';

    -- Default to DEMOCRATIC if not set
    RETURN COALESCE(mode_value, 'DEMOCRATIC');
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Part 4: Helper Function to Calculate Vote Weight
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_user_vote_weight(p_voter_wallet TEXT)
RETURNS INTEGER AS $$
DECLARE
    mode_value TEXT;
    user_activity_points INTEGER;
BEGIN
    -- Get current voting weight mode
    SELECT get_voting_weight_mode() INTO mode_value;

    -- Democratic mode: all votes have weight = 1
    IF mode_value = 'DEMOCRATIC' THEN
        RETURN 1;
    END IF;

    -- Activity-weighted mode: weight = activity_points (minimum 1)
    SELECT activity_points INTO user_activity_points
    FROM users
    WHERE wallet_address = p_voter_wallet;

    -- If user not found or has 0 points, default to weight = 1
    RETURN COALESCE(GREATEST(user_activity_points, 1), 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Part 5: Admin Function to Update Voting Weight Mode
-- ============================================================================

CREATE OR REPLACE FUNCTION set_voting_weight_mode(
    p_new_mode TEXT,
    p_admin_wallet TEXT DEFAULT 'system'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validate mode value
    IF p_new_mode NOT IN ('DEMOCRATIC', 'ACTIVITY_WEIGHTED') THEN
        RAISE EXCEPTION 'Invalid voting weight mode: %. Must be DEMOCRATIC or ACTIVITY_WEIGHTED', p_new_mode;
    END IF;

    -- Update the configuration
    UPDATE global_config
    SET value = p_new_mode,
        updated_at = NOW(),
        updated_by = p_admin_wallet
    WHERE key = 'voting_weight_mode';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Part 6: Row Level Security for Global Config
-- ============================================================================

ALTER TABLE global_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read global config (public configuration)
CREATE POLICY global_config_read_policy ON global_config
    FOR SELECT
    USING (true);

-- Only service role can insert/update/delete (via Edge Functions)
CREATE POLICY global_config_insert_policy ON global_config
    FOR INSERT
    WITH CHECK (false);

CREATE POLICY global_config_update_policy ON global_config
    FOR UPDATE
    USING (false);

CREATE POLICY global_config_delete_policy ON global_config
    FOR DELETE
    USING (false);

-- ============================================================================
-- Part 7: Comments and Documentation
-- ============================================================================

COMMENT ON TABLE global_config IS
'Global system configuration key-value store. Used for runtime configuration that can be updated without code deployment.';

COMMENT ON COLUMN global_config.key IS
'Unique configuration key identifier';

COMMENT ON COLUMN global_config.value IS
'Configuration value (stored as TEXT for flexibility)';

COMMENT ON FUNCTION get_voting_weight_mode() IS
'Returns current voting weight mode: DEMOCRATIC or ACTIVITY_WEIGHTED. Defaults to DEMOCRATIC if not set.';

COMMENT ON FUNCTION calculate_user_vote_weight(TEXT) IS
'Calculates vote weight for a user based on current voting_weight_mode. DEMOCRATIC: weight = 1. ACTIVITY_WEIGHTED: weight = activity_points (minimum 1).';

COMMENT ON FUNCTION set_voting_weight_mode(TEXT, TEXT) IS
'Updates the voting weight mode. Validates input (must be DEMOCRATIC or ACTIVITY_WEIGHTED). Admin-only function.';

-- ============================================================================
-- Part 8: Validation
-- ============================================================================

DO $$
BEGIN
    -- Verify global_config table exists
    ASSERT (SELECT COUNT(*) FROM information_schema.tables
            WHERE table_name = 'global_config') = 1,
        'global_config table not created';

    -- Verify voting_weight_mode is set to DEMOCRATIC
    ASSERT (SELECT value FROM global_config WHERE key = 'voting_weight_mode') = 'DEMOCRATIC',
        'voting_weight_mode not initialized to DEMOCRATIC';

    -- Verify helper functions exist
    ASSERT (SELECT COUNT(*) FROM pg_proc WHERE proname = 'get_voting_weight_mode') = 1,
        'get_voting_weight_mode function not created';

    ASSERT (SELECT COUNT(*) FROM pg_proc WHERE proname = 'calculate_user_vote_weight') = 1,
        'calculate_user_vote_weight function not created';

    ASSERT (SELECT COUNT(*) FROM pg_proc WHERE proname = 'set_voting_weight_mode') = 1,
        'set_voting_weight_mode function not created';

    RAISE NOTICE 'Migration 012: Voting Weight Mode Configuration - SUCCESS';
END $$;
