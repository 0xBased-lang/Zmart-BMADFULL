# Story 1.10: Implement Payout Claims Functionality

Status: Ready

## Story

As a winning bettor,
I want to claim my payout after a market resolves,
So that I receive my winnings plus share of the losing pool.

## Acceptance Criteria

1. **AC#1**: `claim_payout` instruction in CoreMarkets program
2. **AC#2**: Payout calculation: (bet_amount + proportional_share_of_losing_pool - fees)
3. **AC#3**: Pull-based claiming (users initiate, not automatic push)
4. **AC#4**: Validation: market must be RESOLVED, user must have winning bet, payout not already claimed
5. **AC#5**: UserBet account marked as "claimed" to prevent double-claims
6. **AC#6**: Tokens transferred from market pool PDA to user wallet
7. **AC#7**: Comprehensive tests for payout calculations and edge cases (dust handling, rounding)
8. **AC#8**: Deployed and tested on devnet

## Tasks / Subtasks

### Task 1: Implement claim_payout Instruction (AC: #1)
- [ ] 1.1: Add `claim_payout` instruction to CoreMarkets program
- [ ] 1.2: Define ClaimPayout context with required accounts (market, user_bet, user wallet, market pool PDA)
- [ ] 1.3: Add instruction parameters (market_id)
- [ ] 1.4: Implement basic instruction structure with account validation

### Task 2: Payout Calculation Logic (AC: #2)
- [ ] 2.1: Implement calculate_payout helper function
- [ ] 2.2: Calculate proportional share: (user_bet_amount / winning_pool_total) * losing_pool_total
- [ ] 2.3: Add user's original bet amount to proportional share
- [ ] 2.4: Subtract platform fees from payout (if applicable)
- [ ] 2.5: Handle edge cases: dust amounts, rounding errors, zero losing pool
- [ ] 2.6: Use checked arithmetic (checked_mul, checked_div) to prevent overflow

### Task 3: Pull-Based Claiming Pattern (AC: #3)
- [ ] 3.1: Design user-initiated claiming flow (not automatic distribution)
- [ ] 3.2: Users call claim_payout instruction after market resolves
- [ ] 3.3: No automatic push of payouts (reduces transaction costs for platform)
- [ ] 3.4: Document claiming process in user guide

### Task 4: Validation Logic (AC: #4)
- [ ] 4.1: Validate market status is RESOLVED before allowing claim
- [ ] 4.2: Validate user has a bet on the winning outcome
- [ ] 4.3: Validate UserBet.claimed is false (prevent double-claims)
- [ ] 4.4: Validate market outcome matches user's bet side
- [ ] 4.5: Return clear error messages for validation failures

### Task 5: Prevent Double-Claims (AC: #5)
- [ ] 5.1: Update UserBet.claimed field to true after payout
- [ ] 5.2: Add claimed_at timestamp to UserBet account
- [ ] 5.3: Database sync: Mark bet as claimed in Supabase bets table
- [ ] 5.4: Emit PayoutClaimed event for audit trail

### Task 6: Token Transfer Implementation (AC: #6)
- [ ] 6.1: Transfer SOL from market pool PDA to user wallet
- [ ] 6.2: Use CPI (Cross-Program Invocation) for SPL token transfers if needed
- [ ] 6.3: Implement proper PDA signing for market pool transfers
- [ ] 6.4: Validate sufficient funds in market pool before transfer
- [ ] 6.5: Handle transfer errors gracefully

### Task 7: Comprehensive Testing (AC: #7)
- [ ] 7.1: Anchor test: Simple payout claim (2 users, one wins)
- [ ] 7.2: Anchor test: Multiple winners claim proportional payouts
- [ ] 7.3: Anchor test: Edge case - winning pool has all bets (no losing pool)
- [ ] 7.4: Anchor test: Edge case - losing pool has all bets (winners get everything)
- [ ] 7.5: Anchor test: Dust handling and rounding (small bet amounts)
- [ ] 7.6: Anchor test: Double-claim prevention (attempt claim twice)
- [ ] 7.7: Anchor test: Premature claim (market not resolved)
- [ ] 7.8: Anchor test: Wrong outcome claim (user bet on losing side)

### Task 8: Devnet Deployment and Testing (AC: #8)
- [ ] 8.1: Deploy updated CoreMarkets program to devnet
- [ ] 8.2: Create test market on devnet
- [ ] 8.3: Place test bets on devnet
- [ ] 8.4: Resolve test market on devnet
- [ ] 8.5: Execute payout claims on devnet
- [ ] 8.6: Verify database sync with claimed status
- [ ] 8.7: Document devnet testing results

## Dev Notes

### Architecture Patterns

**Pull-Based Claiming Pattern**
- Users initiate payout claims (not automatic distribution)
- Reduces platform transaction costs
- Gives users control over claiming timing
- Standard pattern in DeFi protocols (Uniswap, Compound)

**Payout Calculation Formula**
```
winning_pool_total = sum of all bets on winning outcome
losing_pool_total = sum of all bets on losing outcome
user_proportional_share = (user_bet_amount / winning_pool_total) * losing_pool_total
user_payout = user_bet_amount + user_proportional_share - platform_fees
```

**Market Resolution Dependency (Epic 2 Story 2.5)**
- Payouts only available after market status = RESOLVED
- Resolution finality prevents dispute-related complications
- State machine: ACTIVE → PENDING_RESOLUTION → RESOLVED → (claims allowed)

**Event Listener Pattern (Story 1.9)**
- PayoutClaimed event triggers database sync
- Event structure: { market_id, user_wallet, bet_amount, payout_amount, timestamp }
- Database listener updates bets table with claimed status

### Components to Touch

**Solana Programs:**
- `programs/core-markets/src/lib.rs` - Add claim_payout instruction
- `programs/core-markets/src/lib.rs` - Update Market account (track total claimed)
- `programs/core-markets/src/lib.rs` - Update UserBet account (add claimed field)

**Database:**
- `database/migrations/013_payout_claims.sql` - Add claimed field to bets table
- `database/schema.sql` - Update bets table definition

**Event Listeners:**
- `supabase/functions/sync-events/index.ts` - Add handlePayoutClaimed handler

### Testing Standards

**Anchor Tests (Rust):**
- Location: `tests/core-markets.ts`
- Coverage: Payout calculation, claim validation, double-claim prevention
- Edge cases: Dust handling, rounding, zero losing pool, all winners/all losers

**Deno Tests (TypeScript):**
- Location: `supabase/functions/sync-events/test.ts`
- Coverage: Database updates, event handler logic

**Integration Tests:**
- Location: `tests/integration/payout-claims.ts`
- Coverage: Full flow from bet placement to payout claim

### Constraints

1. **Market Status**: Market MUST be RESOLVED before claims allowed
2. **Winning Side**: User MUST have bet on winning outcome
3. **Double-Claim Prevention**: UserBet.claimed MUST be false before claim
4. **Arithmetic Safety**: ALL calculations MUST use checked arithmetic (overflow protection)
5. **Pool Validation**: Market pool MUST have sufficient funds for payout
6. **Proportional Distribution**: Payouts MUST be proportional to bet size within winning pool
7. **Event Emission**: ALL claims MUST emit PayoutClaimed event
8. **Database Sync**: Claimed status MUST sync to database via Event Listener
9. **Pull-Based**: Users MUST initiate claims (no automatic distribution)
10. **Dust Handling**: Small amounts (dust) MUST be handled gracefully (no panics)

### Project Structure Notes

**Payout Calculation Example:**
```
Market: "Will BTC hit $100K by EOY?"
Outcome: YES (BTC hit $100K)

YES pool (winners): 1000 SOL total
  - User A: 100 SOL
  - User B: 400 SOL
  - User C: 500 SOL

NO pool (losers): 500 SOL total

User A payout calculation:
  proportional_share = (100 / 1000) * 500 = 50 SOL
  payout = 100 (original) + 50 (share) = 150 SOL

User B payout calculation:
  proportional_share = (400 / 1000) * 500 = 200 SOL
  payout = 400 (original) + 200 (share) = 600 SOL

User C payout calculation:
  proportional_share = (500 / 1000) * 500 = 250 SOL
  payout = 500 (original) + 250 (share) = 750 SOL

Total paid: 150 + 600 + 750 = 1500 SOL ✅
```

**Event Structure:**
```rust
#[event]
pub struct PayoutClaimed {
    pub market_id: u64,
    pub user: Pubkey,
    pub bet_amount: u64,
    pub payout_amount: u64,
    pub claimed_at: i64,
}
```

**Database Schema Update:**
```sql
ALTER TABLE bets ADD COLUMN claimed BOOLEAN DEFAULT FALSE;
ALTER TABLE bets ADD COLUMN claimed_at TIMESTAMPTZ;
ALTER TABLE bets ADD COLUMN payout_amount BIGINT;

CREATE INDEX idx_bets_claimed ON bets(claimed);
```

### References

- [Source: docs/epics.md#Epic 1 Story 1.10] - Story definition and acceptance criteria
- [Source: docs/architecture.md#Payout Mechanism] - Pull-based claiming design
- [Source: docs/STORY-1.4-COMPLETE.md] - CoreMarkets program and betting infrastructure
- [Source: docs/STORY-2.5-COMPLETE.md] - Market resolution state machine

## Dev Agent Record

### Context Reference

- [Story Context 1.10](story-context-1.10.xml) - Generated: 2025-10-26

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

### File List
