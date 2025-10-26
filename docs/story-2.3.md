# Story 2.3: Vote Aggregation and On-Chain Result Posting

**Epic:** 2 - Community Governance
**Story ID:** 2.3
**Created:** 2025-10-26
**Status:** 📝 Ready for Implementation
**Dependencies:** Story 2.1 (Signature Verification), Story 2.2 (Vote Storage)

---

## Story Overview

**As a** platform operator,
**I want to** aggregate off-chain votes and post results on-chain,
**So that** market resolutions are transparent and verifiable.

### Business Context

This story completes the Snapshot-style voting workflow by:
1. Aggregating votes from PostgreSQL when the voting period ends
2. Determining the winning outcome (YES/NO based on >50% threshold)
3. Generating a cryptographic proof (Merkle root) of all votes
4. Posting the final result to the Solana blockchain
5. Transitioning the market into a 48-hour dispute window

**Value Proposition:**
- Gas-free voting (Stories 2.1, 2.2) → On-chain transparency (Story 2.3)
- Trustless verification: Anyone can verify votes against Merkle root
- Dispute mechanism: 48-hour window for community review before finalization

---

## Acceptance Criteria

### AC1: Vote Aggregation Edge Function ✅
**Given** a market's voting period has ended,
**When** the `aggregate-votes` Edge Function is triggered,
**Then** the system aggregates all votes from the `votes` table.

**Technical Requirements:**
- Supabase Edge Function: `aggregate-votes`
- Input: `market_id` (from cron job or manual trigger)
- Validation: Market must be in VOTING status with voting_end < now()
- Query: `SELECT SUM(vote_weight) FROM votes WHERE market_id = X AND vote_choice = 'YES'`
- Query: `SELECT SUM(vote_weight) FROM votes WHERE market_id = X AND vote_choice = 'NO'`

**Success Metrics:**
- Correctly sums all vote weights from PostgreSQL
- Handles edge cases: no votes, tied votes, missing market

---

### AC2: Vote Aggregation Logic ✅
**Given** aggregated vote data,
**When** determining the winning outcome,
**Then** the system selects the side with >50% of total vote weight.

**Technical Requirements:**
- Algorithm:
  ```typescript
  total_weight = yes_weight + no_weight
  yes_percentage = yes_weight / total_weight

  if (yes_percentage > 0.50) outcome = 'YES'
  else if (yes_percentage < 0.50) outcome = 'NO'
  else outcome = 'TIE' (special handling)
  ```
- Tie handling: If exactly 50/50, default to NO (or configurable behavior)
- Zero votes: If total_weight = 0, outcome = 'NO_VOTES' (admin must resolve)

**Success Metrics:**
- Correctly identifies winner in all test cases
- Handles edge cases: 0 votes, 100% YES, 100% NO, 50/50 tie

---

### AC3: Merkle Root Generation ✅
**Given** all votes for a market,
**When** generating a cryptographic proof,
**Then** the system creates a Merkle root of all vote data.

**Technical Requirements:**
- Merkle tree construction:
  1. Fetch all votes: `SELECT * FROM votes WHERE market_id = X ORDER BY timestamp ASC`
  2. Hash each vote: `keccak256(voter_wallet || vote_choice || vote_weight || timestamp || signature)`
  3. Build Merkle tree from leaf hashes
  4. Compute Merkle root (32-byte hash)
- Optional: Store full Merkle tree for dispute resolution (future story)
- Library: Use existing Solana Merkle tree utilities or implement custom

**Success Metrics:**
- Deterministic: Same votes always produce same Merkle root
- Verifiable: Can prove any vote is included in the tree
- Efficient: <5 seconds for 10,000 votes

---

### AC4: On-Chain Result Posting ✅
**Given** aggregated vote results and Merkle root,
**When** posting the result to Solana,
**Then** the `post_vote_result` instruction updates the market on-chain.

**Technical Requirements:**
- Solana Program: `MarketResolution` (from Epic 1 Story 1.9)
- Instruction: `post_vote_result`
- Accounts:
  ```rust
  pub struct PostVoteResult<'info> {
      #[account(mut)]
      pub market: Account<'info, Market>,
      #[account(init, payer = authority, space = 8 + VoteResult::LEN)]
      pub vote_result: Account<'info, VoteResult>,
      #[account(mut)]
      pub authority: Signer<'info>,
      pub system_program: Program<'info, System>,
  }
  ```
- Instruction Data:
  ```rust
  pub struct PostVoteResultData {
      pub outcome: Outcome, // YES or NO
      pub yes_vote_weight: u64,
      pub no_vote_weight: u64,
      pub merkle_root: [u8; 32],
      pub total_votes_count: u32,
  }
  ```

**Success Metrics:**
- Creates VoteResult PDA on-chain
- Updates market status: VOTING → DISPUTE_WINDOW
- Sets dispute_window_end = now() + 48 hours
- Emits VoteResultPosted event

---

### AC5: VoteResult Account Creation ✅
**Given** the `post_vote_result` instruction executes,
**When** creating the VoteResult account,
**Then** it stores comprehensive result data on-chain.

**Technical Requirements:**
- Account Structure:
  ```rust
  #[account]
  pub struct VoteResult {
      pub market_id: Pubkey,       // Reference to Market account
      pub outcome: Outcome,         // YES or NO
      pub yes_vote_weight: u64,     // Total YES weight
      pub no_vote_weight: u64,      // Total NO weight
      pub total_votes_count: u32,   // Number of unique voters
      pub merkle_root: [u8; 32],    // Cryptographic proof
      pub posted_at: i64,           // Unix timestamp
      pub posted_by: Pubkey,        // Authority who posted (platform admin)
      pub dispute_window_end: i64,  // Timestamp when disputes close
  }
  ```
- PDA Derivation: `["vote_result", market_id.as_ref()]`
- Immutable: Once created, cannot be modified (except via admin override in Story 2.7)

**Success Metrics:**
- VoteResult account is correctly initialized
- All data matches PostgreSQL aggregation
- PDA derivation is deterministic

---

### AC6: Market Status Transition ✅
**Given** the vote result is posted on-chain,
**When** updating the market status,
**Then** the market transitions from VOTING → DISPUTE_WINDOW.

**Technical Requirements:**
- Market status update:
  ```rust
  market.status = MarketStatus::DisputeWindow;
  market.voting_end = None; // Voting period complete
  market.dispute_window_end = Some(Clock::get()?.unix_timestamp + 48 * 3600);
  ```
- Event emission:
  ```rust
  emit!(VoteResultPosted {
      market_id: market.key(),
      outcome: data.outcome,
      yes_weight: data.yes_vote_weight,
      no_weight: data.no_vote_weight,
      merkle_root: data.merkle_root,
      dispute_window_end: market.dispute_window_end.unwrap(),
  });
  ```

**Success Metrics:**
- Market status is DISPUTE_WINDOW after posting
- dispute_window_end is correctly set (48 hours from now)
- Event is emitted and indexed by event listener

---

### AC7: Aggregation Trigger Mechanisms ✅
**Given** the need to aggregate votes automatically,
**When** the voting period ends,
**Then** the aggregation can be triggered via cron job OR manual admin action.

**Technical Requirements:**
- **Option 1: Supabase Cron Job** (Preferred)
  ```sql
  -- In Supabase dashboard: Database → Cron
  SELECT cron.schedule(
      'aggregate-ended-votes',
      '*/15 * * * *', -- Every 15 minutes
      $$
      SELECT net.http_post(
          url := 'https://[project-id].supabase.co/functions/v1/aggregate-votes',
          body := jsonb_build_object('market_id', market_id)
      )
      FROM markets
      WHERE status = 'VOTING'
        AND voting_end < NOW()
        AND NOT EXISTS (
            SELECT 1 FROM vote_results WHERE market_id = markets.id
        );
      $$
  );
  ```

- **Option 2: Manual Admin Trigger** (Fallback)
  - Admin dashboard button: "Aggregate Votes"
  - Calls `aggregate-votes` Edge Function directly with market_id
  - Used for testing or if cron fails

**Success Metrics:**
- Cron job triggers aggregation within 15 minutes of voting_end
- Manual trigger works for testing/debugging
- Idempotent: Re-running aggregation has no side effects

---

### AC8: Comprehensive Testing ✅
**Given** the vote aggregation and posting functionality,
**When** running test scenarios,
**Then** all edge cases are validated.

**Test Scenarios:**

1. **Happy Path**
   - 100 votes: 60 YES (weight 60), 40 NO (weight 40)
   - Expected: Outcome = YES, Merkle root generated, posted on-chain

2. **Tied Vote**
   - 100 votes: 50 YES, 50 NO
   - Expected: Outcome = NO (tie-breaking rule), posted on-chain

3. **Zero Votes**
   - No votes submitted for market
   - Expected: Outcome = NO_VOTES, admin must resolve manually

4. **Weighted Voting**
   - 10 votes: 5 YES (total weight 1000), 5 NO (total weight 100)
   - Expected: Outcome = YES (1000 > 100), weighted correctly

5. **Merkle Root Verification**
   - Generate Merkle root from 1000 votes
   - Verify: Same votes → same root
   - Verify: Different votes → different root

6. **On-Chain Posting**
   - Simulate transaction to Solana devnet
   - Verify: VoteResult account created, market status updated

7. **Duplicate Aggregation Prevention**
   - Try to aggregate same market twice
   - Expected: Second attempt rejected (VoteResult already exists)

8. **Premature Aggregation Prevention**
   - Try to aggregate before voting_end
   - Expected: Rejected with error "Voting period not ended"

**Success Metrics:**
- All 8 test scenarios pass
- Edge cases handled gracefully
- Error messages are clear and actionable

---

## Technical Approach

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Vote Aggregation Flow                     │
└─────────────────────────────────────────────────────────────┘

1. Trigger Detection
   ┌──────────────┐
   │ Cron Job     │ → Checks: voting_end < NOW()
   │ (15 min)     │ → Finds: Markets in VOTING status
   └──────┬───────┘
          │
          v
   ┌──────────────┐
   │ POST         │ → URL: /functions/v1/aggregate-votes
   │ HTTP Request │ → Body: {market_id: "..."}
   └──────┬───────┘

2. Vote Aggregation (Supabase Edge Function)
          │
          v
   ┌──────────────────────┐
   │ aggregate-votes      │
   │ Edge Function        │
   ├──────────────────────┤
   │ 1. Fetch all votes   │ → SELECT * FROM votes WHERE market_id = X
   │ 2. Sum vote weights  │ → SUM(vote_weight) GROUP BY vote_choice
   │ 3. Determine outcome │ → IF yes_weight > no_weight THEN 'YES' ELSE 'NO'
   │ 4. Build Merkle tree │ → keccak256(vote data) → Merkle root
   │ 5. Prepare tx data   │ → {outcome, weights, merkle_root}
   └──────┬───────────────┘
          │
          v
   ┌──────────────────────┐
   │ Solana Transaction   │
   │ Builder              │
   ├──────────────────────┤
   │ Instruction:         │
   │ post_vote_result     │
   │                      │
   │ Accounts:            │
   │ - market (mut)       │
   │ - vote_result (init) │
   │ - authority (signer) │
   └──────┬───────────────┘

3. On-Chain Execution (MarketResolution Program)
          │
          v
   ┌──────────────────────────────┐
   │ post_vote_result             │
   │ Instruction Handler          │
   ├──────────────────────────────┤
   │ Validations:                 │
   │ - Market in VOTING status    │
   │ - voting_end < now()         │
   │ - VoteResult doesn't exist   │
   │                              │
   │ Actions:                     │
   │ 1. Create VoteResult PDA     │
   │ 2. Store result data         │
   │ 3. Update market:            │
   │    status → DISPUTE_WINDOW   │
   │    dispute_end = now + 48h   │
   │ 4. Emit event                │
   └──────┬───────────────────────┘
          │
          v
   ┌──────────────────────┐
   │ Event Emitted        │
   ├──────────────────────┤
   │ VoteResultPosted {   │
   │   market_id,         │
   │   outcome,           │
   │   yes_weight,        │
   │   no_weight,         │
   │   merkle_root,       │
   │   dispute_end        │
   │ }                    │
   └──────┬───────────────┘

4. Database Sync (Event Listener from Epic 1)
          │
          v
   ┌──────────────────────┐
   │ Event Listener       │
   │ (WebSocket)          │
   ├──────────────────────┤
   │ UPDATE markets       │
   │ SET status =         │
   │   'DISPUTE_WINDOW',  │
   │   dispute_window_end │
   │ WHERE id = market_id │
   │                      │
   │ INSERT INTO          │
   │ vote_results (...)   │
   └──────────────────────┘
```

---

### Component Breakdown

#### 1. Supabase Edge Function: `aggregate-votes`

**File:** `supabase/functions/aggregate-votes/index.ts`

**Responsibilities:**
- Fetch all votes for a given market from PostgreSQL
- Aggregate vote weights by choice (YES/NO)
- Determine winning outcome
- Generate Merkle root from vote data
- Build and submit Solana transaction to post result on-chain

**Input:**
```typescript
interface AggregateVotesRequest {
  market_id: string; // UUID from PostgreSQL
}
```

**Output:**
```typescript
interface AggregateVotesResponse {
  success: boolean;
  outcome: 'YES' | 'NO' | 'TIE' | 'NO_VOTES';
  yes_weight: number;
  no_weight: number;
  total_votes: number;
  merkle_root: string; // Hex-encoded
  transaction_signature?: string; // Solana tx signature
  error?: string;
}
```

**Error Codes:**
- `400`: Invalid market_id or missing parameters
- `404`: Market not found
- `409`: Voting period not ended OR VoteResult already exists
- `500`: Aggregation failed, Merkle tree generation failed, Solana transaction failed

---

#### 2. Merkle Tree Generation

**Library:** Use `@solana/spl-account-compression` or custom implementation

**Algorithm:**
```typescript
import { MerkleTree } from '@solana/spl-account-compression';
import { keccak256 } from 'js-sha3';

function generateMerkleRoot(votes: Vote[]): Buffer {
  // Sort votes deterministically (by timestamp, then wallet)
  const sortedVotes = votes.sort((a, b) => {
    if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
    return a.voter_wallet.localeCompare(b.voter_wallet);
  });

  // Hash each vote
  const leafHashes = sortedVotes.map(vote => {
    const voteData = `${vote.voter_wallet}|${vote.vote_choice}|${vote.vote_weight}|${vote.timestamp}|${vote.signature}`;
    return Buffer.from(keccak256(voteData), 'hex');
  });

  // Build Merkle tree
  const tree = new MerkleTree(leafHashes);
  const merkleRoot = tree.getRoot();

  return merkleRoot; // 32-byte Buffer
}
```

**Optimization:**
- For MVP: Simple hash of sorted vote data (not full Merkle tree)
- For production: Full Merkle tree with proof generation for disputes

---

#### 3. Solana Program Instruction: `post_vote_result`

**Program:** `MarketResolution` (from Epic 1 Story 1.9)

**File:** `programs/market-resolution/src/lib.rs`

**Instruction Handler:**
```rust
pub fn post_vote_result(
    ctx: Context<PostVoteResult>,
    data: PostVoteResultData,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let vote_result = &mut ctx.accounts.vote_result;
    let clock = Clock::get()?;

    // Validation 1: Market must be in VOTING status
    require!(
        market.status == MarketStatus::Voting,
        ErrorCode::InvalidMarketStatus
    );

    // Validation 2: Voting period must have ended
    require!(
        market.voting_end.is_some() && market.voting_end.unwrap() < clock.unix_timestamp,
        ErrorCode::VotingPeriodNotEnded
    );

    // Validation 3: VoteResult doesn't already exist (prevent duplicate posting)
    // (This is enforced by `init` constraint on vote_result account)

    // Initialize VoteResult account
    vote_result.market_id = market.key();
    vote_result.outcome = data.outcome;
    vote_result.yes_vote_weight = data.yes_vote_weight;
    vote_result.no_vote_weight = data.no_vote_weight;
    vote_result.total_votes_count = data.total_votes_count;
    vote_result.merkle_root = data.merkle_root;
    vote_result.posted_at = clock.unix_timestamp;
    vote_result.posted_by = ctx.accounts.authority.key();
    vote_result.dispute_window_end = clock.unix_timestamp + (48 * 3600); // 48 hours

    // Update market status
    market.status = MarketStatus::DisputeWindow;
    market.voting_end = None; // Voting complete
    market.dispute_window_end = Some(vote_result.dispute_window_end);

    // Emit event
    emit!(VoteResultPosted {
        market_id: market.key(),
        outcome: data.outcome,
        yes_weight: data.yes_vote_weight,
        no_weight: data.no_vote_weight,
        merkle_root: data.merkle_root,
        total_votes: data.total_votes_count,
        dispute_window_end: vote_result.dispute_window_end,
    });

    Ok(())
}
```

---

#### 4. Database Sync (Event Listener)

**Existing Component:** Event listener from Epic 1 Story 1.12

**New Event Handler:**
```typescript
// In supabase/functions/event-listener/index.ts
case 'VoteResultPosted': {
  const { market_id, outcome, yes_weight, no_weight, merkle_root, dispute_window_end } = event.data;

  // Update market status in PostgreSQL
  await supabase
    .from('markets')
    .update({
      status: 'DISPUTE_WINDOW',
      dispute_window_end: new Date(dispute_window_end * 1000).toISOString(),
    })
    .eq('id', market_id);

  // Insert vote result record
  await supabase
    .from('vote_results')
    .insert({
      market_id,
      outcome,
      yes_vote_weight: yes_weight,
      no_vote_weight: no_weight,
      merkle_root,
      posted_at: new Date(),
      dispute_window_end: new Date(dispute_window_end * 1000).toISOString(),
    });

  break;
}
```

---

### Integration Points

#### With Story 2.1 (Signature Verification)
- No direct integration (Story 2.1 handles vote submission)
- Story 2.3 reads verified votes from database

#### With Story 2.2 (Vote Storage)
- **Input:** Reads votes from `votes` table created in Story 2.2
- **Query:** Aggregates vote weights using Story 2.2 schema
- **Validation:** Ensures double-voting prevention was enforced

#### With Epic 1 Story 1.9 (MarketResolution Program)
- **Instruction:** Uses `post_vote_result` instruction
- **Accounts:** Interacts with Market and VoteResult accounts
- **Events:** Emits VoteResultPosted event for database sync

#### With Epic 1 Story 1.12 (Event Listener)
- **Event:** VoteResultPosted event triggers database sync
- **Database:** Updates markets table with DISPUTE_WINDOW status
- **Record:** Inserts vote result into vote_results table

---

## Implementation Plan

### Phase 1: Database Schema (if needed)
**Estimated Time:** 30 minutes

**Files:**
- `database/migrations/006_vote_results_table.sql` (optional, if not using event listener)

**Tasks:**
1. Create `vote_results` table in PostgreSQL (if needed)
   - Columns: id, market_id, outcome, yes_weight, no_weight, merkle_root, posted_at, dispute_window_end
   - Indexes: market_id (unique)
2. Test migration: `supabase db push`

**Optional:** May not be needed if event listener handles this.

---

### Phase 2: Solana Program Update
**Estimated Time:** 2 hours

**Files:**
- `programs/market-resolution/src/lib.rs`
- `programs/market-resolution/src/state.rs`
- `programs/market-resolution/src/errors.rs`

**Tasks:**
1. Define `VoteResult` account structure
2. Implement `post_vote_result` instruction handler
3. Add validation logic (voting period ended, status checks)
4. Emit `VoteResultPosted` event
5. Write unit tests for instruction
6. Deploy to devnet: `anchor deploy`

---

### Phase 3: Merkle Tree Generation
**Estimated Time:** 1 hour

**Files:**
- `supabase/functions/aggregate-votes/merkle.ts`

**Tasks:**
1. Implement deterministic vote sorting
2. Implement leaf hash generation (keccak256)
3. Implement Merkle tree construction
4. Implement Merkle root extraction
5. Write unit tests for Merkle tree
6. Validate: Same votes → same root

---

### Phase 4: Aggregate Votes Edge Function
**Estimated Time:** 2 hours

**Files:**
- `supabase/functions/aggregate-votes/index.ts`
- `supabase/functions/aggregate-votes/merkle.ts`

**Tasks:**
1. Implement vote fetching from PostgreSQL
2. Implement vote weight aggregation logic
3. Implement outcome determination (>50% rule)
4. Integrate Merkle root generation
5. Build Solana transaction (post_vote_result)
6. Submit transaction to devnet
7. Handle transaction errors gracefully
8. Return success/failure response

---

### Phase 5: Cron Job Setup
**Estimated Time:** 30 minutes

**Location:** Supabase Dashboard → Database → Cron

**Tasks:**
1. Create cron job: Check for ended voting periods every 15 minutes
2. Trigger `aggregate-votes` Edge Function for each ended market
3. Test cron job manually
4. Monitor cron job logs

---

### Phase 6: Testing
**Estimated Time:** 2 hours

**Files:**
- `supabase/functions/aggregate-votes/test.ts`
- `programs/market-resolution/tests/post_vote_result.test.ts`

**Tasks:**
1. Write unit tests for Merkle tree generation
2. Write unit tests for vote aggregation logic
3. Write integration tests for Edge Function
4. Write on-chain tests for post_vote_result instruction
5. Test all 8 acceptance criteria scenarios
6. Validate error handling and edge cases

---

### Phase 7: Event Listener Update
**Estimated Time:** 1 hour

**Files:**
- `supabase/functions/event-listener/index.ts`

**Tasks:**
1. Add handler for `VoteResultPosted` event
2. Update markets table status → DISPUTE_WINDOW
3. Insert record into vote_results table (if needed)
4. Test event listener with devnet transaction
5. Validate database sync works correctly

---

### Phase 8: Documentation
**Estimated Time:** 1 hour

**Files:**
- `docs/STORY-2.3-COMPLETE.md`
- `docs/bmm-workflow-status.md`

**Tasks:**
1. Document implementation details
2. Validate all acceptance criteria met
3. Update workflow status (move 2.3 to completed)
4. Commit with proper BMAD message

---

## Testing Strategy

### Unit Tests

1. **Merkle Tree Generation**
   - Input: 100 votes with known data
   - Expected: Deterministic Merkle root
   - Validation: Same votes → same root, different votes → different root

2. **Vote Aggregation Logic**
   - Input: Various vote distributions (60/40, 50/50, 100/0, 0/0)
   - Expected: Correct outcome determination
   - Validation: Winner selection matches >50% rule

3. **Edge Function Logic**
   - Input: Mock database responses
   - Expected: Correct data transformation and Solana tx building
   - Validation: Error handling for missing data, invalid markets

### Integration Tests

1. **End-to-End Aggregation Flow**
   - Setup: Create market, submit votes (using Stories 2.1, 2.2)
   - Trigger: Call aggregate-votes Edge Function
   - Validation: VoteResult created on-chain, market status updated

2. **Cron Job Simulation**
   - Setup: Market with voting_end < now()
   - Trigger: Simulate cron job execution
   - Validation: Aggregation triggered automatically

3. **Event Listener Sync**
   - Setup: Post vote result on-chain
   - Trigger: Event emitted
   - Validation: Database updated correctly

### On-Chain Tests

1. **post_vote_result Instruction**
   - Setup: Market in VOTING status with ended voting period
   - Execute: Call post_vote_result with test data
   - Validation: VoteResult account created, market status = DISPUTE_WINDOW

2. **Validation Tests**
   - Test: Call post_vote_result before voting_end
   - Expected: Error "VotingPeriodNotEnded"
   - Test: Call post_vote_result twice
   - Expected: Error "AccountAlreadyInitialized"

---

## Dependencies

### Internal Dependencies
- ✅ **Story 2.1:** Signature verification (votes are already verified)
- ✅ **Story 2.2:** Vote storage (votes table exists with data)
- ✅ **Epic 1 Story 1.9:** MarketResolution program (on-chain structure exists)
- ✅ **Epic 1 Story 1.12:** Event listener (can sync VoteResultPosted event)

### External Dependencies
- Solana devnet (for transaction submission)
- Supabase Edge Functions (runtime environment)
- Supabase Cron (for automatic triggering)

---

## Risks and Mitigations

### Risk 1: Merkle Tree Computation Time
**Risk:** Generating Merkle root for 10,000+ votes takes too long (>30s)
**Mitigation:**
- Use efficient hashing library (keccak256)
- Optimize tree construction algorithm
- For MVP: Use simple hash instead of full Merkle tree
- For production: Pre-compute Merkle tree incrementally during vote submission

---

### Risk 2: Solana Transaction Failures
**Risk:** post_vote_result transaction fails due to network congestion or insufficient rent
**Mitigation:**
- Implement retry logic with exponential backoff
- Monitor transaction status before marking aggregation complete
- Store aggregation state in database for retry on failure
- Alert admin if transaction fails after 3 retries

---

### Risk 3: Cron Job Reliability
**Risk:** Supabase cron job fails or doesn't trigger on time
**Mitigation:**
- Implement manual trigger option in admin dashboard
- Monitor cron job execution logs
- Set up alerts for missed aggregations
- Document manual aggregation procedure

---

### Risk 4: Tied Votes (50/50)
**Risk:** Unclear how to handle exactly tied votes
**Mitigation:**
- Document tie-breaking rule: Default to NO outcome
- Make tie-breaking rule configurable parameter (future)
- Consider: Require supermajority (>55%) for YES outcome
- Log tied votes for manual admin review

---

## Success Metrics

### Functional Metrics
- ✅ Vote aggregation completes in <10 seconds for 1,000 votes
- ✅ Merkle root generation is deterministic and verifiable
- ✅ On-chain posting succeeds on first attempt >95% of time
- ✅ Cron job triggers aggregation within 15 minutes of voting_end
- ✅ All 8 acceptance criteria test scenarios pass

### Non-Functional Metrics
- ✅ Edge Function response time: <30 seconds end-to-end
- ✅ Solana transaction confirmation: <60 seconds
- ✅ Database sync latency: <5 seconds after event emission
- ✅ Error rate: <1% for valid aggregation requests

---

## Deployment Checklist

### Pre-Deployment
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] On-chain tests passing on devnet
- [ ] Merkle tree generation validated
- [ ] Edge Function deployed to staging
- [ ] Solana program deployed to devnet
- [ ] Event listener updated with new handler
- [ ] Cron job configured and tested

### Deployment Steps
1. Deploy Solana program to devnet: `anchor deploy`
2. Deploy Edge Function: `supabase functions deploy aggregate-votes`
3. Update event listener: `supabase functions deploy event-listener`
4. Configure cron job in Supabase dashboard
5. Test manual aggregation trigger
6. Monitor first automated aggregation

### Post-Deployment
- [ ] Verify cron job executes on schedule
- [ ] Monitor Solana transaction success rate
- [ ] Verify database sync works correctly
- [ ] Check error logs for issues
- [ ] Validate first real vote result posted on-chain

---

## Future Enhancements (Out of Scope for Story 2.3)

1. **Full Merkle Proof Generation**
   - Store full Merkle tree (not just root)
   - Generate proofs for individual votes
   - Enable trustless dispute resolution

2. **Optimistic Aggregation**
   - Pre-compute partial aggregations during voting
   - Reduce final aggregation time from minutes to seconds

3. **Multi-Signature Posting**
   - Require multiple admins to approve result posting
   - Reduce centralization risk

4. **Decentralized Oracle Integration**
   - Use Chainlink or Pyth to trigger aggregation
   - Reduce reliance on centralized cron job

---

## BMAD Compliance Notes

### Story Workflow
- ✅ Story file created BEFORE implementation (this file)
- ✅ Previous story (2.2) is complete
- ✅ Only ONE story in progress at a time
- ✅ Story is tracked in `docs/epics.md`

### Documentation Requirements
- ✅ Comprehensive acceptance criteria defined
- ✅ Technical approach documented
- ✅ Integration points identified
- ✅ Testing strategy planned

### Next Steps (AFTER Implementation)
1. Implement all components per Implementation Plan
2. Run all tests and validate acceptance criteria
3. Create `docs/STORY-2.3-COMPLETE.md`
4. Update `docs/bmm-workflow-status.md`
5. Commit: "feat: Complete Story 2.3 - Vote Aggregation and On-Chain Result Posting"

---

**STORY 2.3 READY FOR IMPLEMENTATION** ✅
**BMAD COMPLIANCE: 100%** ✅
**Prerequisites: ALL MET** ✅

---

_Created: 2025-10-26_
_Epic: 2 - Community Governance_
_Story: 2.3 - Vote Aggregation and On-Chain Result Posting_
_Status: 📝 Ready for Implementation_
_Estimated Time: 8-10 hours total implementation_
