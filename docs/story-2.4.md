# Story 2.4: Proposal Voting via Snapshot

**Epic:** 2 - Community Governance
**Story ID:** 2.4
**Created:** 2025-10-26
**Status:** 📝 Ready for Implementation
**Dependencies:** Story 2.1 (Signature Verification), Epic 1 Story 1.7 (ProposalSystem)

---

## Story Overview

**As a** community member,
**I want to** vote on market proposals without gas fees,
**So that** I can participate in deciding what markets get created.

### Business Context

This story extends the Snapshot-style voting framework (Stories 2.1-2.3) to **proposal voting**:
- Users can vote YES/NO on proposed markets before they're created
- Voting is gas-free (off-chain signed messages)
- Vote weight can be democratic (1 vote per wallet) or activity-based (weighted by points)
- Voting period is configurable (default: 7 days)
- Real-time vote tallies help community see proposal momentum

**Value Proposition:**
- **Democratic Market Creation:** Community controls what markets exist
- **Gas-Free Participation:** No SOL required to vote on proposals
- **Transparent Process:** Real-time vote tallies show community sentiment
- **Flexible Weight:** Can toggle between democratic and activity-weighted voting

---

## Acceptance Criteria

### AC1: Proposal Votes Table ✅
**Given** the need to store proposal votes off-chain,
**When** a user votes on a proposal,
**Then** the vote is stored in the `proposal_votes` table.

**Technical Requirements:**
- Table: `proposal_votes`
- Columns:
  ```sql
  id UUID PRIMARY KEY
  proposal_id TEXT NOT NULL (references proposals table)
  voter_wallet TEXT NOT NULL
  vote_choice TEXT NOT NULL CHECK (vote_choice IN ('YES', 'NO'))
  signature TEXT NOT NULL (from Story 2.1)
  vote_weight INTEGER NOT NULL DEFAULT 1
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL
  nonce TEXT NOT NULL (replay attack prevention)
  ```
- Unique constraint: `(proposal_id, voter_wallet)` prevents double-voting
- Index on `proposal_id` for fast aggregation queries
- Index on `voter_wallet` for user vote history

**Success Metrics:**
- Table created with all columns and constraints
- Indexes created for query performance
- RLS policies enable read-only public access

---

### AC2: Configurable Voting Period ✅
**Given** different proposals may need different voting durations,
**When** creating a proposal,
**Then** the voting period is configurable with a default of 7 days.

**Technical Requirements:**
- Global parameter: `proposal_voting_period_seconds` (default: 604800 = 7 days)
- Stored in ParameterStorage program on Solana
- Can be updated by admin via parameter update instruction
- Proposals table has `voting_start` and `voting_end` columns
- Vote submission validates `voting_start <= NOW() <= voting_end`

**Success Metrics:**
- Global parameter exists and is readable
- Default value is 7 days (604800 seconds)
- Proposals created with voting_end = voting_start + parameter value
- Votes rejected if outside voting period

---

### AC3: Vote Submission API (Reuses Story 2.1) ✅
**Given** the signature verification framework from Story 2.1,
**When** a user submits a proposal vote,
**Then** the signature is verified before storing the vote.

**Technical Requirements:**
- Edge Function: `submit-proposal-vote`
- Integration with Story 2.1: `verify-vote-signature` for signature validation
- Vote message format:
  ```typescript
  {
    proposal_id: string,
    vote_choice: 'YES' | 'NO',
    timestamp: number,
    nonce: string
  }
  ```
- Signature verification: Ed25519 using voter's Solana wallet public key
- Nonce tracking: Stored in `vote_nonces` table (from Story 2.1)
- Error codes: 400 (invalid), 401 (bad signature), 409 (double vote), 500 (server error)

**Success Metrics:**
- Edge Function successfully verifies signatures
- Invalid signatures rejected with 401
- Duplicate votes rejected with 409
- Nonces prevent replay attacks

---

### AC4: Vote Weight Modes ✅
**Given** the platform supports both democratic and activity-weighted voting,
**When** a user votes on a proposal,
**Then** vote weight is calculated based on the current voting mode.

**Technical Requirements:**
- Global parameter: `voting_weight_mode` (DEMOCRATIC or ACTIVITY_WEIGHTED)
- Democratic mode: `vote_weight = 1` for all voters
- Activity-weighted mode: `vote_weight = user's activity_points balance`
- Vote weight calculated at vote submission time
- Vote weight stored in `proposal_votes.vote_weight` column

**Algorithm:**
```typescript
async function calculateVoteWeight(
  voterWallet: string,
  votingMode: 'DEMOCRATIC' | 'ACTIVITY_WEIGHTED'
): Promise<number> {
  if (votingMode === 'DEMOCRATIC') {
    return 1; // Every vote counts equally
  }

  // Activity-weighted: fetch user's activity points
  const user = await supabase
    .from('users')
    .select('activity_points')
    .eq('wallet_address', voterWallet)
    .single();

  return user.data?.activity_points || 1; // Default to 1 if no points
}
```

**Success Metrics:**
- Democratic mode: All votes have weight = 1
- Activity-weighted mode: Votes have weight = user's activity_points
- Vote weight correctly stored in database
- Mode can be toggled by admin (Story 2.8)

---

### AC5: Real-Time Vote Tallies ✅
**Given** the need to see proposal voting progress,
**When** querying proposal votes,
**Then** real-time aggregated tallies are available.

**Technical Requirements:**
- Database view: `proposal_vote_summary`
  ```sql
  CREATE VIEW proposal_vote_summary AS
  SELECT
    proposal_id,
    COUNT(*) AS total_votes,
    SUM(CASE WHEN vote_choice = 'YES' THEN vote_weight ELSE 0 END) AS yes_weight,
    SUM(CASE WHEN vote_choice = 'NO' THEN vote_weight ELSE 0 END) AS no_weight,
    COUNT(DISTINCT voter_wallet) AS unique_voters,
    (SUM(CASE WHEN vote_choice = 'YES' THEN vote_weight ELSE 0 END)::FLOAT /
     NULLIF(SUM(vote_weight), 0)) * 100 AS yes_percentage
  FROM proposal_votes
  GROUP BY proposal_id;
  ```
- Query performance: <100ms for proposals with <10,000 votes
- Indexes ensure fast aggregation

**Success Metrics:**
- View returns accurate vote tallies
- Query performance <100ms
- Real-time updates (no caching lag)
- Correct calculation of yes_percentage

---

### AC6: Proposal Status Transitions ✅
**Given** proposals move through different states during voting,
**When** voting starts or ends,
**Then** proposal status transitions correctly.

**Technical Requirements:**
- Proposal statuses:
  - `PENDING`: Created, waiting for voting to start
  - `VOTING`: Currently accepting votes
  - `VOTE_COMPLETE`: Voting period ended, awaiting finalization
  - `APPROVED`: Proposal passed (Story 2.5)
  - `REJECTED`: Proposal failed (Story 2.5)

- Status transitions:
  ```
  PENDING → VOTING (when voting_start reached)
  VOTING → VOTE_COMPLETE (when voting_end reached)
  VOTE_COMPLETE → APPROVED or REJECTED (Story 2.5)
  ```

- Automated transition: Cron job checks for proposals to transition
- Manual transition: Admin can trigger via Edge Function

**Success Metrics:**
- Proposals transition PENDING → VOTING at voting_start
- Proposals transition VOTING → VOTE_COMPLETE at voting_end
- Votes only accepted during VOTING status
- Status accurately reflects proposal lifecycle

---

### AC7: Successful Vote Collection ✅
**Given** the complete proposal voting workflow,
**When** users submit votes via the API,
**Then** votes are successfully collected and stored.

**Test Scenarios:**
1. **Happy Path:** User votes YES on active proposal
   - Expected: Vote stored, signature verified, weight calculated
2. **Democratic Voting:** 10 users vote with democratic mode
   - Expected: All votes have weight = 1
3. **Activity-Weighted Voting:** 5 users vote with activity-weighted mode
   - Expected: Votes have weight = user's activity_points
4. **Double Vote Prevention:** User tries to vote twice on same proposal
   - Expected: Second vote rejected with 409 Conflict
5. **Invalid Signature:** User submits vote with bad signature
   - Expected: Vote rejected with 401 Unauthorized
6. **Expired Voting Period:** User votes after voting_end
   - Expected: Vote rejected with 409 Conflict (voting ended)
7. **Real-Time Tallies:** Query vote summary during voting
   - Expected: Accurate yes/no counts and percentage

**Success Metrics:**
- All 7 test scenarios pass
- Votes stored correctly in database
- Signature verification works
- Double-voting prevented
- Real-time tallies accurate

---

## Technical Approach

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              Proposal Voting Workflow (Story 2.4)           │
└─────────────────────────────────────────────────────────────┘

1. User Creates Vote Message
   ┌────────────────────┐
   │ Frontend (Wallet)  │
   ├────────────────────┤
   │ Message:           │
   │ {                  │
   │   proposal_id,     │
   │   vote_choice,     │
   │   timestamp,       │
   │   nonce            │
   │ }                  │
   │                    │
   │ Sign with wallet   │
   │ (Ed25519)          │
   └────────┬───────────┘
            │
            v
   ┌────────────────────┐
   │ POST /submit-      │
   │ proposal-vote      │
   │                    │
   │ Body: {            │
   │   proposal_id,     │
   │   vote_choice,     │
   │   signature,       │
   │   public_key       │
   │ }                  │
   └────────┬───────────┘

2. Signature Verification (Story 2.1 Integration)
            │
            v
   ┌────────────────────────┐
   │ submit-proposal-vote   │
   │ Edge Function          │
   ├────────────────────────┤
   │ 1. Call verify-vote-   │
   │    signature           │ → Uses Story 2.1's verification
   │ 2. Check nonce         │ → Replay attack prevention
   │ 3. Validate proposal   │ → Must be in VOTING status
   │ 4. Check voting period │ → Within start/end window
   └────────┬───────────────┘
            │
            v
   ┌────────────────────────┐
   │ verify-vote-signature  │
   │ (Story 2.1)            │
   ├────────────────────────┤
   │ - Verify Ed25519 sig   │
   │ - Validate timestamp   │
   │ - Check nonce          │
   │ - Return valid/invalid │
   └────────┬───────────────┘
            │
            v (if valid)

3. Vote Weight Calculation
   ┌────────────────────────┐
   │ Calculate Vote Weight  │
   ├────────────────────────┤
   │ IF mode = DEMOCRATIC:  │
   │   weight = 1           │
   │ ELSE (ACTIVITY):       │
   │   SELECT activity_     │
   │   points FROM users    │
   │   WHERE wallet =       │
   │   voter_wallet         │
   └────────┬───────────────┘
            │
            v

4. Store Vote in PostgreSQL
   ┌────────────────────────────────┐
   │ INSERT INTO proposal_votes     │
   │ (                              │
   │   proposal_id,                 │
   │   voter_wallet,                │
   │   vote_choice,                 │
   │   signature,                   │
   │   vote_weight,                 │
   │   timestamp,                   │
   │   nonce                        │
   │ )                              │
   ├────────────────────────────────┤
   │ Constraint:                    │
   │ UNIQUE (proposal_id,           │
   │         voter_wallet)          │
   │ → Prevents double voting       │
   └────────┬───────────────────────┘
            │
            v

5. Real-Time Aggregation (View)
   ┌────────────────────────────────┐
   │ proposal_vote_summary VIEW     │
   ├────────────────────────────────┤
   │ SELECT                         │
   │   proposal_id,                 │
   │   COUNT(*) AS total_votes,     │
   │   SUM(yes) AS yes_weight,      │
   │   SUM(no) AS no_weight,        │
   │   yes_percentage               │
   │ FROM proposal_votes            │
   │ GROUP BY proposal_id           │
   └────────────────────────────────┘
```

---

### Component Breakdown

#### 1. Database Migration: `proposal_votes` Table

**File:** `database/migrations/007_proposal_votes.sql`

**Table Structure:**
```sql
CREATE TABLE proposal_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Proposal reference
    proposal_id TEXT NOT NULL,

    -- Voter info
    voter_wallet TEXT NOT NULL,

    -- Vote data
    vote_choice TEXT NOT NULL CHECK (vote_choice IN ('YES', 'NO')),
    signature TEXT NOT NULL,
    vote_weight INTEGER NOT NULL DEFAULT 1,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Security
    nonce TEXT NOT NULL,

    -- Constraints
    CONSTRAINT unique_proposal_voter UNIQUE (proposal_id, voter_wallet),
    CONSTRAINT vote_choice_check CHECK (vote_choice IN ('YES', 'NO')),
    CONSTRAINT vote_weight_positive CHECK (vote_weight > 0),

    -- Foreign keys
    CONSTRAINT fk_proposal
        FOREIGN KEY (proposal_id)
        REFERENCES proposals(proposal_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_voter
        FOREIGN KEY (voter_wallet)
        REFERENCES users(wallet_address)
        ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_proposal_votes_proposal ON proposal_votes(proposal_id);
CREATE INDEX idx_proposal_votes_voter ON proposal_votes(voter_wallet);
CREATE INDEX idx_proposal_votes_timestamp ON proposal_votes(timestamp DESC);
CREATE INDEX idx_proposal_votes_nonce ON proposal_votes(nonce);

-- View for real-time tallies
CREATE VIEW proposal_vote_summary AS
SELECT
    proposal_id,
    COUNT(*) AS total_votes,
    SUM(CASE WHEN vote_choice = 'YES' THEN vote_weight ELSE 0 END) AS yes_weight,
    SUM(CASE WHEN vote_choice = 'NO' THEN vote_weight ELSE 0 END) AS no_weight,
    COUNT(DISTINCT voter_wallet) AS unique_voters,
    (SUM(CASE WHEN vote_choice = 'YES' THEN vote_weight ELSE 0 END)::FLOAT /
     NULLIF(SUM(vote_weight), 0)) * 100 AS yes_percentage
FROM proposal_votes
GROUP BY proposal_id;
```

---

#### 2. Edge Function: `submit-proposal-vote`

**File:** `supabase/functions/submit-proposal-vote/index.ts`

**Responsibilities:**
- Receives vote submission from frontend
- Integrates with Story 2.1 for signature verification
- Validates proposal status and voting period
- Calculates vote weight based on voting mode
- Stores vote in PostgreSQL
- Returns success/error response

**Input:**
```typescript
interface SubmitProposalVoteRequest {
  proposal_id: string;
  vote_choice: 'YES' | 'NO';
  signature: string; // Base58 encoded
  public_key: string; // Voter's Solana wallet public key
  timestamp: number; // Unix timestamp
  nonce: string; // Unique nonce for replay prevention
}
```

**Output:**
```typescript
interface SubmitProposalVoteResponse {
  success: boolean;
  vote_id?: string; // UUID of created vote
  vote_weight?: number;
  current_tally?: {
    yes_weight: number;
    no_weight: number;
    total_votes: number;
  };
  error?: string;
}
```

**Error Codes:**
- `400`: Invalid request (missing fields, invalid format)
- `401`: Invalid signature
- `404`: Proposal not found
- `409`: Duplicate vote OR voting period ended
- `500`: Server error

---

#### 3. Integration with Story 2.1: Signature Verification

**Reuse Pattern:**
```typescript
// In submit-proposal-vote/index.ts
import { verifyVoteSignature } from "../verify-vote-signature/index.ts";

// Verify signature before storing vote
const message = {
  proposal_id,
  vote_choice,
  timestamp,
  nonce,
};

const isValid = await verifyVoteSignature(
  message,
  signature,
  publicKey,
  "proposal" // Context: proposal vote vs market vote
);

if (!isValid) {
  return new Response(
    JSON.stringify({ success: false, error: "Invalid signature" }),
    { status: 401 }
  );
}
```

**Nonce Tracking:**
- Uses same `vote_nonces` table from Story 2.1
- Prevents replay attacks across both market and proposal votes
- Nonces are unique per wallet (not per proposal)

---

#### 4. Proposal Status Management

**Status Transition Logic:**

Currently proposals are created via ProposalSystem (Epic 1 Story 1.7), but status transitions need automation:

**Option A: Cron Job (Preferred)**
```sql
-- Check for proposals ready to transition
SELECT cron.schedule(
    'transition-proposal-status',
    '*/5 * * * *', -- Every 5 minutes
    $$
    -- PENDING → VOTING
    UPDATE proposals
    SET status = 'VOTING'
    WHERE status = 'PENDING'
      AND voting_start <= NOW();

    -- VOTING → VOTE_COMPLETE
    UPDATE proposals
    SET status = 'VOTE_COMPLETE'
    WHERE status = 'VOTING'
      AND voting_end <= NOW();
    $$
);
```

**Option B: Manual Trigger (Fallback)**
- Admin dashboard button: "Transition Proposal Status"
- Edge Function: `transition-proposal-status`
- Used for testing or if cron fails

---

#### 5. Vote Weight Calculation

**Implementation:**
```typescript
async function calculateVoteWeight(
  voterWallet: string,
  votingMode: 'DEMOCRATIC' | 'ACTIVITY_WEIGHTED'
): Promise<number> {
  if (votingMode === 'DEMOCRATIC') {
    return 1; // Every vote counts equally
  }

  // Activity-weighted: fetch user's activity points
  const { data: user, error } = await supabase
    .from('users')
    .select('activity_points')
    .eq('wallet_address', voterWallet)
    .single();

  if (error || !user) {
    console.warn(`User ${voterWallet} not found, defaulting to weight 1`);
    return 1; // Default for new users with no activity
  }

  // Ensure minimum weight of 1
  return Math.max(1, user.activity_points || 1);
}
```

**Voting Mode Detection:**
```typescript
async function getVotingMode(): Promise<'DEMOCRATIC' | 'ACTIVITY_WEIGHTED'> {
  // Fetch from global parameters (Solana)
  // For MVP: Default to DEMOCRATIC
  // Story 2.8 will implement mode toggling
  return 'DEMOCRATIC';
}
```

---

## Implementation Plan

### Phase 1: Database Schema
**Estimated Time:** 45 minutes

**Files:**
- `database/migrations/007_proposal_votes.sql`

**Tasks:**
1. Create `proposal_votes` table
2. Add indexes for performance
3. Create `proposal_vote_summary` view
4. Add RLS policies
5. Test migration: `supabase db push`

---

### Phase 2: Edge Function - Submit Proposal Vote
**Estimated Time:** 2 hours

**Files:**
- `supabase/functions/submit-proposal-vote/index.ts`

**Tasks:**
1. Create Edge Function skeleton
2. Integrate with Story 2.1 signature verification
3. Implement proposal validation (status, voting period)
4. Implement vote weight calculation
5. Implement vote storage with duplicate prevention
6. Implement real-time tally query
7. Add comprehensive error handling
8. Test with manual API calls

---

### Phase 3: Proposal Status Transitions
**Estimated Time:** 1 hour

**Files:**
- `database/migrations/007_proposal_votes.sql` (cron job setup)
- Documentation for manual trigger

**Tasks:**
1. Create cron job for status transitions
2. Test PENDING → VOTING transition
3. Test VOTING → VOTE_COMPLETE transition
4. Document manual trigger option
5. Verify status enforcement during vote submission

---

### Phase 4: Testing
**Estimated Time:** 1.5 hours

**Test Files:**
- Manual testing via curl/Postman
- Future: `supabase/functions/submit-proposal-vote/test.ts`

**Tasks:**
1. Test happy path (democratic voting)
2. Test activity-weighted voting
3. Test double-vote prevention
4. Test invalid signature rejection
5. Test expired voting period rejection
6. Test real-time tallies
7. Validate all 7 AC7 scenarios

---

### Phase 5: Configuration
**Estimated Time:** 30 minutes

**Files:**
- `supabase/config.toml` (register function)

**Tasks:**
1. Register `submit-proposal-vote` function
2. Configure environment variables (if needed)
3. Test deployment to Supabase

---

### Phase 6: Documentation
**Estimated Time:** 1 hour

**Files:**
- `docs/STORY-2.4-COMPLETE.md`
- `docs/bmm-workflow-status.md`

**Tasks:**
1. Document implementation details
2. Validate all acceptance criteria met
3. Update workflow status (move 2.4 to completed)
4. Commit with proper BMAD message

---

## Testing Strategy

### Unit Tests

1. **Vote Weight Calculation**
   - Input: Democratic mode
   - Expected: weight = 1 for all users

   - Input: Activity-weighted mode, user with 100 points
   - Expected: weight = 100

2. **Signature Verification Integration**
   - Input: Valid signature from Story 2.1
   - Expected: Verification passes

   - Input: Invalid signature
   - Expected: Verification fails, 401 error

3. **Duplicate Vote Prevention**
   - Input: User votes twice on same proposal
   - Expected: Second vote rejected with 409

### Integration Tests

1. **End-to-End Vote Submission**
   - Setup: Create proposal, set status to VOTING
   - Action: Submit vote via API
   - Validation: Vote stored, tally updated

2. **Real-Time Tallies**
   - Setup: Submit 10 votes (6 YES, 4 NO)
   - Query: proposal_vote_summary view
   - Expected: yes_weight=6, no_weight=4, yes_percentage=60%

3. **Status Enforcement**
   - Setup: Proposal in PENDING status
   - Action: Try to submit vote
   - Expected: Vote rejected (voting not started)

---

## Dependencies

### Internal Dependencies
- ✅ **Story 2.1:** Signature verification framework (votes table has same pattern)
- ✅ **Epic 1 Story 1.7:** ProposalSystem program (proposals exist on-chain and in database)
- ✅ **Epic 1 Story 1.11:** Activity points system (for weighted voting)

### External Dependencies
- Supabase Edge Functions (runtime environment)
- PostgreSQL database (for vote storage)
- Solana wallets (for signature generation)

---

## Risks and Mitigations

### Risk 1: ProposalSystem Integration Complexity
**Risk:** Story 1.7 program may not have all needed fields for voting periods
**Mitigation:**
- Check existing proposals table schema
- Add columns if needed (voting_start, voting_end, status transitions)
- Ensure backward compatibility

---

### Risk 2: Vote Weight Calculation Performance
**Risk:** Querying activity_points for every vote could be slow
**Mitigation:**
- Cache voting mode in memory (rarely changes)
- Use efficient single-row query for activity_points
- Monitor performance, optimize if needed
- For MVP: Democratic mode (constant weight = 1)

---

### Risk 3: Status Transition Timing
**Risk:** Cron job may not run exactly at voting_start/voting_end
**Mitigation:**
- 5-minute cron frequency acceptable for MVP
- Vote submission validates voting period manually
- Reject votes if NOW() < voting_start OR NOW() > voting_end

---

### Risk 4: Signature Verification Edge Cases
**Risk:** Story 2.1 may need updates for proposal context
**Mitigation:**
- Review Story 2.1 implementation
- Ensure message format supports proposal_id vs market_id
- Test with different message structures
- Add context parameter if needed

---

## Success Metrics

### Functional Metrics
- ✅ Votes stored successfully in proposal_votes table
- ✅ Signature verification prevents invalid votes
- ✅ Double-voting prevented by unique constraint
- ✅ Vote weight calculated correctly (democratic/activity modes)
- ✅ Real-time tallies accurate and performant (<100ms)
- ✅ Status transitions work (PENDING → VOTING → VOTE_COMPLETE)
- ✅ All 7 test scenarios pass

### Non-Functional Metrics
- ✅ API response time: <500ms for vote submission
- ✅ Query performance: <100ms for vote tallies
- ✅ Database constraints enforce data integrity
- ✅ Error handling provides clear user feedback

---

## Deployment Checklist

### Pre-Deployment
- [ ] Database migration tested locally
- [ ] Edge Function tested with manual API calls
- [ ] Signature verification integration validated
- [ ] Real-time tallies queried successfully
- [ ] Status transitions working
- [ ] All acceptance criteria validated

### Deployment Steps
1. Run database migration: `supabase db push`
2. Deploy Edge Function: `supabase functions deploy submit-proposal-vote`
3. Configure cron job in Supabase dashboard
4. Test vote submission on devnet
5. Verify vote storage and tallies

### Post-Deployment
- [ ] Submit test vote via API
- [ ] Query vote tallies from database
- [ ] Verify status transitions via cron
- [ ] Monitor Edge Function logs
- [ ] Check for errors in Supabase dashboard

---

## Future Enhancements (Out of Scope for Story 2.4)

1. **Vote Delegation:** Allow users to delegate voting power
2. **Quadratic Voting:** Implement quadratic vote weighting
3. **Threshold Notifications:** Alert users when proposals near approval threshold
4. **Vote History:** User dashboard showing all votes cast
5. **Voting Analytics:** Track participation rates, popular proposals

---

## BMAD Compliance Notes

### Story Workflow
- ✅ Story file created BEFORE implementation (this file)
- ✅ Previous story (2.3) is complete
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
3. Create `docs/STORY-2.4-COMPLETE.md`
4. Update `docs/bmm-workflow-status.md`
5. Commit: "feat: Complete Story 2.4 - Proposal Voting via Snapshot"

---

**STORY 2.4 READY FOR IMPLEMENTATION** ✅
**BMAD COMPLIANCE: 100%** ✅
**Prerequisites: ALL MET** ✅

---

_Created: 2025-10-26_
_Epic: 2 - Community Governance_
_Story: 2.4 - Proposal Voting via Snapshot_
_Status: 📝 Ready for Implementation_
_Estimated Time: 6-7 hours total implementation_
