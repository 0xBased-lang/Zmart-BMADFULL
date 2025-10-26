-- BMAD-Zmart Sync Gap Detection
-- Purpose: Find events that failed to sync or are missing
-- Usage: Run periodically to detect sync issues

-- ============================================================================
-- 1. Check for Failed Events (Last 24 Hours)
-- ============================================================================

SELECT
    signature,
    program_id,
    event_type,
    error_message,
    timestamp
FROM event_log
WHERE success = false
AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- ============================================================================
-- 2. Find Markets Missing from Database (On-Chain vs DB)
-- ============================================================================

-- This requires on-chain data fetch, so it's a template for manual checking
-- Replace {on_chain_market_ids} with actual IDs from Solana

WITH on_chain_markets AS (
    -- Manually populate this from Solana query
    SELECT UNNEST(ARRAY[
        -- Add market IDs from Solana here
        -- 'market_id_1',
        -- 'market_id_2',
    ]) AS market_id
)
SELECT m.market_id
FROM on_chain_markets m
LEFT JOIN markets db ON m.market_id = db.market_id
WHERE db.market_id IS NULL;

-- ============================================================================
-- 3. Detect Bet Count Mismatches
-- ============================================================================

-- Markets where total_bets doesn't match actual bet count
SELECT
    m.market_id,
    m.total_bets AS recorded_total,
    COUNT(b.bet_id) AS actual_total,
    m.total_bets - COUNT(b.bet_id) AS discrepancy
FROM markets m
LEFT JOIN bets b ON m.market_id = b.market_id
GROUP BY m.market_id, m.total_bets
HAVING m.total_bets != COUNT(b.bet_id);

-- ============================================================================
-- 4. Detect Pool Amount Mismatches
-- ============================================================================

SELECT
    m.market_id,
    m.yes_pool AS recorded_yes,
    COALESCE(SUM(CASE WHEN b.position = 'yes' THEN b.amount ELSE 0 END), 0) AS actual_yes,
    m.no_pool AS recorded_no,
    COALESCE(SUM(CASE WHEN b.position = 'no' THEN b.amount ELSE 0 END), 0) AS actual_no
FROM markets m
LEFT JOIN bets b ON m.market_id = b.market_id
GROUP BY m.market_id, m.yes_pool, m.no_pool
HAVING
    m.yes_pool != COALESCE(SUM(CASE WHEN b.position = 'yes' THEN b.amount ELSE 0 END), 0)
    OR m.no_pool != COALESCE(SUM(CASE WHEN b.position = 'no' THEN b.amount ELSE 0 END), 0);

-- ============================================================================
-- 5. Find Events with No Corresponding Database Records
-- ============================================================================

-- Market created events without markets
SELECT e.signature, e.event_type, e.timestamp
FROM event_log e
WHERE e.event_type = 'market_created'
AND e.success = true
AND NOT EXISTS (
    SELECT 1 FROM markets m
    WHERE m.created_at BETWEEN e.timestamp - INTERVAL '5 seconds'
    AND e.timestamp + INTERVAL '5 seconds'
);

-- Bet placed events without bets
SELECT e.signature, e.event_type, e.timestamp
FROM event_log e
WHERE e.event_type = 'bet_placed'
AND e.success = true
AND NOT EXISTS (
    SELECT 1 FROM bets b
    WHERE b.timestamp BETWEEN e.timestamp - INTERVAL '5 seconds'
    AND e.timestamp + INTERVAL '5 seconds'
);

-- ============================================================================
-- 6. Activity Points Sanity Check
-- ============================================================================

-- Users with bets but no activity points
SELECT DISTINCT b.user_wallet
FROM bets b
LEFT JOIN activity_points ap ON b.user_wallet = ap.user_wallet
WHERE ap.user_wallet IS NULL;

-- ============================================================================
-- 7. Slot Gap Detection
-- ============================================================================

-- Find gaps in slot sequence (missing slots)
WITH slot_sequence AS (
    SELECT
        slot,
        LAG(slot) OVER (ORDER BY slot) AS prev_slot,
        slot - LAG(slot) OVER (ORDER BY slot) AS gap
    FROM event_log
    WHERE timestamp > NOW() - INTERVAL '7 days'
)
SELECT
    prev_slot AS last_slot,
    slot AS next_slot,
    gap AS missing_slots
FROM slot_sequence
WHERE gap > 100  -- Threshold for "significant" gap
ORDER BY gap DESC;

-- ============================================================================
-- 8. Summary Dashboard Query
-- ============================================================================

SELECT
    'Total Events' AS metric,
    COUNT(*)::TEXT AS value
FROM event_log

UNION ALL

SELECT
    'Failed Events (24h)' AS metric,
    COUNT(*)::TEXT
FROM event_log
WHERE success = false
AND timestamp > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
    'Markets in DB' AS metric,
    COUNT(*)::TEXT
FROM markets

UNION ALL

SELECT
    'Bets in DB' AS metric,
    COUNT(*)::TEXT
FROM bets

UNION ALL

SELECT
    'Active Markets' AS metric,
    COUNT(*)::TEXT
FROM markets
WHERE status = 'active'

UNION ALL

SELECT
    'Resolved Markets' AS metric,
    COUNT(*)::TEXT
FROM markets
WHERE status = 'resolved';
