-- BMAD-Zmart Activity Points System
-- Migration 003: Activity Point Triggers and Leaderboards
-- Created: 2025-10-24
-- Description: Automatic point awards and leaderboard queries

-- ============================================================================
-- Activity Point Triggers
-- ============================================================================

-- Award points when a bet is placed
CREATE OR REPLACE FUNCTION award_points_on_bet()
RETURNS TRIGGER AS $$
BEGIN
    -- Award 5 points for placing a bet
    INSERT INTO activity_points (user_wallet, activity_type, points, reference_id)
    VALUES (NEW.bettor_wallet, 'BET_PLACED', 5, NEW.market_id);

    -- Update user total
    UPDATE users
    SET activity_points = activity_points + 5,
        total_bets = total_bets + 1
    WHERE wallet_address = NEW.bettor_wallet;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_points_on_bet
    AFTER INSERT ON bets
    FOR EACH ROW
    EXECUTE FUNCTION award_points_on_bet();

-- Award points when a market is created
CREATE OR REPLACE FUNCTION award_points_on_market_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Award 20 points for creating a market
    INSERT INTO activity_points (user_wallet, activity_type, points, reference_id)
    VALUES (NEW.creator_wallet, 'MARKET_CREATED', 20, NEW.market_id);

    -- Update user total
    UPDATE users
    SET activity_points = activity_points + 20,
        total_markets_created = total_markets_created + 1
    WHERE wallet_address = NEW.creator_wallet;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_points_on_market_created
    AFTER INSERT ON markets
    FOR EACH ROW
    EXECUTE FUNCTION award_points_on_market_created();

-- Award points when voting on a proposal
CREATE OR REPLACE FUNCTION award_points_on_proposal_vote()
RETURNS TRIGGER AS $$
BEGIN
    -- Award 10 points for voting on a proposal
    INSERT INTO activity_points (user_wallet, activity_type, points, reference_id)
    VALUES (NEW.voter_wallet, 'VOTE_CAST', 10, NEW.proposal_id);

    -- Update user total
    UPDATE users
    SET activity_points = activity_points + 10
    WHERE wallet_address = NEW.voter_wallet;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_points_on_proposal_vote
    AFTER INSERT ON proposal_votes
    FOR EACH ROW
    EXECUTE FUNCTION award_points_on_proposal_vote();

-- Award bonus points for winning bets (accuracy bonus)
CREATE OR REPLACE FUNCTION award_points_on_payout_claimed()
RETURNS TRIGGER AS $$
DECLARE
    accuracy_bonus INTEGER;
BEGIN
    -- Only award bonus if bet is being claimed (not just updated)
    IF NEW.claimed = TRUE AND (OLD.claimed = FALSE OR OLD.claimed IS NULL) THEN
        -- Calculate accuracy bonus based on bet amount (larger bets = more confidence)
        accuracy_bonus := CASE
            WHEN NEW.amount >= 100000000000 THEN 50 -- 100+ SOL bet
            WHEN NEW.amount >= 10000000000 THEN 25  -- 10+ SOL bet
            WHEN NEW.amount >= 1000000000 THEN 10   -- 1+ SOL bet
            ELSE 5
        END;

        INSERT INTO activity_points (user_wallet, activity_type, points, reference_id)
        VALUES (NEW.bettor_wallet, 'PAYOUT_CLAIMED', accuracy_bonus, NEW.market_id);

        -- Update user stats
        UPDATE users
        SET activity_points = activity_points + accuracy_bonus,
            total_winnings = total_winnings + COALESCE(NEW.payout_amount, 0)
        WHERE wallet_address = NEW.bettor_wallet;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_points_on_payout_claimed
    AFTER UPDATE ON bets
    FOR EACH ROW
    WHEN (NEW.claimed = TRUE)
    EXECUTE FUNCTION award_points_on_payout_claimed();

-- ============================================================================
-- Leaderboard Functions
-- ============================================================================

-- Top users by activity points
CREATE OR REPLACE FUNCTION get_top_by_points(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    rank BIGINT,
    wallet_address TEXT,
    username TEXT,
    activity_points INTEGER,
    total_bets INTEGER,
    total_volume BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROW_NUMBER() OVER (ORDER BY u.activity_points DESC, u.total_volume_wagered DESC) as rank,
        u.wallet_address,
        u.username,
        u.activity_points,
        u.total_bets,
        u.total_volume_wagered as total_volume
    FROM users u
    WHERE u.activity_points > 0
    ORDER BY u.activity_points DESC, u.total_volume_wagered DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Top users by win rate
CREATE OR REPLACE FUNCTION get_top_by_win_rate(limit_count INTEGER DEFAULT 10, min_bets INTEGER DEFAULT 5)
RETURNS TABLE (
    rank BIGINT,
    wallet_address TEXT,
    username TEXT,
    total_bets INTEGER,
    winning_bets BIGINT,
    win_rate NUMERIC,
    total_winnings BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROW_NUMBER() OVER (ORDER BY (COUNT(CASE WHEN b.claimed = TRUE THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)) DESC) as rank,
        u.wallet_address,
        u.username,
        u.total_bets,
        COUNT(CASE WHEN b.claimed = TRUE THEN 1 END) as winning_bets,
        ROUND((COUNT(CASE WHEN b.claimed = TRUE THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) as win_rate,
        u.total_winnings
    FROM users u
    LEFT JOIN bets b ON u.wallet_address = b.bettor_wallet
    GROUP BY u.wallet_address, u.username, u.total_bets, u.total_winnings
    HAVING COUNT(*) >= min_bets
    ORDER BY win_rate DESC, u.total_winnings DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Top users by volume wagered
CREATE OR REPLACE FUNCTION get_top_by_volume(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    rank BIGINT,
    wallet_address TEXT,
    username TEXT,
    total_volume BIGINT,
    total_bets INTEGER,
    activity_points INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROW_NUMBER() OVER (ORDER BY u.total_volume_wagered DESC) as rank,
        u.wallet_address,
        u.username,
        u.total_volume_wagered as total_volume,
        u.total_bets,
        u.activity_points
    FROM users u
    WHERE u.total_volume_wagered > 0
    ORDER BY u.total_volume_wagered DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Get user activity breakdown
CREATE OR REPLACE FUNCTION get_user_activity_breakdown(user_wallet_param TEXT)
RETURNS TABLE (
    activity_type TEXT,
    points_earned INTEGER,
    activity_count BIGINT,
    last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ap.activity_type,
        SUM(ap.points)::INTEGER as points_earned,
        COUNT(*) as activity_count,
        MAX(ap.timestamp) as last_activity
    FROM activity_points ap
    WHERE ap.user_wallet = user_wallet_param
    GROUP BY ap.activity_type
    ORDER BY points_earned DESC;
END;
$$ LANGUAGE plpgsql;

-- Manual point adjustment (admin only)
CREATE OR REPLACE FUNCTION adjust_user_points(
    user_wallet_param TEXT,
    points_delta INTEGER,
    reason TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Add activity point record
    INSERT INTO activity_points (user_wallet, activity_type, points, reference_id)
    VALUES (user_wallet_param, 'MANUAL_ADJUSTMENT', points_delta, NULL);

    -- Update user total
    UPDATE users
    SET activity_points = activity_points + points_delta
    WHERE wallet_address = user_wallet_param;

    -- Log the adjustment
    RAISE NOTICE 'Adjusted points for % by %: %', user_wallet_param, points_delta, reason;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_top_by_points IS 'Get top users ranked by activity points';
COMMENT ON FUNCTION get_top_by_win_rate IS 'Get top users ranked by win rate (requires minimum bets)';
COMMENT ON FUNCTION get_top_by_volume IS 'Get top users ranked by total volume wagered';
COMMENT ON FUNCTION adjust_user_points IS 'Admin function to manually adjust user points';
