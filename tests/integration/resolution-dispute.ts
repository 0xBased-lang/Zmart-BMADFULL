/**
 * Resolution and Dispute Workflow Integration Test (AC #4)
 *
 * Tests complete resolution flow with dispute and admin override:
 * 1. Place bets on market
 * 2. Submit votes for resolution
 * 3. Aggregate votes and post result
 * 4. Enter dispute window
 * 5. Admin override resolution
 * 6. Claim payouts based on final outcome
 */

import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  initializePrograms,
  setupTestAccounts,
  createTestUser,
  deriveMarketPda,
  deriveBetPda,
  deriveResolutionPda,
} from "./utils/accounts";
import { resolutionAndDisputeWorkflow } from "./utils/workflows";
import {
  assertMarketResolved,
  assertVotesAggregated,
  assertAdminOverride,
  assertPayoutClaimed,
} from "./utils/assertions";
import { TIMEOUTS, ECONOMIC_CONSTANTS, GOVERNANCE, TEST_DATA } from "./utils/config";

describe("⚖️  Resolution and Dispute Workflow Integration Test", () => {
  let programs: any;
  let accounts: any;
  let testMarket: PublicKey;
  let voters: Keypair[];
  let bettors: Keypair[];
  let admin: Keypair;

  before(async () => {
    console.log("\n🔧 Setting up Resolution and Dispute Integration Test...\n");

    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    programs = await initializePrograms(provider);
    accounts = await setupTestAccounts(programs);

    admin = accounts.authority;
    voters = await Promise.all(Array(5).fill(0).map(() => createTestUser(provider, 5 * LAMPORTS_PER_SOL)));
    bettors = await Promise.all(Array(3).fill(0).map(() => createTestUser(provider, 10 * LAMPORTS_PER_SOL)));

    // Create test market
    const marketKey = Keypair.generate();
    testMarket = marketKey.publicKey;
    const marketPda = deriveMarketPda(programs.coreMarkets, testMarket);

    await programs.coreMarkets.methods
      .createMarket(
        TEST_DATA.generateMarketTitle(),
        TEST_DATA.generateMarketDescription("test"),
        new anchor.BN(TEST_DATA.generateFutureTimestamp(30))
      )
      .accounts({
        market: testMarket,
        marketAccount: marketPda,
        creator: admin.publicKey,
        parameters: accounts.parametersPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin, marketKey])
      .rpc();

    console.log("✅ Test setup complete");
  });

  it("Should submit and aggregate resolution votes", async function () {
    this.timeout(TIMEOUTS.WORKFLOW_STEP);

    const resolutionPda = deriveResolutionPda(programs.marketResolution, testMarket);
    const yesVotes = 4; // 4 out of 5 vote YES

    console.log(`\n🗳️  Submitting ${yesVotes} YES votes for resolution`);

    for (let i = 0; i < voters.length; i++) {
      await programs.marketResolution.methods
        .submitVote(i < yesVotes)
        .accounts({
          market: testMarket,
          resolution: resolutionPda,
          voter: voters[i].publicKey,
        })
        .signers([voters[i]])
        .rpc();
    }

    await programs.marketResolution.methods
      .aggregateVotes()
      .accounts({ market: testMarket, resolution: resolutionPda })
      .rpc();

    await assertVotesAggregated(programs, resolutionPda, yesVotes, voters.length - yesVotes);
    console.log("✅ Resolution votes aggregated");
  });

  it("Should execute admin override during dispute window", async function () {
    this.timeout(TIMEOUTS.WORKFLOW_STEP);

    const resolutionPda = deriveResolutionPda(programs.marketResolution, testMarket);
    const marketPda = deriveMarketPda(programs.coreMarkets, testMarket);

    console.log(`\n⚖️  Admin overriding resolution to NO`);

    await programs.marketResolution.methods
      .adminOverride(false) // Override to NO
      .accounts({
        market: testMarket,
        resolution: resolutionPda,
        admin: admin.publicKey,
        marketAccount: marketPda,
      })
      .signers([admin])
      .rpc();

    await assertAdminOverride(programs, resolutionPda, false);
    console.log("✅ Admin override executed");
  });

  it("Should complete resolution and dispute workflow", async function () {
    this.timeout(TIMEOUTS.COMPLETE_WORKFLOW);

    const result = await resolutionAndDisputeWorkflow(programs, accounts, testMarket, voters, admin);

    expect(result.success).to.be.true;
    expect(result.data.finalOutcome).to.equal(false); // Override to NO

    console.log("✅ Complete workflow executed with admin override");
  });

  it("Should distribute payouts based on final overridden outcome", async function () {
    this.timeout(TIMEOUTS.WORKFLOW_STEP);

    // Place bets: bettor[0] on YES, bettor[1] on NO
    const marketPda = deriveMarketPda(programs.coreMarkets, testMarket);

    for (let i = 0; i < 2; i++) {
      const betPda = deriveBetPda(programs.coreMarkets, testMarket, bettors[i].publicKey);
      await programs.coreMarkets.methods
        .placeBet(new anchor.BN(ECONOMIC_CONSTANTS.MIN_BET_AMOUNT * 10), i === 1) // bettor[1] bets NO
        .accounts({
          market: testMarket,
          marketAccount: marketPda,
          bettor: bettors[i].publicKey,
          betAccount: betPda,
          treasury: accounts.treasury,
          teamWallet: accounts.teamWallet,
          burnWallet: accounts.burnWallet,
          parameters: accounts.parametersPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bettors[i]])
        .rpc();
    }

    // Resolve with final outcome (NO after override)
    const resolutionPda = deriveResolutionPda(programs.marketResolution, testMarket);
    await programs.marketResolution.methods
      .resolveMarket(false)
      .accounts({ market: testMarket, marketAccount: marketPda, resolution: resolutionPda, systemProgram: anchor.web3.SystemProgram.programId })
      .rpc();

    // Winner (bettor[1] who bet NO) claims payout
    const winnerBetPda = deriveBetPda(programs.coreMarkets, testMarket, bettors[1].publicKey);
    await programs.coreMarkets.methods
      .claimPayout()
      .accounts({
        market: testMarket,
        marketAccount: marketPda,
        bettor: bettors[1].publicKey,
        betAccount: winnerBetPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([bettors[1]])
      .rpc();

    await assertPayoutClaimed(programs, winnerBetPda, new anchor.BN(0)); // Payout > 0
    console.log("✅ Payouts distributed based on final outcome");
  });
});
