# Story 1.11: Implement Activity Point Tracking System

Status: Ready

## Story

As a platform user,
I want to earn activity points for participation,
So that I build governance weight and reputation.

## Acceptance Criteria

1. **AC#1**: `activity_points` table in PostgreSQL with: user_wallet, total_points, breakdown (bets, markets_created, votes, correct_predictions)
2. **AC#2**: Points awarded via database triggers on: bet placement (+5), market creation (+20), voting (+10), winning bets (+accuracy_bonus)
3. **AC#3**: Leaderboard query functions created: top_by_points, top_by_win_rate, top_by_volume
4. **AC#4**: User profile API returns activity points balance
5. **AC#5**: Points integration tested with event listener (automatic point awards)
6. **AC#6**: Manual point adjustment API for admin corrections if needed

## Tasks / Subtasks

### Task 1: Create Activity Points Database Schema (AC: #1)
- [ ] 1.1: Create `activity_points` table with columns: user_wallet (PK), total_points, last_updated
- [ ] 1.2: Create `activity_point_breakdown` table: user_wallet, points_from_bets, points_from_markets, points_from_votes, points_from_accuracy
- [ ] 1.3: Create `activity_point_history` table: id, user_wallet, action_type, points_awarded, timestamp, reference_id
- [ ] 1.4: Add indexes on user_wallet for efficient queries
- [ ] 1.5: Create database migration file
- [ ] 1.6: Add RLS policies for read access (public), write access (service role only)

### Task 2: Implement Point Award Triggers (AC: #2)
- [ ] 2.1: Create database trigger on bets table insert: award +5 points on bet placement
- [ ] 2.2: Create database trigger on markets table insert: award +20 points on market creation
- [ ] 2.3: Create database trigger on votes table insert: award +10 points on vote submission
- [ ] 2.4: Create database trigger on bets table update (claimed=true): award accuracy bonus for winning bets
- [ ] 2.5: Calculate accuracy bonus: base_points * (1 + win_rate_multiplier)
- [ ] 2.6: Update total_points and breakdown fields on each trigger execution
- [ ] 2.7: Insert record into activity_point_history for audit trail

### Task 3: Leaderboard Query Functions (AC: #3)
- [ ] 3.1: Create function `get_top_users_by_points(limit: int)` - Returns users ranked by total_points
- [ ] 3.2: Create function `get_top_users_by_win_rate(limit: int)` - Returns users ranked by win_rate (wins/total_bets)
- [ ] 3.3: Create function `get_top_users_by_volume(limit: int)` - Returns users ranked by total_bet_volume
- [ ] 3.4: Create materialized view `user_leaderboard` with aggregated stats
- [ ] 3.5: Add refresh strategy for materialized view (daily or on-demand)
- [ ] 3.6: Optimize queries with proper indexes and caching

### Task 4: User Profile API (AC: #4)
- [ ] 4.1: Create Edge Function `get-user-profile`
- [ ] 4.2: Query activity_points table for user's total_points
- [ ] 4.3: Query activity_point_breakdown for points by category
- [ ] 4.4: Calculate user stats: total_bets, total_markets_created, total_votes, win_rate
- [ ] 4.5: Return JSON response with all profile data
- [ ] 4.6: Add caching layer for frequently accessed profiles

### Task 5: Event Listener Integration Testing (AC: #5)
- [ ] 5.1: Test bet placement → automatic +5 points award
- [ ] 5.2: Test market creation → automatic +20 points award
- [ ] 5.3: Test vote submission → automatic +10 points award
- [ ] 5.4: Test winning bet claim → automatic accuracy bonus award
- [ ] 5.5: Verify total_points calculation is correct
- [ ] 5.6: Verify activity_point_history records are created
- [ ] 5.7: Test concurrent point awards (race conditions)

### Task 6: Admin Point Adjustment API (AC: #6)
- [ ] 6.1: Create Edge Function `admin-adjust-points`
- [ ] 6.2: Validate admin wallet authorization
- [ ] 6.3: Accept parameters: user_wallet, adjustment_amount, reason
- [ ] 6.4: Update activity_points table with adjustment
- [ ] 6.5: Log adjustment in activity_point_history with admin flag
- [ ] 6.6: Return updated point balance

## Dev Notes

### Architecture Patterns

**Event-Driven Point Awards (Story 1.9)**
- Database triggers automatically award points on user actions
- Leverages Event Listener pattern for automatic point distribution
- No manual intervention required for standard point awards
- Audit trail maintained in activity_point_history table

**Leaderboard Design**
- Materialized view for performance (pre-aggregated stats)
- Multiple ranking dimensions: points, win rate, volume
- Refresh strategy balances freshness vs. performance
- Indexes optimize query performance

**Activity Point Breakdown**
- Granular tracking: bets, markets_created, votes, accuracy
- Enables analytics and gamification
- Supports weighted governance (Story 2.8)
- Transparent point sources for users

**Accuracy Bonus Formula**
```
Base points for winning bet: 5 points
Win rate multiplier: user_win_rate / platform_avg_win_rate
Accuracy bonus: 5 * (1 + win_rate_multiplier)

Example:
- User win rate: 70%
- Platform avg win rate: 50%
- Win rate multiplier: 0.7 / 0.5 = 1.4
- Accuracy bonus: 5 * (1 + 1.4) = 12 points
```

### Components to Touch

**Database:**
- `database/migrations/014_activity_points.sql` - Activity points tables and triggers
- `database/schema.sql` - Update with activity points schema

**Edge Functions:**
- `supabase/functions/get-user-profile/index.ts` - User profile API with activity points
- `supabase/functions/admin-adjust-points/index.ts` - Admin point adjustment API

**Event Listeners:**
- Database triggers handle automatic point awards (no code changes to sync-events)

### Testing Standards

**Database Tests:**
- Location: `database/migrations/test/activity-points.test.sql`
- Coverage: Trigger logic, leaderboard queries, RLS policies
- Edge cases: Concurrent awards, negative adjustments, zero points

**Deno Tests (TypeScript):**
- Location: `supabase/functions/get-user-profile/test.ts`
- Coverage: Profile API response, caching logic
- Edge cases: User with no activity, new user, admin adjustments

**Integration Tests:**
- Location: `tests/integration/activity-points.ts`
- Coverage: End-to-end point awards from user actions
- Edge cases: Multiple simultaneous actions, point award race conditions

### Constraints

1. **Automatic Awards**: Points MUST be awarded automatically via database triggers (no manual processing)
2. **Audit Trail**: ALL point changes MUST be logged in activity_point_history
3. **Consistency**: total_points MUST equal sum of all awards in history (verifiable)
4. **Race Conditions**: Concurrent point awards MUST be handled correctly (database-level locking)
5. **Admin-Only Adjustments**: Manual point adjustments MUST require admin authorization
6. **Non-Negative**: total_points MUST NOT go negative (validation required)
7. **Performance**: Leaderboard queries MUST complete in <100ms (materialized views)
8. **Transparency**: Users MUST be able to see point breakdown by category
9. **Accuracy Bonus**: Winning bets MUST award bonus based on user's historical win rate
10. **Governance Integration**: Activity points MUST be queryable for weighted voting (Story 2.8)

### Project Structure Notes

**Database Schema:**
```sql
CREATE TABLE activity_points (
  user_wallet TEXT PRIMARY KEY,
  total_points BIGINT DEFAULT 0,
  points_from_bets BIGINT DEFAULT 0,
  points_from_markets BIGINT DEFAULT 0,
  points_from_votes BIGINT DEFAULT 0,
  points_from_accuracy BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activity_point_history (
  id BIGSERIAL PRIMARY KEY,
  user_wallet TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'bet', 'market', 'vote', 'win', 'admin_adjustment'
  points_awarded BIGINT NOT NULL,
  reference_id BIGINT, -- bet_id, market_id, vote_id
  reason TEXT, -- For admin adjustments
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_points_total ON activity_points(total_points DESC);
CREATE INDEX idx_activity_history_user ON activity_point_history(user_wallet);
CREATE INDEX idx_activity_history_created ON activity_point_history(created_at DESC);
```

**Point Award Triggers:**
```sql
-- Trigger on bets table
CREATE OR REPLACE FUNCTION award_bet_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_points (user_wallet, total_points, points_from_bets)
  VALUES (NEW.user_wallet, 5, 5)
  ON CONFLICT (user_wallet)
  DO UPDATE SET
    total_points = activity_points.total_points + 5,
    points_from_bets = activity_points.points_from_bets + 5;

  INSERT INTO activity_point_history (user_wallet, action_type, points_awarded, reference_id)
  VALUES (NEW.user_wallet, 'bet', 5, NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_bet_points
AFTER INSERT ON bets
FOR EACH ROW
EXECUTE FUNCTION award_bet_points();
```

**Leaderboard Materialized View:**
```sql
CREATE MATERIALIZED VIEW user_leaderboard AS
SELECT
  ap.user_wallet,
  ap.total_points,
  COUNT(DISTINCT b.id) as total_bets,
  COUNT(DISTINCT CASE WHEN b.claimed THEN b.id END) as winning_bets,
  COALESCE(COUNT(DISTINCT CASE WHEN b.claimed THEN b.id END)::FLOAT / NULLIF(COUNT(DISTINCT b.id), 0), 0) as win_rate,
  COALESCE(SUM(b.amount), 0) as total_volume
FROM activity_points ap
LEFT JOIN bets b ON b.user_wallet = ap.user_wallet
GROUP BY ap.user_wallet, ap.total_points
ORDER BY ap.total_points DESC;

CREATE INDEX idx_leaderboard_points ON user_leaderboard(total_points DESC);
CREATE INDEX idx_leaderboard_win_rate ON user_leaderboard(win_rate DESC);
CREATE INDEX idx_leaderboard_volume ON user_leaderboard(total_volume DESC);
```

### References

- [Source: docs/epics.md#Epic 1 Story 1.11] - Story definition and acceptance criteria
- [Source: docs/architecture.md#Activity Point Meritocracy] - Participation-based governance design
- [Source: docs/STORY-1.9-COMPLETE.md] - Event Listener pattern for automatic point awards
- [Source: docs/STORY-1.8-COMPLETE.md] - Database infrastructure

## Dev Agent Record

### Context Reference

- [Story Context 1.11](story-context-1.11.xml) - Generated: 2025-10-26

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

### File List
