-- BMAD-Zmart Supabase Realtime Setup
-- Migration 005: Enable real-time subscriptions for frontend
-- Created: 2025-10-24
-- Description: Configure Realtime channels and publication settings

-- ============================================================================
-- Enable Realtime on Tables
-- ============================================================================

-- Enable realtime for markets table
ALTER PUBLICATION supabase_realtime ADD TABLE markets;

-- Enable realtime for bets table
ALTER PUBLICATION supabase_realtime ADD TABLE bets;

-- Enable realtime for proposals table
ALTER PUBLICATION supabase_realtime ADD TABLE proposals;

-- Enable realtime for proposal_votes table
ALTER PUBLICATION supabase_realtime ADD TABLE proposal_votes;

-- Enable realtime for resolution_votes table
ALTER PUBLICATION supabase_realtime ADD TABLE resolution_votes;

-- Enable realtime for activity_points table
ALTER PUBLICATION supabase_realtime ADD TABLE activity_points;

-- Enable realtime for users table
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Note: event_log is not real-time enabled (admin-only table)

-- ============================================================================
-- Create Realtime-Specific Views
-- ============================================================================

-- View for market updates with calculated fields
CREATE OR REPLACE VIEW realtime_market_updates AS
SELECT
    m.market_id,
    m.title,
    m.status,
    m.yes_pool,
    m.no_pool,
    m.total_bets,
    m.end_date,
    m.winning_outcome,
    -- Calculated fields
    (m.yes_pool + m.no_pool) AS total_pool,
    CASE
        WHEN m.yes_pool + m.no_pool = 0 THEN 50.0
        ELSE ROUND((m.yes_pool::NUMERIC / (m.yes_pool + m.no_pool)) * 100, 2)
    END AS yes_percentage,
    CASE
        WHEN m.status = 'active' AND m.end_date > NOW() THEN 'active'
        WHEN m.status = 'active' AND m.end_date <= NOW() THEN 'expired'
        ELSE m.status
    END AS computed_status,
    m.created_at,
    m.resolved_at
FROM markets m;

-- View for user activity feed
CREATE OR REPLACE VIEW realtime_user_activity AS
SELECT
    b.user_wallet,
    b.market_id,
    m.title AS market_title,
    b.position,
    b.amount,
    b.timestamp AS activity_time,
    'bet_placed' AS activity_type
FROM bets b
JOIN markets m ON b.market_id = m.market_id

UNION ALL

SELECT
    pv.voter AS user_wallet,
    rv.market_id,
    m.title AS market_title,
    rv.vote_outcome AS position,
    0 AS amount,
    rv.timestamp AS activity_time,
    'resolution_vote' AS activity_type
FROM resolution_votes rv
JOIN markets m ON rv.market_id = m.market_id
JOIN proposal_votes pv ON pv.voter = rv.voter

UNION ALL

SELECT
    p.proposer AS user_wallet,
    NULL AS market_id,
    p.description AS market_title,
    NULL AS position,
    0 AS amount,
    p.created_at AS activity_time,
    'proposal_created' AS activity_type
FROM proposals p

ORDER BY activity_time DESC;

-- ============================================================================
-- Enable Realtime on Views
-- ============================================================================

-- Note: Views cannot be added to realtime publication in Supabase
-- Frontend should subscribe to base tables and compute in real-time

-- ============================================================================
-- Create Notification Triggers for Custom Events
-- ============================================================================

-- Function to notify on market status change
CREATE OR REPLACE FUNCTION notify_market_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status THEN
        PERFORM pg_notify(
            'market_status_changed',
            json_build_object(
                'market_id', NEW.market_id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'winning_outcome', NEW.winning_outcome
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for market status changes
DROP TRIGGER IF EXISTS market_status_change_trigger ON markets;
CREATE TRIGGER market_status_change_trigger
    AFTER UPDATE ON markets
    FOR EACH ROW
    EXECUTE FUNCTION notify_market_status_change();

-- Function to notify on new bet
CREATE OR REPLACE FUNCTION notify_new_bet()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'new_bet',
        json_build_object(
            'bet_id', NEW.bet_id,
            'market_id', NEW.market_id,
            'user_wallet', NEW.user_wallet,
            'position', NEW.position,
            'amount', NEW.amount
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new bets
DROP TRIGGER IF EXISTS new_bet_trigger ON bets;
CREATE TRIGGER new_bet_trigger
    AFTER INSERT ON bets
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_bet();

-- Function to notify on proposal finalization
CREATE OR REPLACE FUNCTION notify_proposal_finalized()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status AND NEW.status IN ('approved', 'rejected') THEN
        PERFORM pg_notify(
            'proposal_finalized',
            json_build_object(
                'proposal_id', NEW.proposal_id,
                'status', NEW.status,
                'proposer', NEW.proposer
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for proposal finalization
DROP TRIGGER IF EXISTS proposal_finalized_trigger ON proposals;
CREATE TRIGGER proposal_finalized_trigger
    AFTER UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION notify_proposal_finalized();

-- ============================================================================
-- Grant Permissions for Realtime
-- ============================================================================

-- Grant read access to authenticated users for realtime subscriptions
GRANT SELECT ON realtime_market_updates TO authenticated;
GRANT SELECT ON realtime_user_activity TO authenticated;

-- Public users can also view these (RLS already configured)
GRANT SELECT ON realtime_market_updates TO anon;
GRANT SELECT ON realtime_user_activity TO anon;

-- ============================================================================
-- Realtime Configuration Notes
-- ============================================================================

/*
Frontend Subscription Examples:

1. Subscribe to market updates:
```typescript
const marketChannel = supabase
  .channel('market_updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'markets',
      filter: `market_id=eq.${marketId}`
    },
    (payload) => {
      console.log('Market updated:', payload);
      // Update UI
    }
  )
  .subscribe();
```

2. Subscribe to new bets on a market:
```typescript
const betsChannel = supabase
  .channel(`bets:${marketId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'bets',
      filter: `market_id=eq.${marketId}`
    },
    (payload) => {
      console.log('New bet:', payload);
      // Update bet list
    }
  )
  .subscribe();
```

3. Subscribe to user activity:
```typescript
const activityChannel = supabase
  .channel(`user_activity:${wallet}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'bets',
      filter: `user_wallet=eq.${wallet}`
    },
    (payload) => {
      console.log('User activity:', payload);
      // Update activity feed
    }
  )
  .subscribe();
```

4. Subscribe to custom notifications:
```typescript
const notificationChannel = supabase
  .channel('notifications')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'markets' }, (payload) => {
    if (payload.eventType === 'UPDATE' && payload.new.status !== payload.old.status) {
      // Market status changed
      console.log('Market resolved:', payload.new);
    }
  })
  .subscribe();
```

5. Broadcast to all connected clients (for live updates):
```typescript
// Send from backend/edge function
await supabase.channel('lobby').send({
  type: 'broadcast',
  event: 'market_created',
  payload: { market_id: newMarket.id }
});

// Receive on frontend
supabase
  .channel('lobby')
  .on('broadcast', { event: 'market_created' }, (payload) => {
    console.log('New market created:', payload);
    // Fetch and display new market
  })
  .subscribe();
```

Performance Considerations:
- Filter subscriptions to specific records (market_id, user_wallet)
- Unsubscribe when components unmount
- Use channel multiplexing for multiple subscriptions
- Implement debouncing for rapid updates

Scaling:
- Supabase Realtime supports ~200 concurrent connections per project
- For >200 users, implement connection pooling or websocket scaling
- Consider Redis for very high-frequency updates (>1000/sec)
*/
