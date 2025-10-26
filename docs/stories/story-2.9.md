# Story 2.9: Implement Stale Market Auto-Cancellation

Status: Ready for Dev

## Story

As a platform operator,
I want markets that never resolve to automatically cancel and refund bets,
So that users don't have funds locked indefinitely.

## Acceptance Criteria

1. `stale_market_threshold` parameter in ParameterStorage (default: 30 days after end_date)
2. Supabase cron job `check-stale-markets` runs daily
3. Markets in ENDED status for >threshold days automatically marked CANCELLED
4. `cancel_market` instruction in CoreMarkets program refunds all bets proportionally
5. All UserBet accounts for cancelled market marked as "refunded"
6. Event emitted for cancellation, synced to database
7. Tests validate stale market detection and full refund logic

## Tasks / Subtasks

- [ ] Add stale_market_threshold parameter to ParameterStorage (AC: #1)
  - [ ] Define parameter in ParameterStorage program state
  - [ ] Set default value: 30 days (2592000 seconds)
  - [ ] Create set_stale_market_threshold instruction
  - [ ] Add parameter query function

- [ ] Create check-stale-markets Supabase Edge Function (AC: #2, #3)
  - [ ] Initialize Edge Function directory and config
  - [ ] Implement daily cron job trigger (Supabase cron)
  - [ ] Query markets with status = ENDED and end_date + threshold < NOW
  - [ ] Mark identified markets as CANCELLED
  - [ ] Log stale market cancellations for audit
  - [ ] Handle errors gracefully (retry logic)

- [ ] Implement cancel_market instruction in CoreMarkets (AC: #4, #5)
  - [ ] Create cancel_market instruction in CoreMarkets program
  - [ ] Calculate proportional refunds for all bets
  - [ ] Update all UserBet accounts to "refunded" status
  - [ ] Transfer refunded amounts back to user wallets
  - [ ] Validate all bets refunded before finalizing

- [ ] Emit cancellation event and sync to database (AC: #6)
  - [ ] Define MarketCancelled event in CoreMarkets
  - [ ] Emit event with market_id, reason, timestamp
  - [ ] Event listener catches cancellation event
  - [ ] Update database: market status → CANCELLED
  - [ ] Store cancellation metadata (reason, refund_count)

- [ ] Create database migration for stale market tracking (AC: #2, #6)
  - [ ] Add cancelled_at timestamp to markets table
  - [ ] Add cancellation_reason TEXT column
  - [ ] Add stale_market_cancellations audit log table
  - [ ] Create indexes for stale market queries

- [ ] Write comprehensive tests (AC: #7)
  - [ ] Test stale market detection (market > threshold days)
  - [ ] Test proportional refund calculation
  - [ ] Test all UserBet accounts marked "refunded"
  - [ ] Test edge case: market exactly at threshold
  - [ ] Test edge case: no bets on stale market
  - [ ] Test cron job execution and error handling

## Dev Notes

### Architecture Context

**Epic 2 Focus:** Community Governance with gas-free voting and dispute resolution

**Story 2.9 Position:** Implements automatic cancellation and refund for markets that never resolve, protecting users from indefinitely locked funds. This is a safety mechanism for platform reliability.

**Key Components:**
- **ParameterStorage:** stale_market_threshold parameter (configurable timeout)
- **Supabase Cron Job:** Daily check-stale-markets Edge Function
- **CoreMarkets Program:** cancel_market instruction for refunds
- **Event Listener:** Sync cancellation events to database

### Integration Points

**Dependencies:**
- Epic 1 Story 1.4: CoreMarkets Program (cancel_market instruction)
- Story 2.3: Market Resolution Flow (market status transitions)
- Epic 1 Story 1.9: Event Listener (event sync to database) - ⚠️ NOT YET IMPLEMENTED

**Data Flow:**
```
Supabase cron triggers check-stale-markets (daily) →
Edge Function queries markets with ENDED status + threshold passed →
For each stale market:
  ↓
Call cancel_market instruction (on-chain) →
Calculate proportional refunds for all bets →
Update UserBet accounts → "refunded" status →
Transfer refunded SOL to user wallets →
Emit MarketCancelled event →
Event listener syncs to database (if 1.9 implemented) →
Market status → CANCELLED in database
```

### Project Structure Notes

**New Files:**
- `supabase/functions/check-stale-markets/index.ts` - Cron job Edge Function
- `supabase/functions/check-stale-markets/deno.json` - Deno configuration
- `database/migrations/010_stale_market_cancellation.sql` - Database schema updates

**Modified Files:**
- `programs/core-markets/src/instructions/` - Add cancel_market.rs
- `programs/core-markets/src/lib.rs` - Export cancel_market instruction

**Database Schema:**
```sql
-- Add to markets table
ALTER TABLE markets
ADD COLUMN cancelled_at TIMESTAMPTZ,
ADD COLUMN cancellation_reason TEXT;

-- Audit log for stale market cancellations
CREATE TABLE stale_market_cancellations (
  id BIGSERIAL PRIMARY KEY,
  market_id BIGINT NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  threshold_days INTEGER NOT NULL,
  bet_count INTEGER NOT NULL,
  total_refunded BIGINT NOT NULL,
  FOREIGN KEY (market_id) REFERENCES markets(market_id)
);
```

**Alignment with Architecture:**
- Uses ParameterStorage for configurable threshold (established pattern)
- Supabase cron job for automated daily checks (serverless pattern)
- On-chain cancel_market for trustless refunds (Solana program)
- Event emission for database sync (established Epic 1 pattern)

### Testing Strategy

**Unit Tests:**
- Stale market detection logic (threshold calculation)
- Proportional refund calculation (multiple bets)
- UserBet status update logic
- Parameter query and default value

**Integration Tests:**
- Full stale market flow: ENDED → threshold passed → CANCELLED → refunds processed
- Cron job execution: check-stale-markets runs successfully
- Event emission and database sync (if Story 1.9 implemented)
- Multiple stale markets cancelled in single cron run

**Edge Cases:**
- Market exactly at threshold (30 days, 0 hours, 0 minutes)
- Stale market with zero bets (should still cancel)
- Stale market with one bet (refund = 100%)
- Stale market with uneven bet amounts (proportional refund)
- Cron job fails (retry logic, error logging)
- cancel_market instruction fails (transaction rollback)

**End-to-End Tests:**
- Complete market lifecycle: ACTIVE → ENDED → stale → CANCELLED → refunds claimed
- Integration with dispute flow: ensure cancelled markets cannot be disputed
- Full platform health check (deferred to Story 2.12 or Epic 4)

### Stale Market Threshold Strategy

**Default Threshold:** 30 days after end_date
- Reasonable grace period for resolution
- Protects users from indefinite fund locking
- Configurable via ParameterStorage for flexibility

**Threshold Calculation:**
```typescript
const isStaleMarket = (market: Market, thresholdDays: number): boolean => {
  const now = new Date();
  const endDate = new Date(market.end_date);
  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
  const staleDeadline = new Date(endDate.getTime() + thresholdMs);

  return market.status === 'ENDED' && now > staleDeadline;
};
```

**Cancellation Logic:**
1. Query all markets with status = ENDED
2. Filter markets where end_date + threshold < NOW
3. For each stale market:
   - Call cancel_market instruction (on-chain)
   - Refund all bets proportionally
   - Emit MarketCancelled event
   - Log cancellation for audit

**Refund Calculation:**
```
For each bet on cancelled market:
  refund_amount = bet_amount (100% refund)

All bets are refunded in full (not proportional to outcome)
Total refunded = sum of all bet amounts
```

### Implementation Notes

**Cron Job Configuration:**
- Schedule: Daily at 00:00 UTC
- Timeout: 5 minutes (sufficient for batch processing)
- Retry: 3 attempts on failure
- Logging: All executions logged for monitoring

**cancel_market Instruction:**
- Authority: Platform admin or automated cron (needs authorization)
- Validation: Market must be in ENDED status
- Refund: Transfer SOL from market escrow to user wallets
- Event: Emit MarketCancelled with market_id, refund_count, total_refunded

**Database Sync:**
- If Story 1.9 (Event Listener) is implemented: automatic sync
- If Story 1.9 NOT implemented: manual database update in cron job
- Audit log always populated for transparency

**Error Handling:**
- Cron job failure: Log error, retry on next run
- cancel_market failure: Skip market, log error, continue with others
- Database sync failure: Log error, market still cancelled on-chain (source of truth)

### Prerequisites Status

**✅ Epic 1 Story 1.4:** CoreMarkets Program - DONE
- CoreMarkets program exists
- Can add cancel_market instruction

**✅ Story 2.3:** Market Resolution Flow - DONE
- Market status transitions established
- ENDED status exists

**⚠️ Epic 1 Story 1.9:** Event Listener - NOT YET IMPLEMENTED
- Story 2.9 can work without it (manual database update in cron job)
- When Story 1.9 is implemented, sync becomes automatic

**Decision:** Implement Story 2.9 with manual database update in cron job. When Story 1.9 is implemented later, replace manual update with event listener.

### References

- [Source: docs/epics.md - Story 2.9: Acceptance Criteria and Prerequisites]
- [Source: docs/stories/story-1.4.md - CoreMarkets Program implementation]
- [Source: docs/stories/story-2.3.md - Market status transitions]
- [Source: docs/architecture.md - Supabase cron job pattern, event emission]

## Dev Agent Record

### Context Reference

- [Story Context 2.9](story-context-2.9.xml) - Generated: 2025-10-26

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

### File List
