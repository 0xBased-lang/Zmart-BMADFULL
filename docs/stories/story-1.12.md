# Story 1.12: End-to-End Integration Test and Devnet Deployment

Status: Ready

## Story

As a developer,
I want to validate the complete system works end-to-end on devnet,
So that I'm confident the foundation is solid before Epic 2.

## Acceptance Criteria

1. **AC#1**: Complete E2E test script: create market → place bets → resolve market → claim payouts
2. **AC#2**: All 6 programs deployed to devnet with correct addresses registered in ProgramRegistry
3. **AC#3**: ParameterStorage initialized with default values on devnet
4. **AC#4**: Event listener running and successfully syncing devnet events to database
5. **AC#5**: Database queries return accurate data matching on-chain state
6. **AC#6**: Activity points correctly awarded for test actions
7. **AC#7**: Performance benchmarks: database queries <100ms, transaction success rate >99%
8. **AC#8**: Documentation created: devnet program IDs, test accounts, known issues
9. **AC#9**: All Epic 1 acceptance criteria validated and passing

## Tasks / Subtasks

### Task 1: Create E2E Test Script (AC: #1)
- [ ] 1.1: Set up test environment with devnet connection and test wallets
- [ ] 1.2: Implement test step: Create market via ProposalSystem and CoreMarkets
- [ ] 1.3: Implement test step: Deposit bond via BondManager
- [ ] 1.4: Implement test step: Place bets from multiple users
- [ ] 1.5: Implement test step: Advance time to voting period
- [ ] 1.6: Implement test step: Submit resolution votes
- [ ] 1.7: Implement test step: Aggregate votes and finalize resolution
- [ ] 1.8: Implement test step: Claim payouts for winning bettors
- [ ] 1.9: Implement test step: Claim creator fees
- [ ] 1.10: Implement test step: Refund bond to creator
- [ ] 1.11: Add assertions for each step to validate state transitions
- [ ] 1.12: Add cleanup logic to reset test state between runs

### Task 2: Deploy All Programs to Devnet (AC: #2)
- [ ] 2.1: Deploy ProgramRegistry to devnet
- [ ] 2.2: Deploy ParameterStorage to devnet
- [ ] 2.3: Deploy CoreMarkets to devnet
- [ ] 2.4: Deploy MarketResolution to devnet
- [ ] 2.5: Deploy ProposalSystem to devnet
- [ ] 2.6: Deploy BondManager to devnet
- [ ] 2.7: Register all program addresses in ProgramRegistry
- [ ] 2.8: Verify all programs are accessible on devnet
- [ ] 2.9: Document all program IDs for reference

### Task 3: Initialize ParameterStorage on Devnet (AC: #3)
- [ ] 3.1: Call initialize_parameters instruction on devnet
- [ ] 3.2: Set default fee percentages (platform: 1%, LP: 1.5%, creator: 0.5-2%)
- [ ] 3.3: Set default bond tiers (Tier1, Tier2, Tier3)
- [ ] 3.4: Set default time limits (voting period, dispute window, stale market threshold)
- [ ] 3.5: Set default feature toggles (all enabled)
- [ ] 3.6: Verify parameter values are correctly set
- [ ] 3.7: Test parameter update instruction with admin wallet

### Task 4: Deploy and Test Event Listener (AC: #4)
- [ ] 4.1: Deploy sync-events Edge Function to Supabase (devnet config)
- [ ] 4.2: Configure devnet RPC endpoint for event monitoring
- [ ] 4.3: Test event sync for MarketCreated event
- [ ] 4.4: Test event sync for BetPlaced event
- [ ] 4.5: Test event sync for VoteSubmitted event
- [ ] 4.6: Test event sync for PayoutClaimed event
- [ ] 4.7: Verify database records match on-chain events
- [ ] 4.8: Monitor event listener logs for errors

### Task 5: Database Consistency Validation (AC: #5)
- [ ] 5.1: Query markets table and compare with on-chain Market accounts
- [ ] 5.2: Query bets table and compare with on-chain UserBet accounts
- [ ] 5.3: Query votes table and compare with on-chain vote records
- [ ] 5.4: Query activity_points table and verify point awards
- [ ] 5.5: Validate foreign key relationships are correct
- [ ] 5.6: Check for orphaned records (database but not on-chain)
- [ ] 5.7: Check for missing records (on-chain but not in database)

### Task 6: Activity Point Integration Testing (AC: #6)
- [ ] 6.1: Create market and verify +20 activity points awarded to creator
- [ ] 6.2: Place bet and verify +5 activity points awarded to bettor
- [ ] 6.3: Submit vote and verify +10 activity points awarded to voter
- [ ] 6.4: Claim winning bet and verify accuracy bonus points awarded
- [ ] 6.5: Query leaderboard and verify rankings are correct
- [ ] 6.6: Test activity point breakdown by category
- [ ] 6.7: Verify activity points are queryable for weighted voting

### Task 7: Performance Benchmarking (AC: #7)
- [ ] 7.1: Benchmark database query performance (target: <100ms)
- [ ] 7.2: Measure market creation transaction time
- [ ] 7.3: Measure bet placement transaction time
- [ ] 7.4: Measure vote submission and aggregation time
- [ ] 7.5: Measure payout claim transaction time
- [ ] 7.6: Calculate transaction success rate (target: >99%)
- [ ] 7.7: Identify and document any performance bottlenecks
- [ ] 7.8: Create performance regression test suite

### Task 8: Documentation (AC: #8)
- [ ] 8.1: Document all devnet program IDs in deployment-info.md
- [ ] 8.2: Document test wallet addresses and funding process
- [ ] 8.3: Create devnet deployment guide with step-by-step instructions
- [ ] 8.4: Document known issues and workarounds
- [ ] 8.5: Create troubleshooting guide for common devnet issues
- [ ] 8.6: Update architecture.md with deployment architecture
- [ ] 8.7: Create devnet testing runbook for future regression tests

### Task 9: Epic 1 Acceptance Criteria Validation (AC: #9)
- [ ] 9.1: Run all Story 1.1 acceptance criteria tests (Anchor workspace setup)
- [ ] 9.2: Run all Story 1.2 acceptance criteria tests (ProgramRegistry)
- [ ] 9.3: Run all Story 1.3 acceptance criteria tests (ParameterStorage)
- [ ] 9.4: Run all Story 1.4 acceptance criteria tests (CoreMarkets)
- [ ] 9.5: Run all Story 1.5 acceptance criteria tests (BondManager)
- [ ] 9.6: Run all Story 1.6 acceptance criteria tests (MarketResolution)
- [ ] 9.7: Run all Story 1.7 acceptance criteria tests (ProposalSystem)
- [ ] 9.8: Run all Story 1.8 acceptance criteria tests (Database setup)
- [ ] 9.9: Run all Story 1.9 acceptance criteria tests (Event listener)
- [ ] 9.10: Run all Story 1.10 acceptance criteria tests (Payout claims)
- [ ] 9.11: Run all Story 1.11 acceptance criteria tests (Activity points)
- [ ] 9.12: Generate Epic 1 test coverage report

## Dev Notes

### Architecture Patterns

**Epic Boundary Testing Pattern**
- Validates all Epic 1 stories working together as a cohesive foundation
- Tests cross-program interactions and state machine transitions
- Ensures database consistency with on-chain state
- Establishes performance baselines for regression testing

**Devnet Deployment Strategy**
- Real network conditions (not localnet simulation)
- Persistent deployment for integration testing
- Event listener syncing real devnet events
- Performance benchmarking on actual network

**Pull-Based Architecture Validation**
- Market creation gated by proposals (ProposalSystem → CoreMarkets)
- Bond escrow pattern (BondManager → Market creation)
- Payout claims initiated by users (pull not push)
- Activity points accumulated automatically via triggers

**Registry Pattern Validation**
- All programs registered in ProgramRegistry
- Cross-program lookups via registry
- Version tracking for upgrades
- Decoupled program dependencies

### Components to Test

**Solana Programs (All 6):**
- `programs/program-registry/src/lib.rs` - Program address registry
- `programs/parameter-storage/src/lib.rs` - Global configuration
- `programs/core-markets/src/lib.rs` - Market creation and betting
- `programs/market-resolution/src/lib.rs` - Resolution voting
- `programs/proposal-system/src/lib.rs` - Proposal governance
- `programs/bond-manager/src/lib.rs` - Bond escrow and creator fees

**Database & Backend:**
- Supabase database with all tables (markets, bets, votes, activity_points, proposals)
- Event listener (sync-events) syncing all devnet events
- Edge Functions (get-user-profile, admin APIs)

**Test Infrastructure:**
- `tests/integration/epic-1-e2e.ts` - Main E2E test script
- `tests/helpers/devnet-utils.ts` - Devnet deployment and management utilities
- `tests/performance/benchmarks.ts` - Performance testing suite

### Testing Standards

**Anchor Tests (Rust):**
- Location: `tests/epic-1-e2e.ts`
- Coverage: Full Epic 1 flow, cross-program interactions, state transitions
- Edge cases: Concurrent actions, error conditions, boundary values

**Integration Tests (TypeScript):**
- Location: `tests/integration/epic-1-e2e.ts`
- Coverage: Database sync, event handling, performance benchmarks
- Edge cases: Network failures, transaction retries, event ordering

**Performance Tests:**
- Location: `tests/performance/benchmarks.ts`
- Metrics: Transaction latency, database query time, event sync delay, success rate
- Targets: <100ms database queries, >99% transaction success rate

### Constraints

1. **Devnet Only**: Tests MUST run against devnet (not localnet) for real network validation
2. **All Programs**: ALL 6 programs MUST be deployed and registered
3. **ParameterStorage Init**: Default parameters MUST be set on devnet
4. **Event Sync**: Event listener MUST be running and syncing devnet events
5. **Database Consistency**: Database state MUST match on-chain state at all times
6. **Activity Points**: ALL user actions MUST award activity points correctly
7. **Performance Targets**: Database <100ms, transaction success >99%
8. **All Stories Validated**: ALL Epic 1 acceptance criteria MUST pass
9. **Documentation**: Devnet program IDs and deployment info MUST be documented
10. **Clean State**: Tests MUST be repeatable (proper cleanup between runs)

### Project Structure Notes

**E2E Test Flow:**
```typescript
describe('Epic 1: End-to-End Integration Test', () => {
  it('completes full market lifecycle on devnet', async () => {
    // 1. Create proposal for new market
    const proposal = await createProposal(creator, marketParams);

    // 2. Deposit bond
    await depositBond(creator, marketId, BondTier.TIER2);

    // 3. Create market (proposal approved)
    const market = await createMarket(marketParams);

    // 4. Place bets from multiple users
    await placeBet(bettor1, market.id, BetSide.YES, 100);
    await placeBet(bettor2, market.id, BetSide.NO, 100);

    // 5. Advance to voting period
    await advanceTime(market.voting_period_start);

    // 6. Submit resolution votes
    await submitVote(voter1, market.id, Outcome.YES);
    await submitVote(voter2, market.id, Outcome.YES);

    // 7. Aggregate votes and finalize
    await aggregateVotes(market.id);

    // 8. Winners claim payouts
    await claimPayout(bettor1, market.id);

    // 9. Creator claims fees
    await claimCreatorFees(creator, market.id);

    // 10. Refund bond
    await refundBond(creator, market.id);

    // Assertions
    expect(market.status).toBe(MarketStatus.RESOLVED);
    expect(bettor1.balance).toBeGreaterThan(initialBalance);

    // Database consistency check
    const dbMarket = await queryMarket(market.id);
    expect(dbMarket.status).toBe(market.status);

    // Activity points check
    const creatorPoints = await getActivityPoints(creator.publicKey);
    expect(creatorPoints.total_points).toBeGreaterThan(0);
  });
});
```

**Devnet Deployment Script:**
```bash
#!/bin/bash
# Deploy all programs to devnet

# Set cluster to devnet
solana config set --url https://api.devnet.solana.com

# Deploy programs
anchor deploy --provider.cluster devnet

# Register program IDs
node scripts/register-programs-devnet.ts

# Initialize ParameterStorage
node scripts/init-parameters-devnet.ts

# Verify deployment
node scripts/verify-devnet-deployment.ts
```

**Performance Benchmarks:**
```
Target Performance Metrics:
- Database queries: <100ms (p95)
- Transaction success rate: >99%
- Event sync delay: <5s
- Market creation: <2s
- Bet placement: <1s
- Vote submission: <1s
- Payout claim: <1.5s
```

### References

- [Source: docs/epics.md#Epic 1 Story 1.12] - Story definition and acceptance criteria
- [Source: docs/architecture.md#Deployment Architecture] - Devnet deployment strategy
- [Source: All Epic 1 STORY-*-COMPLETE.md files] - Individual story implementations
- [Source: docs/STORY-1.9-COMPLETE.md] - Event Listener pattern

## Dev Agent Record

### Context Reference

- [Story Context 1.12](story-context-1.12.xml) - Generated: 2025-10-26

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

### File List
