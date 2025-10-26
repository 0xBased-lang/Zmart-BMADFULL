# BMAD-Zmart Governance Workflow Documentation

**Epic 2: Community Governance - Complete Integration Flow**

**Last Updated:** 2025-10-26
**Status:** Epic 2 Complete - Testing Deferred to Epic 4

---

## Table of Contents

1. [Overview](#overview)
2. [Complete Governance Flow](#complete-governance-flow)
3. [State Machine](#state-machine)
4. [Component Integration Map](#component-integration-map)
5. [Event Flow](#event-flow)
6. [Database Schema Integration](#database-schema-integration)
7. [Epic 2 Feature Summary](#epic-2-feature-summary)
8. [Epic 4 Test Plan](#epic-4-test-plan)

---

## Overview

The BMAD-Zmart governance system enables community-driven market creation and resolution through a gas-free voting mechanism. Epic 2 implemented 12 stories covering the complete governance lifecycle from proposal creation to dispute resolution.

**Key Features:**
- ✅ Gas-free voting via Snapshot-style signatures (Story 2.1, 2.2)
- ✅ On-chain vote aggregation and result posting (Story 2.3)
- ✅ Proposal approval/rejection logic (Story 2.5)
- ✅ Dispute flagging and admin override (Story 2.6, 2.7)
- ✅ Weighted voting modes: Democratic vs Activity-based (Story 2.8)
- ✅ Stale market auto-cancellation (Story 2.9)
- ✅ Graduated bond refunds (Story 2.10)
- ✅ Tiered creator fee claims (Story 2.11)

---

## Complete Governance Flow

### Phase 1: Market Proposal

**Actors:** Market Creator, Community

**Flow:**
```
1. Creator submits proposal via ProposalSystem
   ├─> Deposits bond (BondManager)
   ├─> Bond tier determines creator fee percentage (0.5%, 1%, 2%)
   └─> Proposal enters PROPOSED state

2. Community votes on proposal (gas-free)
   ├─> Users sign vote messages off-chain (Ed25519)
   ├─> No SOL spent by voters
   ├─> Vote collection via Edge Function
   └─> Votes stored in database

3. Vote aggregation (on-chain transaction)
   ├─> Aggregate signature verification
   ├─> Result posted to ProposalSystem
   └─> Only this step costs SOL

4. Proposal approval/rejection
   ├─> If approved → Market created in CoreMarkets
   ├─> If rejected → Bond refunded (50% per graduated refund logic)
   └─> Creator notified of outcome
```

**Programs Involved:**
- `programs/proposal-system/` - Proposal creation and approval
- `programs/bond-manager/` - Bond escrow and refunds
- `programs/parameter-storage/` - Configuration parameters

**Database Tables:**
- `proposals` - Proposal metadata
- `votes` - Individual votes (off-chain signatures)
- `bond_escrows` - Bond tracking

**Events Emitted:**
- `ProposalCreated` - When proposal submitted
- `BondDeposited` - When bond locked
- `VoteAggregated` - When votes processed
- `ProposalApproved` / `ProposalRejected` - Outcome
- `BondRefunded` - When bond returned

---

### Phase 2: Market Activity

**Actors:** Bettors, Market Creator

**Flow:**
```
1. Market created (if proposal approved)
   ├─> Market enters ACTIVE state
   ├─> Market parameters set from proposal
   └─> Market listed publicly

2. Users place bets
   ├─> Bet amount split into: pool + platform fee + creator fee
   ├─> Creator fee percentage based on bond tier (0.5%, 1%, 2%)
   ├─> Fees accumulate in Market.total_creator_fees
   └─> BondEscrow.accumulated_fees tracks creator share

3. Market reaches end_date
   ├─> Status changes from ACTIVE to VOTING
   ├─> Betting disabled
   └─> Resolution voting begins
```

**Programs Involved:**
- `programs/core-markets/` - Market creation and betting
- `programs/bond-manager/` - Creator fee accumulation
- `programs/parameter-storage/` - Fee percentages

**Database Tables:**
- `markets` - Market metadata and state
- `bets` - Individual bet records
- `creator_fees` - Fee accumulation tracking

**Events Emitted:**
- `MarketCreated` - When market goes live
- `BetPlaced` - Each bet
- `CreatorFeesAdded` - Fee accumulation
- `MarketVotingStarted` - Resolution phase begins

---

### Phase 3: Resolution Voting

**Actors:** Community, Disputers

**Flow:**
```
1. Voting period opens
   ├─> voting_period_start → voting_period_end (48 hours typical)
   ├─> Community votes on outcome (gas-free, same as proposal voting)
   └─> Votes collected off-chain

2. Voting mode determines weights
   ├─> DEMOCRATIC mode: 1 vote per user (equal weight)
   ├─> ACTIVITY_WEIGHTED mode: Votes weighted by activity points
   └─> Mode configured via ParameterStorage

3. Vote aggregation
   ├─> Aggregate signatures verified on-chain
   ├─> Winning outcome determined
   └─> Result posted to MarketResolution program

4. Dispute handling (optional)
   ├─> Users can flag questionable resolutions
   ├─> Dispute window: 48 hours (configurable)
   ├─> Admin reviews disputed markets
   └─> Admin can override if needed
```

**Programs Involved:**
- `programs/market-resolution/` - Resolution voting and outcome
- `programs/parameter-storage/` - Voting configuration
- `programs/proposal-system/` - Admin override capability

**Database Tables:**
- `votes` - Resolution votes
- `disputes` - Dispute records
- `admin_overrides` - Override audit trail

**Events Emitted:**
- `ResolutionVoteSubmitted` - Each resolution vote
- `ResolutionAggregated` - Outcome determined
- `DisputeFlagged` - Dispute raised
- `AdminOverride` - Admin intervention

---

### Phase 4: Market Finalization

**Actors:** Winners, Market Creator, System

**Flow:**
```
1. Market resolves to final outcome
   ├─> Status: VOTING → RESOLVED
   ├─> Winning side determined (YES or NO)
   └─> Payout calculation triggered

2. Winners claim payouts
   ├─> Proportional to bet size and pool
   ├─> Payout = (bet / winning_pool) * total_pool
   └─> Claimed flag prevents double-claiming

3. Creator claims accumulated fees
   ├─> Fee amount based on bond tier
   ├─> Transfer from BondEscrow to creator
   └─> accumulated_fees reset to 0

4. Creator bond refunded
   ├─> Refund percentage based on proposal outcome:
   │   ├─> Approved proposal: 100% refund
   │   ├─> Rejected proposal: 50% refund
   │   └─> Cancelled market: 100% refund
   └─> Bond returned to creator

5. Stale market handling (if voting deadline passed)
   ├─> Auto-cancel if voting_period_end + stale_threshold exceeded
   ├─> All bets refunded
   └─> Creator bond refunded (100% for cancellation)
```

**Programs Involved:**
- `programs/core-markets/` - Payout claims
- `programs/bond-manager/` - Fee and bond refunds
- `programs/market-resolution/` - Final resolution

**Database Tables:**
- `payouts` - Payout records
- `creator_fees` - Fee claims
- `bond_escrows` - Bond refunds
- `markets` - Final status

**Events Emitted:**
- `MarketResolved` - Final outcome
- `PayoutClaimed` - Winner payouts
- `CreatorFeesClaimed` - Creator fee withdrawal
- `BondRefunded` - Bond returned
- `MarketCancelled` - Stale market cleanup

---

## State Machine

### Proposal State Machine

```
PROPOSED
   │
   ├──> Vote Collection (off-chain)
   │
   ├──> Vote Aggregation (on-chain)
   │
   ├─[APPROVED]──> Market Created
   │                    │
   │                    └──> ACTIVE (Market State)
   │
   └─[REJECTED]──> Bond Refunded (50%)
```

### Market State Machine

```
ACTIVE
   │
   ├──> Betting Phase
   │
   ├──> end_date reached
   │
   v
VOTING
   │
   ├──> Resolution Vote Collection
   │
   ├──> Vote Aggregation
   │
   ├──> [DISPUTED?]
   │        │
   │        ├─[YES]──> Admin Review
   │        │              │
   │        │              ├─[OVERRIDE]──> RESOLVED (admin outcome)
   │        │              │
   │        │              └─[CONFIRM]──> RESOLVED (original outcome)
   │        │
   │        └─[NO]──> RESOLVED
   │
   v
RESOLVED
   │
   ├──> Payouts Claimed
   ├──> Creator Fees Claimed
   ├──> Bond Refunded
   │
   v
COMPLETED

Alternative Path:
VOTING ──> [voting_period_end + stale_threshold exceeded]
   │
   v
CANCELLED
   │
   ├──> All Bets Refunded
   ├──> Creator Bond Refunded (100%)
   │
   v
COMPLETED
```

### Bond State Machine

```
DEPOSITED (Active)
   │
   ├─[Proposal Approved]──> LOCKED (accumulating fees)
   │                            │
   │                            ├──> Market Resolves
   │                            │
   │                            ├──> Fees Claimed
   │                            │
   │                            └──> REFUNDED (100%)
   │
   ├─[Proposal Rejected]──> PARTIAL_REFUND (50%)
   │
   ├─[Market Cancelled]──> REFUNDED (100%)
   │
   └─[Fraud/Dispute]──> SLASHED (0%)
```

---

## Component Integration Map

### Cross-Program Interactions

```
┌──────────────────┐
│ ProposalSystem   │
│  - Proposals     │
│  - Voting        │
└────────┬─────────┘
         │
         │ CPI: deposit_bond
         v
┌──────────────────┐
│  BondManager     │
│  - Bond Escrow   │
│  - Fee Tracking  │
└────────┬─────────┘
         │
         │ CPI: create_market (if approved)
         v
┌──────────────────┐
│  CoreMarkets     │
│  - Markets       │
│  - Betting       │
└────────┬─────────┘
         │
         │ Reads: bond_tier for fee calculation
         │
         ├──> BondManager (add_creator_fees)
         │
         │ After end_date
         v
┌──────────────────┐
│MarketResolution  │
│  - Voting        │
│  - Disputes      │
│  - Finalization  │
└────────┬─────────┘
         │
         │ CPI: resolve_market
         v
┌──────────────────┐
│  CoreMarkets     │
│  - Payouts       │
└────────┬─────────┘
         │
         │ CPI: claim_creator_fees, refund_bond
         v
┌──────────────────┐
│  BondManager     │
│  - Refunds       │
└──────────────────┘

All programs read from:
┌──────────────────┐
│ ParameterStorage │
│  - Config Params │
│  - Fee Settings  │
└──────────────────┘
```

### Database Integration via Event Listener

```
Solana Programs ──[Emit Events]──> Event Listener ──[Sync]──> Supabase Database
                                  (sync-events)

Events:
- ProposalCreated, BondDeposited, VoteAggregated
- ProposalApproved, ProposalRejected
- MarketCreated, BetPlaced, CreatorFeesAdded
- ResolutionVoteSubmitted, ResolutionAggregated
- DisputeFlagged, AdminOverride
- MarketResolved, PayoutClaimed, CreatorFeesClaimed
- BondRefunded, MarketCancelled

Database Tables:
- proposals, votes, bond_escrows
- markets, bets, creator_fees
- disputes, admin_overrides
- payouts, resolutions
```

---

## Event Flow

### Proposal Phase Events

```
1. ProposalCreated
   ├─> Fields: proposal_id, creator, market_params, bond_tier
   ├─> Synced to: proposals table
   └─> Triggers: Bond deposit

2. BondDeposited
   ├─> Fields: market_id, creator, bond_amount, bond_tier
   ├─> Synced to: bond_escrows table
   └─> Triggers: Voting period opens

3. VoteSubmitted (off-chain)
   ├─> Fields: proposal_id, voter, vote_choice, signature
   ├─> Stored in: votes table
   └─> Awaiting: Aggregation

4. VoteAggregated
   ├─> Fields: proposal_id, yes_count, no_count, result
   ├─> Synced to: proposals table (result field)
   └─> Triggers: Approval/rejection decision

5. ProposalApproved OR ProposalRejected
   ├─> Fields: proposal_id, outcome, timestamp
   ├─> Synced to: proposals table (status field)
   └─> Triggers: Market creation OR bond refund
```

### Market Phase Events

```
6. MarketCreated
   ├─> Fields: market_id, creator, parameters, bond_tier
   ├─> Synced to: markets table
   └─> Triggers: Market goes live (ACTIVE)

7. BetPlaced
   ├─> Fields: market_id, bettor, amount, side, creator_fee
   ├─> Synced to: bets table
   └─> Triggers: Fee accumulation

8. CreatorFeesAdded
   ├─> Fields: market_id, fee_amount, total_accumulated
   ├─> Synced to: creator_fees table (increment accumulated_fees)
   └─> Available for: Creator claim

9. MarketVotingStarted
   ├─> Fields: market_id, voting_period_start, voting_period_end
   ├─> Synced to: markets table (status = VOTING)
   └─> Triggers: Resolution voting opens
```

### Resolution Phase Events

```
10. ResolutionVoteSubmitted (off-chain)
    ├─> Fields: market_id, voter, outcome_vote, signature, activity_points
    ├─> Stored in: votes table
    └─> Awaiting: Aggregation

11. ResolutionAggregated
    ├─> Fields: market_id, yes_count, no_count, winning_outcome, mode
    ├─> Synced to: markets table (resolved_outcome field)
    └─> Triggers: Dispute window opens

12. DisputeFlagged (optional)
    ├─> Fields: market_id, disputer, reason, timestamp
    ├─> Synced to: disputes table
    └─> Triggers: Admin review required

13. AdminOverride (optional)
    ├─> Fields: market_id, admin, original_outcome, override_outcome, reason
    ├─> Synced to: admin_overrides table
    └─> Triggers: Resolution finalized

14. MarketResolved
    ├─> Fields: market_id, final_outcome, timestamp
    ├─> Synced to: markets table (status = RESOLVED)
    └─> Triggers: Payout claims enabled
```

### Finalization Phase Events

```
15. PayoutClaimed
    ├─> Fields: market_id, bettor, amount, timestamp
    ├─> Synced to: payouts table
    └─> Updates: bets table (claimed = true)

16. CreatorFeesClaimed
    ├─> Fields: market_id, creator, fee_amount, bond_tier, timestamp
    ├─> Synced to: creator_fees table (claimed = true, claimed_at, claimed_amount)
    └─> Updates: bond_escrows table (accumulated_fees = 0)

17. BondRefunded
    ├─> Fields: market_id, creator, refund_amount, refund_type, timestamp
    ├─> Synced to: bond_escrows table (status = REFUNDED)
    └─> Updates: Proposal outcome determines refund %

18. MarketCancelled (stale markets)
    ├─> Fields: market_id, reason, timestamp
    ├─> Synced to: markets table (status = CANCELLED)
    └─> Triggers: Refund all bets + bond
```

---

## Database Schema Integration

### Key Tables and Relationships

```sql
-- Proposals and Voting
proposals
  ├─> votes (1-to-many)
  ├─> bond_escrows (1-to-1 via market_id)
  └─> markets (1-to-1 if approved)

-- Markets and Activity
markets
  ├─> bets (1-to-many)
  ├─> creator_fees (1-to-1)
  ├─> votes (1-to-many for resolution)
  ├─> disputes (1-to-many, optional)
  └─> payouts (1-to-many)

-- Bonds and Fees
bond_escrows
  ├─> proposals (1-to-1 via market_id)
  ├─> markets (1-to-1 via market_id)
  └─> creator_fees (1-to-1 via market_id)

-- Voting and Resolution
votes
  ├─> proposals (many-to-1, proposal voting)
  ├─> markets (many-to-1, resolution voting)
  └─> users (many-to-1)

-- Disputes and Admin
disputes
  ├─> markets (many-to-1)
  └─> admin_overrides (1-to-1, optional)
```

### Data Flow Examples

**Proposal Approval:**
```sql
-- 1. Proposal created
INSERT INTO proposals (id, creator, status, bond_tier)
VALUES (1, 'creator_pubkey', 'PROPOSED', 'TIER3');

-- 2. Bond deposited
INSERT INTO bond_escrows (market_id, creator, bond_amount, bond_tier, status)
VALUES (1, 'creator_pubkey', 1000000000, 'TIER3', 'ACTIVE');

-- 3. Votes submitted (off-chain)
INSERT INTO votes (proposal_id, voter, vote_choice, signature)
VALUES (1, 'voter1', 'YES', 'sig1'), (1, 'voter2', 'YES', 'sig2');

-- 4. Votes aggregated
UPDATE proposals SET status = 'APPROVED', yes_count = 2, no_count = 0
WHERE id = 1;

-- 5. Market created
INSERT INTO markets (market_id, creator, bond_tier, status)
VALUES (1, 'creator_pubkey', 'TIER3', 'ACTIVE');
```

**Resolution and Payout:**
```sql
-- 1. Market enters voting
UPDATE markets SET status = 'VOTING', voting_period_start = NOW()
WHERE market_id = 1;

-- 2. Resolution votes
INSERT INTO votes (market_id, voter, outcome_vote, activity_points)
VALUES (1, 'voter1', 'YES', 100), (1, 'voter2', 'YES', 50);

-- 3. Aggregation (weighted mode)
-- yes_weight = 100 + 50 = 150, no_weight = 0
UPDATE markets SET status = 'RESOLVED', resolved_outcome = 'YES'
WHERE market_id = 1;

-- 4. Payouts claimed
INSERT INTO payouts (market_id, bettor, amount)
VALUES (1, 'bettor1', 150000000);

UPDATE bets SET claimed = true WHERE market_id = 1 AND bettor = 'bettor1';
```

**Creator Fee Claim:**
```sql
-- 1. Fees accumulated during betting (triggered by BetPlaced events)
UPDATE creator_fees
SET accumulated_fees = accumulated_fees + 2000000
WHERE market_id = 1;

-- 2. Creator claims fees
UPDATE creator_fees
SET claimed = true, claimed_at = NOW(), claimed_amount = accumulated_fees
WHERE market_id = 1 AND creator_wallet = 'creator_pubkey';

-- 3. Bond escrow updated
UPDATE bond_escrows
SET accumulated_fees = 0
WHERE market_id = 1;
```

---

## Epic 2 Feature Summary

### Story 2.1: Snapshot-style Vote Signature Verification ✅

**Implementation:**
- Ed25519 signature verification for off-chain votes
- Signature format: `sign(vote_message, voter_private_key)`
- Vote message structure: `{ proposal_id, vote_choice, nonce, timestamp }`
- TweetNaCl library for cryptographic operations

**Integration:**
- Used in proposal voting and resolution voting
- Prevents vote manipulation and replay attacks
- Enables gas-free voting

---

### Story 2.2: Vote Collection and Storage ✅

**Implementation:**
- Supabase Edge Function: `vote-submission`
- Database table: `votes` with signature validation
- Nonce tracking to prevent replay attacks
- Vote aggregation preparation

**Integration:**
- Stores off-chain votes for later aggregation
- Supports both proposal and resolution voting
- Integrates with Story 2.1 signature verification

---

### Story 2.3: Vote Aggregation and On-Chain Result Posting ✅

**Implementation:**
- Batch signature verification on-chain
- Aggregate vote counts: yes_count, no_count
- Post result to ProposalSystem or MarketResolution program
- Only on-chain transaction in voting flow

**Integration:**
- Processes votes from Story 2.2
- Triggers approval/rejection in Story 2.5
- Supports weighted voting from Story 2.8

---

### Story 2.4: Proposal Voting via Snapshot ✅

**Implementation:**
- Complete proposal voting workflow
- Integration of Stories 2.1, 2.2, 2.3
- Frontend vote submission interface
- Vote status tracking and display

**Integration:**
- End-to-end proposal governance
- Gas-free community participation
- Transparent voting process

---

### Story 2.5: Proposal Approval/Rejection Logic ✅

**Implementation:**
- Threshold-based approval: yes_count > no_count (simple majority)
- Configurable quorum requirements
- Automatic market creation on approval
- Bond refund logic on rejection (50%)

**Integration:**
- Processes aggregated votes from Story 2.3
- Triggers market creation in CoreMarkets
- Initiates bond refunds via BondManager

---

### Story 2.6: Dispute Flagging Mechanism ✅

**Implementation:**
- User-initiated dispute flagging
- Dispute window: 48 hours (configurable)
- Dispute reasons: questionable resolution, manipulation, error
- Dispute queue for admin review

**Integration:**
- Applies to market resolution outcomes
- Pauses finalization during dispute window
- Triggers admin review in Story 2.7

---

### Story 2.7: Admin Override for Disputed Markets ✅

**Implementation:**
- Admin review capability for disputed markets
- Override options: confirm original outcome, change outcome
- Audit trail: admin_overrides table
- Governance safeguard mechanism

**Integration:**
- Reviews disputes from Story 2.6
- Final resolution authority
- Transparent override logging

---

### Story 2.8: Voting Weight Modes (Democratic vs Activity-Based) ✅

**Implementation:**
- DEMOCRATIC mode: 1 vote per user (equal weight)
- ACTIVITY_WEIGHTED mode: votes weighted by activity points
- Configurable via ParameterStorage
- Activity points from Story 1.11

**Integration:**
- Applies to both proposal and resolution voting
- Vote aggregation respects selected mode
- Incentivizes platform participation

---

### Story 2.9: Stale Market Auto-Cancellation ✅

**Implementation:**
- Threshold: voting_period_end + stale_market_threshold_days
- Default: 30 days after voting deadline
- Auto-cancel status change to CANCELLED
- Automatic bet refunds and bond refunds (100%)

**Integration:**
- Prevents indefinite pending markets
- Integrated with graduated bond refunds (Story 2.10)
- Event Listener syncs cancellation to database

---

### Story 2.10: Graduated Bond Refund Logic ✅

**Implementation:**
- Approved proposal: 100% bond refund
- Rejected proposal: 50% bond refund
- Cancelled market: 100% bond refund
- Slashed (fraud): 0% refund
- Configurable percentages via ParameterStorage

**Integration:**
- Used in proposal rejection (Story 2.5)
- Used in stale market cancellation (Story 2.9)
- Incentivizes quality proposals

---

### Story 2.11: Tiered Creator Fee Claims ✅

**Implementation:**
- Tier1 (<100 ZMart): 0.5% creator fee
- Tier2 (100-499 ZMart): 1.0% creator fee
- Tier3 (≥500 ZMart): 2.0% creator fee
- Fee accumulation during betting
- claim_creator_fees instruction for withdrawal

**Integration:**
- Bond tier from Story 1.5
- Fee accumulation during betting (Story 1.4 enhanced)
- Graduated bond refunds (Story 2.10)
- Event Listener syncs fees to database (Story 1.9)

---

## Epic 4 Test Plan

### Comprehensive Testing Strategy

Epic 4 will implement comprehensive tests for all Epic 2 features. This section provides a detailed test plan to guide Epic 4 implementation.

---

### Test Category 1: Unit Tests (Anchor)

**Location:** `tests/unit/`

**Coverage:**

**Proposal Voting (Stories 2.1-2.5):**
- ✅ Signature verification (valid/invalid signatures)
- ✅ Vote collection with nonce validation
- ✅ Vote aggregation with various vote distributions
- ✅ Approval/rejection thresholds
- ✅ Edge cases: zero votes, tied votes, single voter

**Dispute Handling (Stories 2.6-2.7):**
- ✅ Dispute flagging within window
- ✅ Dispute flagging outside window (should fail)
- ✅ Admin override authorization
- ✅ Non-admin override attempt (should fail)
- ✅ Override audit trail

**Voting Modes (Story 2.8):**
- ✅ Democratic mode: equal weights
- ✅ Activity-weighted mode: varying weights
- ✅ Mode switching
- ✅ Zero activity points handling

**Stale Markets (Story 2.9):**
- ✅ Stale market detection
- ✅ Auto-cancellation trigger
- ✅ Refund distribution
- ✅ Threshold configuration

**Graduated Refunds (Story 2.10):**
- ✅ Approved proposal: 100% refund
- ✅ Rejected proposal: 50% refund
- ✅ Cancelled market: 100% refund
- ✅ Slashed bond: 0% refund
- ✅ Refund percentage configuration

**Creator Fees (Story 2.11):**
- ✅ Tiered fee calculation (Tier1/2/3)
- ✅ Fee accumulation during betting
- ✅ Fee claim authorization
- ✅ Double-claim prevention

---

### Test Category 2: Integration Tests (TypeScript)

**Location:** `tests/integration/`

**Test Suite 1: End-to-End Governance Flow**
```typescript
describe('E2E Governance Flow', () => {
  it('completes full governance cycle from proposal to payout', async () => {
    // 1. Propose market (Story 2.4)
    // 2. Community votes (Stories 2.1, 2.2)
    // 3. Aggregate votes (Story 2.3)
    // 4. Approve proposal (Story 2.5)
    // 5. Market created and bets placed (Story 1.4)
    // 6. Resolution voting (Stories 2.1, 2.2, 2.3)
    // 7. Market resolves (Story 1.6)
    // 8. Payouts claimed (Story 1.10)
    // 9. Creator fees claimed (Story 2.11)
    // 10. Bond refunded (Story 2.10)
  });
});
```

**Test Suite 2: Dispute Resolution Workflow**
```typescript
describe('Dispute Resolution', () => {
  it('handles disputed market with admin override', async () => {
    // 1. Market resolves with outcome YES
    // 2. User flags dispute (Story 2.6)
    // 3. Admin reviews and overrides to NO (Story 2.7)
    // 4. Payouts distributed per override outcome
    // 5. Audit trail verified
  });
});
```

**Test Suite 3: Voting Mode Comparison**
```typescript
describe('Voting Modes', () => {
  it('produces different results in democratic vs weighted modes', async () => {
    // Setup: 3 voters with different activity points
    // Democratic mode: 2 YES, 1 NO → YES wins
    // Weighted mode: YES (100 points), NO (1000 points) → NO wins
    // Verify mode impacts outcome
  });
});
```

**Test Suite 4: Stale Market Cleanup**
```typescript
describe('Stale Market Auto-Cancellation', () => {
  it('cancels stale markets and refunds all participants', async () => {
    // 1. Create market with past voting deadline
    // 2. Trigger stale market check
    // 3. Verify status = CANCELLED
    // 4. Verify all bets refunded
    // 5. Verify creator bond refunded (100%)
  });
});
```

---

### Test Category 3: Performance Tests

**Location:** `tests/performance/`

**Benchmarks:**

**Vote Submission Latency:**
- Target: <2 seconds per vote
- Test with network latency: 100ms, 500ms
- Measure signature generation time
- Measure database write time

**Vote Aggregation Time:**
- Target: <5 seconds for 1000 votes
- Test scaling: 100, 500, 1000, 5000 votes
- Measure signature verification time
- Measure on-chain transaction time

**Database Query Performance:**
- Target: <100ms for vote queries
- Test vote retrieval by proposal_id
- Test vote retrieval by voter
- Test aggregate calculations

**Event Listener Throughput:**
- Target: <1 second event-to-database latency
- Test with burst events (100 events/sec)
- Measure sync lag
- Identify bottlenecks

---

### Test Category 4: Gas Cost Validation

**Verify Gas-Free Voting:**
```typescript
describe('Gas Cost Validation', () => {
  it('voters spend 0 SOL on individual votes', async () => {
    const initialBalance = await getBalance(voter1);

    // Submit 10 votes
    for (let i = 0; i < 10; i++) {
      await submitVote(voter1, proposalId, Vote.YES);
    }

    const finalBalance = await getBalance(voter1);
    expect(finalBalance).toBe(initialBalance); // No SOL spent
  });

  it('aggregation costs ~0.005 SOL', async () => {
    const initialBalance = await getBalance(aggregator);
    await aggregateVotes(proposalId);
    const finalBalance = await getBalance(aggregator);
    const cost = initialBalance - finalBalance;
    expect(cost).toBeLessThan(0.01 * LAMPORTS_PER_SOL); // ~0.005 SOL
  });
});
```

---

### Test Category 5: Edge Cases and Error Handling

**Test Scenarios:**

**Invalid Signatures:**
- Tampered vote messages
- Wrong signer
- Replayed signatures (nonce reuse)
- Expired timestamps

**Concurrent Operations:**
- Simultaneous votes from multiple users
- Concurrent aggregation attempts
- Race conditions in claim operations

**Boundary Conditions:**
- Zero activity points in weighted mode
- Exactly 50/50 vote split
- Single voter
- Maximum vote count (stress test)

**Error Recovery:**
- Network failures during aggregation
- Transaction retries
- Partial state recovery
- Database sync failures

---

### Test Category 6: Database Consistency

**Validation Checks:**

**Event Listener Sync:**
```sql
-- Verify all events synced to database
SELECT COUNT(*) FROM votes WHERE proposal_id = 1;
-- Should match on-chain vote count

SELECT accumulated_fees FROM creator_fees WHERE market_id = 1;
-- Should match BondEscrow.accumulated_fees

SELECT status FROM markets WHERE market_id = 1;
-- Should match on-chain market.status
```

**Data Integrity:**
- Foreign key constraints validated
- No orphaned records
- Timestamps consistent
- Status transitions follow state machine

---

### Test Execution Strategy

**Phase 1: Unit Tests (Week 1)**
- Implement Anchor tests for each program
- Achieve >80% code coverage
- Validate all business logic

**Phase 2: Integration Tests (Week 2)**
- Implement E2E test suites
- Validate cross-program interactions
- Test complete governance workflows

**Phase 3: Performance Tests (Week 3)**
- Establish baseline benchmarks
- Identify performance bottlenecks
- Optimize slow operations

**Phase 4: Regression Testing (Week 4)**
- Create automated regression suite
- Document all test scenarios
- Establish CI/CD integration

---

### Success Criteria for Epic 4

✅ **Coverage:**
- Unit tests: >80% code coverage
- Integration tests: All critical paths covered
- E2E tests: Complete governance flow validated

✅ **Performance:**
- Vote submission: <2s
- Vote aggregation: <5s for 1000 votes
- Database queries: <100ms

✅ **Gas Costs:**
- Individual votes: 0 SOL
- Aggregation: <0.01 SOL

✅ **Reliability:**
- No flaky tests
- All tests deterministic
- Error recovery validated

✅ **Documentation:**
- All test scenarios documented
- Test execution guide created
- Troubleshooting guide available

---

## Conclusion

Epic 2 has successfully implemented a comprehensive community governance system for BMAD-Zmart. All 12 stories are complete with robust implementation of:

- Gas-free voting via Snapshot-style signatures
- Flexible voting modes (democratic and activity-weighted)
- Dispute resolution with admin oversight
- Stale market cleanup automation
- Graduated bond refunds
- Tiered creator fee system

**Next Steps:**
1. Epic 4: Comprehensive testing implementation following this test plan
2. Performance optimization based on benchmark results
3. Production deployment with monitoring

**Documentation Status:**
- ✅ Complete governance workflow documented
- ✅ State machines defined
- ✅ Component integration mapped
- ✅ Event flow documented
- ✅ Database schema integration detailed
- ✅ Epic 4 test plan created

---

**Epic 2 Status:** ✅ COMPLETE
**Testing Status:** ⏸️ DEFERRED to Epic 4
**Production Readiness:** Pending Epic 4 validation

🎉 **EPIC 2: COMMUNITY GOVERNANCE - COMPLETE!** 🎉
