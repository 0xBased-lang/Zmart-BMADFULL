-- BMAD-Zmart Manual Reconciliation
-- Purpose: Manual sync for events that failed or were missed
-- Usage: Run this script with data from Solana when sync gaps are detected

-- ============================================================================
-- Helper Functions for Manual Sync
-- ============================================================================

-- Manually insert a market
CREATE OR REPLACE FUNCTION manual_insert_market(
    p_market_id TEXT,
    p_creator TEXT,
    p_title TEXT,
    p_description TEXT,
    p_category TEXT,
    p_end_date TIMESTAMP,
    p_created_at TIMESTAMP
) RETURNS VOID AS $$
BEGIN
    INSERT INTO markets (
        market_id,
        creator,
        title,
        description,
        category,
        end_date,
        status,
        yes_pool,
        no_pool,
        total_bets,
        created_at
    ) VALUES (
        p_market_id,
        p_creator,
        p_title,
        p_description,
        p_category,
        p_end_date,
        'active',
        0,
        0,
        0,
        p_created_at
    )
    ON CONFLICT (market_id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description;

    RAISE NOTICE 'Market % inserted/updated', p_market_id;
END;
$$ LANGUAGE plpgsql;

-- Manually insert a bet
CREATE OR REPLACE FUNCTION manual_insert_bet(
    p_bet_id TEXT,
    p_market_id TEXT,
    p_user_wallet TEXT,
    p_position TEXT,
    p_amount BIGINT,
    p_shares BIGINT,
    p_timestamp TIMESTAMP
) RETURNS VOID AS $$
BEGIN
    -- Ensure user exists
    INSERT INTO users (wallet, total_earned, markets_created, bets_placed, bets_won)
    VALUES (p_user_wallet, 0, 0, 0, 0)
    ON CONFLICT (wallet) DO NOTHING;

    -- Insert bet
    INSERT INTO bets (
        bet_id,
        market_id,
        user_wallet,
        position,
        amount,
        shares,
        timestamp,
        claimed
    ) VALUES (
        p_bet_id,
        p_market_id,
        p_user_wallet,
        p_position,
        p_amount,
        p_shares,
        p_timestamp,
        false
    )
    ON CONFLICT (bet_id) DO NOTHING;

    -- Update market pools
    IF p_position = 'yes' THEN
        UPDATE markets
        SET
            yes_pool = yes_pool + p_amount,
            total_bets = total_bets + 1
        WHERE market_id = p_market_id;
    ELSE
        UPDATE markets
        SET
            no_pool = no_pool + p_amount,
            total_bets = total_bets + 1
        WHERE market_id = p_market_id;
    END IF;

    RAISE NOTICE 'Bet % inserted for market %', p_bet_id, p_market_id;
END;
$$ LANGUAGE plpgsql;

-- Manually resolve a market
CREATE OR REPLACE FUNCTION manual_resolve_market(
    p_market_id TEXT,
    p_winning_outcome TEXT,
    p_resolved_at TIMESTAMP
) RETURNS VOID AS $$
BEGIN
    UPDATE markets
    SET
        status = 'resolved',
        winning_outcome = p_winning_outcome,
        resolved_at = p_resolved_at
    WHERE market_id = p_market_id;

    RAISE NOTICE 'Market % resolved with outcome: %', p_market_id, p_winning_outcome;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Example Usage
-- ============================================================================

-- 1. Insert a missing market
/*
SELECT manual_insert_market(
    'market_id_here',
    'creator_wallet_here',
    'Will BTC hit $100k?',
    'Prediction for Bitcoin price',
    'crypto',
    '2025-12-31 23:59:59',
    NOW()
);
*/

-- 2. Insert a missing bet
/*
SELECT manual_insert_bet(
    'bet_id_here',
    'market_id_here',
    'bettor_wallet_here',
    'yes',
    1000000,  -- 1 SOL in lamports
    950000,   -- shares received
    NOW()
);
*/

-- 3. Resolve a market
/*
SELECT manual_resolve_market(
    'market_id_here',
    'yes',
    NOW()
);
*/

-- ============================================================================
-- Bulk Reconciliation from On-Chain Data
-- ============================================================================

-- Template for bulk market insertion
-- Replace with actual data from Solana

/*
DO $$
DECLARE
    market RECORD;
BEGIN
    -- Loop through markets fetched from Solana
    FOR market IN
        SELECT * FROM (VALUES
            ('market_1', 'creator_1', 'Title 1', 'Desc 1', 'crypto', '2025-12-31'::TIMESTAMP),
            ('market_2', 'creator_2', 'Title 2', 'Desc 2', 'politics', '2025-11-30'::TIMESTAMP)
            -- Add more markets here
        ) AS m(market_id, creator, title, description, category, end_date)
    LOOP
        PERFORM manual_insert_market(
            market.market_id,
            market.creator,
            market.title,
            market.description,
            market.category,
            market.end_date,
            NOW()
        );
    END LOOP;
END $$;
*/

-- ============================================================================
-- Recalculate All Market Stats
-- ============================================================================

-- Use this to fix discrepancies after manual insertions
DO $$
DECLARE
    market_rec RECORD;
BEGIN
    FOR market_rec IN SELECT market_id FROM markets
    LOOP
        PERFORM refresh_market_stats(market_rec.market_id);
    END LOOP;
    RAISE NOTICE 'Refreshed stats for all markets';
END $$;

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION manual_insert_market TO service_role;
GRANT EXECUTE ON FUNCTION manual_insert_bet TO service_role;
GRANT EXECUTE ON FUNCTION manual_resolve_market TO service_role;
