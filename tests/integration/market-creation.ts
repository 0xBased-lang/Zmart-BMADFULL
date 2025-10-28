/**
 * Market Creation Workflow Integration Test (AC #2)
 *
 * Tests the complete proposal-to-market creation flow:
 * 1. Create proposal with bond deposit (ProposalSystem + BondManager)
 * 2. Submit votes and aggregate (ProposalSystem)
 * 3. Approve proposal and create market (ProposalSystem → CoreMarkets)
 * 4. Verify market created with correct parameters
 * 5. Verify bond refunded to creator (BondManager)
 */

import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

// Utility imports
import {
  initializePrograms,
  setupTestAccounts,
  createTestUser,
  deriveProposalPda,
  deriveMarketPda,
  deriveBondPda,
} from "./utils/accounts";
import { proposalToMarketWorkflow } from "./utils/workflows";
import {
  assertMarketCreatedFromProposal,
  assertBondDeposited,
  assertBondRefunded,
  assertProposalApproved,
} from "./utils/assertions";
import { TIMEOUTS, ECONOMIC_CONSTANTS, GOVERNANCE, TEST_DATA } from "./utils/config";

describe("🏗️  Market Creation Workflow Integration Test", () => {
  // Program instances
  let programs: any;
  let accounts: any;

  // Test users
  let proposalCreator: Keypair;
  let voters: Keypair[];

  before(async () => {
    console.log("\n🔧 Setting up Market Creation Integration Test...\n");

    // Initialize programs
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    programs = await initializePrograms(provider);
    accounts = await setupTestAccounts(programs);

    // Create test users
    proposalCreator = await createTestUser(provider, 20 * LAMPORTS_PER_SOL);
    voters = await Promise.all([
      createTestUser(provider, 5 * LAMPORTS_PER_SOL),
      createTestUser(provider, 5 * LAMPORTS_PER_SOL),
      createTestUser(provider, 5 * LAMPORTS_PER_SOL),
      createTestUser(provider, 5 * LAMPORTS_PER_SOL),
      createTestUser(provider, 5 * LAMPORTS_PER_SOL),
    ]);

    console.log("✅ Test setup complete");
    console.log(`   Proposal Creator: ${proposalCreator.publicKey.toBase58()}`);
    console.log(`   Voters: ${voters.length}`);
  });

  it("Should create proposal with bond deposit", async function () {
    this.timeout(TIMEOUTS.WORKFLOW_STEP);

    const proposalId = Math.floor(Math.random() * 1000000);
    const proposalPda = deriveProposalPda(programs.proposalSystem, proposalId);
    const bondPda = deriveBondPda(programs.bondManager, proposalCreator.publicKey);

    // Generate test data
    const title = TEST_DATA.generateMarketTitle();
    const description = TEST_DATA.generateMarketDescription(title);
    const resolutionTime = new anchor.BN(TEST_DATA.generateFutureTimestamp(365));

    console.log(`\n📝 Creating proposal: ${title}`);

    // Create proposal with bond
    await programs.proposalSystem.methods
      .createProposal(proposalId, title, description, resolutionTime)
      .accounts({
        proposal: proposalPda,
        creator: proposalCreator.publicKey,
        bondManager: accounts.bondManagerPda,
        bondAccount: bondPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([proposalCreator])
      .rpc();

    // Verify proposal created
    const proposal = await programs.proposalSystem.account.proposal.fetch(proposalPda);
    expect(proposal.proposalId).to.equal(proposalId);
    expect(proposal.title).to.equal(title);
    expect(proposal.creator.toString()).to.equal(proposalCreator.publicKey.toString());

    // Verify bond deposited
    await assertBondDeposited(
      programs,
      bondPda,
      proposalCreator.publicKey,
      new anchor.BN(ECONOMIC_CONSTANTS.PROPOSAL_BOND_AMOUNT)
    );

    console.log("✅ Proposal created with bond deposit");
  });

  it("Should submit votes and aggregate", async function () {
    this.timeout(TIMEOUTS.WORKFLOW_STEP);

    const proposalId = Math.floor(Math.random() * 1000000);
    const proposalPda = deriveProposalPda(programs.proposalSystem, proposalId);
    const bondPda = deriveBondPda(programs.bondManager, proposalCreator.publicKey);

    // Create proposal first
    const title = TEST_DATA.generateMarketTitle();
    const description = TEST_DATA.generateMarketDescription(title);
    const resolutionTime = new anchor.BN(TEST_DATA.generateFutureTimestamp(365));

    await programs.proposalSystem.methods
      .createProposal(proposalId, title, description, resolutionTime)
      .accounts({
        proposal: proposalPda,
        creator: proposalCreator.publicKey,
        bondManager: accounts.bondManagerPda,
        bondAccount: bondPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([proposalCreator])
      .rpc();

    // Submit votes (60% YES, 40% NO for approval)
    const yesVotes = Math.ceil(voters.length * (GOVERNANCE.PROPOSAL_APPROVAL_THRESHOLD / 100));
    console.log(`\n🗳️  Submitting ${yesVotes} YES votes and ${voters.length - yesVotes} NO votes`);

    for (let i = 0; i < voters.length; i++) {
      const voter = voters[i];
      const vote = i < yesVotes; // First 60% vote YES

      await programs.proposalSystem.methods
        .submitVote(proposalId, vote)
        .accounts({
          proposal: proposalPda,
          voter: voter.publicKey,
        })
        .signers([voter])
        .rpc();
    }

    // Aggregate votes
    await programs.proposalSystem.methods
      .aggregateVotes(proposalId)
      .accounts({
        proposal: proposalPda,
      })
      .rpc();

    // Verify proposal approved
    await assertProposalApproved(programs, proposalPda);

    console.log("✅ Votes submitted and proposal approved");
  });

  it("Should create market from approved proposal", async function () {
    this.timeout(TIMEOUTS.COMPLETE_WORKFLOW);

    // Use workflow helper for complete flow
    const title = TEST_DATA.generateMarketTitle();
    const description = TEST_DATA.generateMarketDescription(title);
    const resolutionTime = new anchor.BN(TEST_DATA.generateFutureTimestamp(365));

    console.log(`\n🏗️  Creating market from proposal: ${title}`);

    const { marketKey, result } = await proposalToMarketWorkflow(
      programs,
      accounts,
      proposalCreator,
      voters,
      { title, description, resolutionTime }
    );

    expect(result.success).to.be.true;
    expect(marketKey).to.not.be.null;

    if (marketKey) {
      // Verify market created correctly
      await assertMarketCreatedFromProposal(programs, marketKey, title, description);

      // Verify market state
      const market = await programs.coreMarkets.account.market.fetch(marketKey);
      expect(market.creator.toString()).to.equal(proposalCreator.publicKey.toString());
      expect(market.resolved).to.be.false;
      expect(market.totalYesBets.toNumber()).to.equal(0);
      expect(market.totalNoBets.toNumber()).to.equal(0);

      console.log("✅ Market created successfully");
      console.log(`   Market ID: ${marketKey.toBase58()}`);
      console.log(`   Title: ${title}`);
    }
  });

  it("Should refund bond to creator after market creation", async function () {
    this.timeout(TIMEOUTS.COMPLETE_WORKFLOW);

    // Create proposal and market
    const title = TEST_DATA.generateMarketTitle();
    const description = TEST_DATA.generateMarketDescription(title);
    const resolutionTime = new anchor.BN(TEST_DATA.generateFutureTimestamp(365));

    const { marketKey, result } = await proposalToMarketWorkflow(
      programs,
      accounts,
      proposalCreator,
      voters,
      { title, description, resolutionTime }
    );

    expect(result.success).to.be.true;
    expect(marketKey).to.not.be.null;

    // Verify bond refunded
    const bondPda = deriveBondPda(programs.bondManager, proposalCreator.publicKey);
    await assertBondRefunded(programs, bondPda);

    console.log("✅ Bond refunded to creator");
  });

  it("Should handle rejected proposals (< 60% approval)", async function () {
    this.timeout(TIMEOUTS.COMPLETE_WORKFLOW);

    const proposalId = Math.floor(Math.random() * 1000000);
    const proposalPda = deriveProposalPda(programs.proposalSystem, proposalId);
    const bondPda = deriveBondPda(programs.bondManager, proposalCreator.publicKey);

    // Create proposal
    const title = TEST_DATA.generateMarketTitle();
    const description = TEST_DATA.generateMarketDescription(title);
    const resolutionTime = new anchor.BN(TEST_DATA.generateFutureTimestamp(365));

    await programs.proposalSystem.methods
      .createProposal(proposalId, title, description, resolutionTime)
      .accounts({
        proposal: proposalPda,
        creator: proposalCreator.publicKey,
        bondManager: accounts.bondManagerPda,
        bondAccount: bondPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([proposalCreator])
      .rpc();

    // Submit votes (only 40% YES - should reject)
    const yesVotes = Math.floor(voters.length * 0.4);
    console.log(`\n🗳️  Submitting ${yesVotes} YES votes (below 60% threshold)`);

    for (let i = 0; i < voters.length; i++) {
      const voter = voters[i];
      const vote = i < yesVotes;

      await programs.proposalSystem.methods
        .submitVote(proposalId, vote)
        .accounts({
          proposal: proposalPda,
          voter: voter.publicKey,
        })
        .signers([voter])
        .rpc();
    }

    // Aggregate votes
    await programs.proposalSystem.methods
      .aggregateVotes(proposalId)
      .accounts({
        proposal: proposalPda,
      })
      .rpc();

    // Verify proposal NOT approved
    const proposal = await programs.proposalSystem.account.proposal.fetch(proposalPda);
    expect(proposal.approved).to.be.false;
    expect(proposal.votesYes.toNumber()).to.be.lessThan(proposal.votesNo.toNumber());

    console.log("✅ Proposal correctly rejected (< 60% approval)");
  });

  it("Should prevent market creation from rejected proposal", async function () {
    this.timeout(TIMEOUTS.WORKFLOW_STEP);

    const proposalId = Math.floor(Math.random() * 1000000);
    const proposalPda = deriveProposalPda(programs.proposalSystem, proposalId);
    const bondPda = deriveBondPda(programs.bondManager, proposalCreator.publicKey);

    // Create rejected proposal (same as previous test)
    const title = TEST_DATA.generateMarketTitle();
    const description = TEST_DATA.generateMarketDescription(title);
    const resolutionTime = new anchor.BN(TEST_DATA.generateFutureTimestamp(365));

    await programs.proposalSystem.methods
      .createProposal(proposalId, title, description, resolutionTime)
      .accounts({
        proposal: proposalPda,
        creator: proposalCreator.publicKey,
        bondManager: accounts.bondManagerPda,
        bondAccount: bondPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([proposalCreator])
      .rpc();

    // Submit insufficient YES votes
    for (let i = 0; i < voters.length; i++) {
      await programs.proposalSystem.methods
        .submitVote(proposalId, false) // All NO votes
        .accounts({
          proposal: proposalPda,
          voter: voters[i].publicKey,
        })
        .signers([voters[i]])
        .rpc();
    }

    await programs.proposalSystem.methods.aggregateVotes(proposalId).accounts({ proposal: proposalPda }).rpc();

    // Attempt to create market (should fail)
    const marketKey = Keypair.generate();
    const marketPda = deriveMarketPda(programs.coreMarkets, marketKey.publicKey);

    try {
      await programs.proposalSystem.methods
        .createMarketFromProposal(proposalId)
        .accounts({
          proposal: proposalPda,
          market: marketKey.publicKey,
          marketAccount: marketPda,
          coreMarkets: programs.coreMarkets.programId,
          creator: proposalCreator.publicKey,
          bondAccount: bondPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([proposalCreator, marketKey])
        .rpc();

      // Should not reach here
      expect.fail("Market creation should have failed for rejected proposal");
    } catch (error) {
      // Expected error
      console.log("✅ Market creation correctly prevented for rejected proposal");
    }
  });
});
