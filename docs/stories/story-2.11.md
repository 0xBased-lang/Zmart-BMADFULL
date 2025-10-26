# Story 2.11: Implement Creator Fee Claims

Status: Ready

## Story

As a market creator,
I want to claim accumulated fees from my successful market,
So that I'm rewarded for creating popular markets.

## Acceptance Criteria

1. **AC#1**: Creator fee tracking in database: market_id, creator_wallet, accumulated_fees
2. **AC#2**: Creator fee percentage based on bond tier: 0.5% (low bond), 1% (medium), 2% (high bond ≥500 ZMart)
3. **AC#3**: `claim_creator_fees` instruction in BondManager program transfers accumulated fees to creator
4. **AC#4**: Fee accumulation happens automatically via betting fee distribution (Epic 1 Story 1.4)
5. **AC#5**: Creator can claim fees once market resolves (status = RESOLVED)
6. **AC#6**: Tests validate fee accumulation, tier calculation, and claims

## Tasks / Subtasks

### Task 1: Database Schema for Creator Fee Tracking (AC: #1)
- [ ] 1.1: Create `creator_fees` table in Supabase with columns: market_id, creator_wallet, accumulated_fees, bond_tier, last_updated
- [ ] 1.2: Add indexes on market_id and creator_wallet for efficient queries
- [ ] 1.3: Create database migration for creator_fees table
- [ ] 1.4: Add RLS policies to allow creators to view their own fee data

### Task 2: Bond Tier Fee Percentage Logic (AC: #2)
- [ ] 2.1: Add bond_tier enum to BondManager: LOW, MEDIUM, HIGH
- [ ] 2.2: Implement `calculate_bond_tier` helper: <100 ZMart = LOW, 100-499 = MEDIUM, ≥500 = HIGH
- [ ] 2.3: Add fee_percentage_bps fields to ParameterStorage: low_tier_fee_bps (50 = 0.5%), medium_tier_fee_bps (100 = 1%), high_tier_fee_bps (200 = 2%)
- [ ] 2.4: Store bond_tier in market_bonds database table when bond is locked

### Task 3: Implement claim_creator_fees Instruction (AC: #3)
- [ ] 3.1: Add `claim_creator_fees` instruction to BondManager program
- [ ] 3.2: Verify market status = RESOLVED before allowing claim
- [ ] 3.3: Fetch accumulated_fees from database via CPI or cross-program read pattern
- [ ] 3.4: Transfer accumulated fees from program fee vault to creator wallet
- [ ] 3.5: Emit CreatorFeesClaimed event with market_id, creator, amount, timestamp
- [ ] 3.6: Update creator_fees table to mark fees as claimed (claimed = true, claimed_at timestamp)

### Task 4: Fee Accumulation Integration with Betting Fees (AC: #4)
- [ ] 4.1: Update `place_bet` instruction fee distribution to allocate creator fee based on bond tier
- [ ] 4.2: Calculate creator_fee_amount = (bet_fee * creator_fee_percentage) / 10000
- [ ] 4.3: Store creator fee allocation in creator_fees table (increment accumulated_fees)
- [ ] 4.4: Ensure creator fees are tracked separately from protocol fees and liquidity provider fees

### Task 5: Market Resolution Prerequisite (AC: #5)
- [ ] 5.1: Add status check in claim_creator_fees: require market.status == RESOLVED
- [ ] 5.2: Add error handling for premature claim attempts (market not resolved)
- [ ] 5.3: Validate creator wallet matches market creator
- [ ] 5.4: Add check to prevent double-claiming (fees already claimed)

### Task 6: Testing and Validation (AC: #6)
- [ ] 6.1: Anchor test: Create market with different bond tiers, validate fee percentages
- [ ] 6.2: Anchor test: Place bets, verify creator fees accumulate correctly
- [ ] 6.3: Anchor test: Resolve market, claim fees, verify transfer and event emission
- [ ] 6.4: Anchor test: Negative cases - premature claim, double claim, wrong creator
- [ ] 6.5: Deno test: Verify database updates for creator_fees table
- [ ] 6.6: Integration test: End-to-end flow from market creation → bets → resolution → fee claim

## Dev Notes

### Architecture Patterns

**Bond Manager Pattern (Story 1.5)**
- Creator fee claims integrate with existing bond_manager program
- Leverage bond tier system established in Story 1.5
- Fee vault management follows same security patterns as bond refunds

**Fee Distribution Pattern (Story 1.4)**
- Creator fees are part of the 3-way fee split: protocol (1%) + liquidity (1.5%) + creator (0.5-2%)
- Fee percentages are basis points stored in ParameterStorage
- Total fees = protocol_fee + lp_fee + creator_fee (must not exceed max_total_fee_bps)

**Market Resolution Dependency (Story 2.5)**
- Creator fees can only be claimed after market status = RESOLVED
- Resolution finality ensures no disputes can claw back fees
- Follows state machine: ACTIVE → PENDING_RESOLUTION → RESOLVED → (claim allowed)

**Event Listener Pattern (Story 1.9)**
- CreatorFeesClaimed event triggers database sync
- Event structure: { market_id, creator_wallet, amount_claimed, bond_tier, timestamp }
- Database listener updates creator_fees table with claimed status

### Components to Touch

**Solana Programs:**
- `programs/bond-manager/src/lib.rs` - Add claim_creator_fees instruction
- `programs/parameter-storage/src/lib.rs` - Add fee percentage fields for 3 bond tiers
- `programs/core-markets/src/lib.rs` - Update place_bet fee distribution to include creator fee

**Database:**
- `database/migrations/012_creator_fees_table.sql` - New migration for creator_fees table
- `database/schema.sql` - Update with creator_fees table definition

**Event Listeners:**
- `supabase/functions/sync-events/index.ts` - Add handleCreatorFeesClaimed handler
- Event handler registers CreatorFeesClaimed event from BondManager program

### Testing Standards

**Anchor Tests (Rust):**
- Location: `tests/bond-manager.ts`, `tests/core-markets.ts`
- Coverage: Bond tier calculation, fee accumulation, claim validation, event emission
- Edge cases: Premature claims, double claims, wrong creator, zero fees

**Deno Tests (TypeScript):**
- Location: `supabase/functions/sync-events/test.ts`
- Coverage: Database updates, RLS policies, event handler logic

**Integration Tests:**
- Location: `tests/integration/creator-fees.ts`
- Coverage: Full flow from market creation to fee claim, cross-program interactions

### Constraints

1. **Bond Tier Thresholds**: 0-99 = LOW (0.5%), 100-499 = MEDIUM (1%), ≥500 = HIGH (2%)
2. **Fee Basis Points**: Use basis points (10000 = 100%) for all fee calculations
3. **Overflow Protection**: All fee calculations must use checked_mul/checked_div
4. **State Machine Enforcement**: Market must be RESOLVED before claims allowed
5. **Single Claim Enforcement**: Prevent double-claiming via database claimed flag
6. **Creator Verification**: Only market creator can claim fees (wallet signature match)
7. **Event Emission**: All fee claims must emit CreatorFeesClaimed event for audit trail
8. **Database Consistency**: Use transactions for multi-table updates (creator_fees + audit_log)
9. **Parameter Storage**: Fee percentages are configurable via ParameterStorage admin updates
10. **Backward Compatibility**: Existing fee distribution (Story 1.4) must continue to work

### Project Structure Notes

**Database Schema:**
```sql
CREATE TABLE creator_fees (
  id BIGSERIAL PRIMARY KEY,
  market_id BIGINT REFERENCES markets(id),
  creator_wallet TEXT NOT NULL,
  bond_tier TEXT NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH'
  accumulated_fees BIGINT DEFAULT 0,
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_creator_fees_market ON creator_fees(market_id);
CREATE INDEX idx_creator_fees_creator ON creator_fees(creator_wallet);
```

**Event Structure:**
```rust
#[event]
pub struct CreatorFeesClaimed {
    pub market_id: u64,
    pub creator: Pubkey,
    pub amount: u64,
    pub bond_tier: BondTier,
    pub timestamp: i64,
}
```

### References

- [Source: docs/epics.md#Epic 2 Story 2.11] - Story definition and acceptance criteria
- [Source: docs/architecture.md#Fee Structure] - 3-way fee split design
- [Source: docs/STORY-1.4-COMPLETE.md] - Fee distribution implementation
- [Source: docs/STORY-1.5-COMPLETE.md] - BondManager and bond tier system
- [Source: docs/STORY-2.5-COMPLETE.md] - Market resolution state machine

## Dev Agent Record

### Context Reference

- [Story Context 2.11](story-context-2.11.xml) - Generated: 2025-10-26

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

### File List
