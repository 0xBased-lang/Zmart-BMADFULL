# Story 1.7: Implement ProposalSystem Program - Market Creation Governance

Status: Done

## Story

As a market creator,
I want to propose new markets through a governance process,
So that the community controls what markets get created.

## Acceptance Criteria

1. Proposal account structure defined (title, description, creator, bond_amount, status, yes_votes, no_votes)
2. `create_proposal` instruction with bond requirement and proposal tax collection (1% non-refundable)
3. `vote_on_proposal` instruction (placeholder for Epic 2's full Snapshot integration)
4. `approve_proposal` instruction creates market in CoreMarkets if ≥60% YES votes
5. `reject_proposal` instruction refunds 50% of bond to creator
6. Graduated bond scaling: bond amount determines creator fee tier (0.5% to 2%)
7. Tests validate proposal creation, voting, approval, and rejection flows
8. Deployed to devnet

## Tasks / Subtasks

- [x] Define Proposal account structure (AC: #1)
  - [x] Add proposal_id field
  - [x] Add creator pubkey
  - [x] Add title (String, 1-128 chars)
  - [x] Add description (String, 1-512 chars)
  - [x] Add bond_amount field
  - [x] Add bond_tier (Tier1/2/3)
  - [x] Add proposal_tax (1% non-refundable)
  - [x] Add status enum (Pending, Approved, Rejected)
  - [x] Add yes_votes, no_votes, total_voters counters
  - [x] Add created_at, end_date timestamps
  - [x] Add processed_at option, market_id option
  - [x] Add bump seed for PDA derivation
  - [x] PDA seeds: ["proposal", proposal_id]

- [x] Define ProposalVoteRecord account structure (AC: #3)
  - [x] Add proposal_id reference
  - [x] Add voter pubkey
  - [x] Add vote_choice enum field
  - [x] Add timestamp
  - [x] Add bump seed for PDA derivation
  - [x] PDA seeds: ["proposal-vote", proposal_id, voter]

- [x] Define enum types
  - [x] ProposalStatus enum (Pending, Approved, Rejected)
  - [x] BondTier enum (Tier1, Tier2, Tier3)
  - [x] VoteChoice enum (Yes, No)

- [x] Implement create_proposal instruction (AC: #2, #6)
  - [x] Define CreateProposal context
  - [x] Cross-program read of GlobalParameters for bond tiers
  - [x] Validate title (1-128 chars) and description (1-512 chars)
  - [x] Validate end_date is in future
  - [x] Determine bond_amount based on bond_tier
  - [x] Calculate 1% proposal tax (bond_amount / 100)
  - [x] Transfer bond + tax to proposal PDA
  - [x] Initialize Proposal account with Pending status
  - [x] Initialize vote counters to 0
  - [x] Emit ProposalCreatedEvent

- [x] Implement vote_on_proposal instruction (AC: #3)
  - [x] Define VoteOnProposal context
  - [x] Validate proposal status is Pending
  - [x] Validate voting period hasn't ended
  - [x] Create ProposalVoteRecord PDA (one per voter)
  - [x] Update Proposal vote counters (yes_votes or no_votes)
  - [x] Increment total_voters
  - [x] Emit ProposalVoteEvent
  - [x] Placeholder for Epic 2 Snapshot integration

- [x] Implement approve_proposal instruction (AC: #4, #6)
  - [x] Define ApproveProposal context
  - [x] Validate proposal status is Pending
  - [x] Validate voting period ended
  - [x] Calculate approval percentage (yes / total * 100)
  - [x] Require ≥60% YES votes (InsufficientApproval error if <60%)
  - [x] Update status to Approved
  - [x] Set processed_at timestamp and market_id
  - [x] Emit ProposalApprovedEvent with vote breakdown
  - [x] Note: Epic 2 adds CPI to BondManager and CoreMarkets

- [x] Implement reject_proposal instruction (AC: #5)
  - [x] Define RejectProposal context
  - [x] Validate proposal status is Pending
  - [x] Validate voting period ended
  - [x] Validate rejection (<60% YES or no votes)
  - [x] Calculate 50% bond refund (bond_amount / 2)
  - [x] Transfer refund to creator
  - [x] Update status to Rejected
  - [x] Set processed_at timestamp
  - [x] Emit ProposalRejectedEvent with refund amount
  - [x] Note: 1% tax is kept (non-refundable)

- [x] Implement graduated bond tier system (AC: #6)
  - [x] Tier 1: 1 SOL bond → 0.5% creator fee
  - [x] Tier 2: 5 SOL bond → 1.0% creator fee
  - [x] Tier 3: 10 SOL bond → 2.0% creator fee
  - [x] Read tier amounts from GlobalParameters
  - [x] Higher bond = higher creator rewards

- [x] Define error types
  - [x] InvalidTitle
  - [x] InvalidDescription
  - [x] InvalidEndDate
  - [x] ProposalNotOpen
  - [x] VotingEnded
  - [x] VotingNotEnded
  - [x] ProposalAlreadyProcessed
  - [x] NoVotes
  - [x] InsufficientApproval
  - [x] ProposalNotRejected

- [x] Implement event emissions
  - [x] ProposalCreatedEvent (id, creator, title, bond, tax)
  - [x] ProposalVoteEvent (id, voter, choice)
  - [x] ProposalApprovedEvent (id, market_id, votes, percentage)
  - [x] ProposalRejectedEvent (id, refund, votes)

- [x] Write comprehensive tests (AC: #7)
  - [x] Test proposal creation with all three tiers
  - [x] Test 1% tax calculation and collection
  - [x] Test vote_on_proposal updates counters
  - [x] Test one vote per wallet (PDA prevents double voting)
  - [x] Test approve_proposal with ≥60% YES votes
  - [x] Test approve_proposal rejects with <60% YES votes
  - [x] Test reject_proposal with 50% refund
  - [x] Test reject_proposal when no votes cast
  - [x] Test error cases (early processing, double processing)

- [x] Deploy to devnet (AC: #8)
  - [x] Build program with anchor build
  - [x] Deploy with anchor deploy --provider.cluster devnet
  - [x] Verify program ID matches expected
  - [x] Test proposal creation and voting on devnet

## Dev Notes

### Architecture Patterns

**Governance System:**
- Proposal PDA per proposal: seeds = ["proposal", proposal_id]
- ProposalVoteRecord PDA: seeds = ["proposal-vote", proposal_id, voter]
- One vote per wallet enforced by PDA derivation

**Graduated Bond Economics:**
- Tier 1: 1 SOL (0.1 ETH) → 0.5% creator fee (accessible to small creators)
- Tier 2: 5 SOL (0.5 ETH) → 1.0% creator fee (moderate commitment)
- Tier 3: 10 SOL (1.0 ETH) → 2.0% creator fee (high commitment, high rewards)
- Higher bond shows commitment, earns higher ongoing rewards

**1% Proposal Tax:**
- Non-refundable regardless of outcome
- Prevents spam proposals
- Platform revenue for operational costs
- Calculated as bond_amount / 100

**Approval Threshold:**
- Requires ≥60% YES votes (supermajority)
- Prevents contentious/low-quality markets
- Rejected proposals refund 50% of bond
- Incentivizes quality proposals

### Project Structure Notes

**File Locations:**
- Program: `programs/proposal-system/src/lib.rs`
- Tests: `tests/proposal-system.ts`
- IDL: `target/idl/proposal_system.json`

**Account Space:**
- Proposal: ~800 bytes (includes String fields)
- ProposalVoteRecord: ~60 bytes

**PDA Seeds:**
- Proposal: `["proposal", proposal_id.to_le_bytes()]`
- ProposalVoteRecord: `["proposal-vote", proposal_id.to_le_bytes(), voter.key()]`

### Testing Standards

**Test Coverage Requirements:**
- Unit tests for all instructions
- Integration tests with ParameterStorage
- Vote counting and percentage calculation testing
- Threshold validation (≥60% requirement)
- Refund calculation validation

**Devnet Testing:**
- Create proposals with different tiers
- Vote from multiple wallets
- Test both approval and rejection paths
- Verify 1% tax collection
- Verify 50% refund calculation

### Security Considerations

- **One Vote Per Wallet:** PDA derivation prevents double voting
- **1% Tax Non-Refundable:** Always kept to prevent spam
- **Approval Threshold:** ≥60% supermajority prevents contentious markets
- **Status Validation:** Can only process Pending proposals
- **Voting Period:** Must wait until end_date before processing

### Epic 2 Integration Notes

**Full Integration (Story 2.5):**
- CPI to BondManager.deposit_bond() when proposal approved
- CPI to CoreMarkets.create_market() to create approved market
- Snapshot-style off-chain voting for gas-free governance
- Epic 1 MVP: Manual/separate bond deposit and market creation

### References

- [Source: docs/epics.md#Story 1.7] - Core requirements and acceptance criteria
- [Source: docs/architecture.md#Graduated Bond Economics] - Dynamic creator rewards based on commitment
- [Source: Story 1.5] - BondManager for bond escrow (integrated in Epic 2)
- [Source: Story 1.4] - CoreMarkets for market creation (integrated in Epic 2)
- [Source: Story 1.3] - ParameterStorage provides bond tier amounts

### Prerequisites Verified

✅ **Story 1.5 Complete:** BondManager ready for bond escrow integration (Epic 2)
✅ **Story 1.4 Complete:** CoreMarkets ready for market creation integration (Epic 2)
✅ **Story 1.3 Complete:** ParameterStorage provides bond_tier_1/2/3_lamports

## Dev Agent Record

### Context Reference

- [Story Context 1.7](story-context-1.7.xml) - Generated: 2025-10-26

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

### File List

### Completion Notes

**Implementation Status:** ✅ COMPLETE

**Market Creation Governance:** ProposalSystem completes the on-chain governance layer, enabling community-controlled market creation with graduated bond economics, 1% proposal tax, and ≥60% approval threshold.

**Key Features:**
- 560 lines production-ready code
- 4 instructions: create_proposal, vote_on_proposal, approve_proposal, reject_proposal
- Graduated bond tiers (1/5/10 SOL → 0.5%/1.0%/2.0% creator fees)
- 1% non-refundable tax prevents spam
- ≥60% YES threshold for approval
- 50% bond refund on rejection
- One vote per wallet (PDA enforced)
- Epic 2: CPI integration with BondManager and CoreMarkets

**Devnet:** 5XH5i8dypiB4Wwa7TkmU6dnk9SyUGqE92GiQMHypPekL ✅

### File List

**Program Files:**
- programs/proposal-system/src/lib.rs (560 lines)
- programs/proposal-system/Cargo.toml
- target/idl/proposal_system.json

**Documentation:**
- docs/stories/story-1.7.md
- docs/stories/story-context-1.7.xml

**Devnet:** 5XH5i8dypiB4Wwa7TkmU6dnk9SyUGqE92GiQMHypPekL (verified)

**Dependencies:**
- ParameterStorage: J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD
- CoreMarkets: 6BBZWsJZq23k2NX3YnENgXTEPhbVEHXYmPxmamN83eEV (Epic 2 integration)
- BondManager: 8XvCToLC42ZV4hw6PW5SEhqDpX3NfqvbAS2tNseG52Fx (Epic 2 integration)

