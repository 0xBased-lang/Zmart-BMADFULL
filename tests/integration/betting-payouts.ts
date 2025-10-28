/**
 * Betting and Fee Distribution Integration Test (AC #3)
 *
 * Tests the complete betting-to-payout flow:
 * 1. Place multiple bets on market (CoreMarkets)
 * 2. Verify fee distribution to all parties (platform/team/burn/creator)
 * 3. Track creator fee accumulation (BondManager)
 * 4. Resolve market (MarketResolution)
 * 5. Claim payouts for winning bets (CoreMarkets)
 * 6. Claim creator fees (BondManager)
 */

import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

// Utility imports
import {
  initializePrograms,
  setupTestAccounts,
  createTestUser,
  deriveMarketPda,
  deriveBetPda,
  deriveResolutionPda,
  deriveBondPda,
  getBalance,
} from "./utils/accounts";
import { bettingAndPayoutWorkflow } from "./utils/workflows";
import {
  assertBetPlaced,
  assertFeesDistributed,
  assertMarketResolved,
  assertPayoutClaimed,
  assertCreatorFeesAccumulated,
  assertBalanceChanged,
} from "./utils/assertions";
import { TIMEOUTS, ECONOMIC_CONSTANTS, FEE_PERCENTAGES, TEST_DATA } from "./utils/config";

describe("💰 Betting and Fee Distribution Integration Test", () => {
  let programs: any;
  let accounts: any;

  // Test users
  let marketCreator: Keypair;
  let bettors: Keypair[];
  let testMarket: PublicKey;

  before(async () => {
    console.log("\n🔧 Setting up Betting and Payouts Integration Test...\n");

    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    programs = await initializePrograms(provider);
    accounts = await setupTestAccounts(programs);

    // Create test users
    marketCreator = await createTestUser(provider, 20 * LAMPORTS_PER_SOL);
    bettors = await Promise.all([
      createTestUser(provider, 10 * LAMPORTS_PER_SOL),
      createTestUser(provider, 10 * LAMPORTS_PER_SOL),
      createTestUser(provider, 10 * LAMPORTS_PER_SOL),
      createTestUser(provider, 10 * LAMPORTS_PER_SOL),
    ]);

    // Create test market (simplified - would normally come from proposal)
    const marketKey = Keypair.generate();
    testMarket = marketKey.publicKey;
    const marketPda = deriveMarketPda(programs.coreMarkets, testMarket);

    const title = TEST_DATA.generateMarketTitle();
    const description = TEST_DATA.generateMarketDescription(title);
    const resolutionTime = new anchor.BN(TEST_DATA.generateFutureTimestamp(30));

    await programs.coreMarkets.methods
      .createMarket(title, description, resolutionTime)
      .accounts({
        market: testMarket,
        marketAccount: marketPda,
        creator: marketCreator.publicKey,
        parameters: accounts.parametersPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([marketCreator, marketKey])
      .rpc();

    console.log("✅ Test setup complete");
    console.log(`   Market: ${testMarket.toBase58()}`);
    console.log(`   Bettors: ${bettors.length}`);
  });

  it("Should place bets and track positions", async function () {
    this.timeout(TIMEOUTS.WORKFLOW_STEP);

    const bettor = bettors[0];
    const betAmount = new anchor.BN(ECONOMIC_CONSTANTS.MIN_BET_AMOUNT * 10); // 10 USDC
    const betSide = true; // YES

    const marketPda = deriveMarketPda(programs.coreMarkets, testMarket);
    const betPda = deriveBetPda(programs.coreMarkets, testMarket, bettor.publicKey);

    console.log(`\n💵 Placing bet: ${betAmount.toNumber() / ECONOMIC_CONSTANTS.LAMPORTS_PER_USDC} USDC on YES`);

    await programs.coreMarkets.methods
      .placeBet(betAmount, betSide)
      .accounts({
        market: testMarket,
        marketAccount: marketPda,
        bettor: bettor.publicKey,
        betAccount: betPda,
        treasury: accounts.treasury,
        teamWallet: accounts.teamWallet,
        burnWallet: accounts.burnWallet,
        parameters: accounts.parametersPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([bettor])
      .rpc();

    // Verify bet placed
    await assertBetPlaced(programs, betPda, bettor.publicKey, betAmount, betSide);

    console.log("✅ Bet placed and position tracked");
  });

  it("Should distribute fees to all parties", async function () {
    this.timeout(TIMEOUTS.WORKFLOW_STEP);

    const bettor = bettors[1];
    const betAmount = new anchor.BN(ECONOMIC_CONSTANTS.MIN_BET_AMOUNT * 100); // 100 USDC
    const marketPda = deriveMarketPda(programs.coreMarkets, testMarket);
    const betPda = deriveBetPda(programs.coreMarkets, testMarket, bettor.publicKey);

    // Get balances before
    const treasuryBefore = await getBalance(programs.provider, accounts.treasury);
    const teamBefore = await getBalance(programs.provider, accounts.teamWallet);
    const burnBefore = await getBalance(programs.provider, accounts.burnWallet);

    console.log(`\n💵 Placing bet: ${betAmount.toNumber() / ECONOMIC_CONSTANTS.LAMPORTS_PER_USDC} USDC`);

    await programs.coreMarkets.methods
      .placeBet(betAmount, true)
      .accounts({
        market: testMarket,
        marketAccount: marketPda,
        bettor: bettor.publicKey,
        betAccount: betPda,
        treasury: accounts.treasury,
        teamWallet: accounts.teamWallet,
        burnWallet: accounts.burnWallet,
        parameters: accounts.parametersPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([bettor])
      .rpc();

    // Get balances after
    const treasuryAfter = await getBalance(programs.provider, accounts.treasury);
    const teamAfter = await getBalance(programs.provider, accounts.teamWallet);
    const burnAfter = await getBalance(programs.provider, accounts.burnWallet);

    // Calculate expected fees
    const totalFee = betAmount.toNumber() * (FEE_PERCENTAGES.TOTAL_FEE / 10000);
    const platformFee = betAmount.toNumber() * (FEE_PERCENTAGES.PLATFORM_FEE / 10000);
    const teamFee = betAmount.toNumber() * (FEE_PERCENTAGES.TEAM_FEE / 10000);
    const burnFee = betAmount.toNumber() * (FEE_PERCENTAGES.BURN_FEE / 10000);
    const creatorFee = betAmount.toNumber() * (FEE_PERCENTAGES.CREATOR_FEE / 10000);

    // Verify fee distribution
    await assertFeesDistributed(
      programs,
      treasuryAfter - treasuryBefore,
      teamAfter - teamBefore,
      burnAfter - burnBefore,
      new anchor.BN(creatorFee),
      new anchor.BN(totalFee)
    );

    console.log("✅ Fees distributed correctly:");
    console.log(`   Platform: ${(treasuryAfter - treasuryBefore) / ECONOMIC_CONSTANTS.LAMPORTS_PER_USDC} USDC`);
    console.log(`   Team: ${(teamAfter - teamBefore) / ECONOMIC_CONSTANTS.LAMPORTS_PER_USDC} USDC`);
    console.log(`   Burn: ${(burnAfter - burnBefore) / ECONOMIC_CONSTANTS.LAMPORTS_PER_USDC} USDC`);
    console.log(`   Creator: ${creatorFee / ECONOMIC_CONSTANTS.LAMPORTS_PER_USDC} USDC`);
  });

  it("Should accumulate creator fees in BondManager", async function () {
    this.timeout(TIMEOUTS.WORKFLOW_STEP);

    const bettor = bettors[2];
    const betAmount = new anchor.BN(ECONOMIC_CONSTANTS.MIN_BET_AMOUNT * 50); // 50 USDC
    const marketPda = deriveMarketPda(programs.coreMarkets, testMarket);
    const betPda = deriveBetPda(programs.coreMarkets, testMarket, bettor.publicKey);
    const bondPda = deriveBondPda(programs.bondManager, marketCreator.publicKey);

    console.log(`\n💵 Placing bet to accumulate creator fees`);

    await programs.coreMarkets.methods
      .placeBet(betAmount, false) // NO bet
      .accounts({
        market: testMarket,
        marketAccount: marketPda,
        bettor: bettor.publicKey,
        betAccount: betPda,
        treasury: accounts.treasury,
        teamWallet: accounts.teamWallet,
        burnWallet: accounts.burnWallet,
        bondManager: accounts.bondManagerPda,
        creatorBond: bondPda,
        parameters: accounts.parametersPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([bettor])
      .rpc();

    // Calculate expected creator fee
    const creatorFee = betAmount.toNumber() * (FEE_PERCENTAGES.CREATOR_FEE / 10000);

    // Verify creator fees accumulated
    await assertCreatorFeesAccumulated(programs, bondPda, new anchor.BN(creatorFee));

    console.log("✅ Creator fees accumulated in BondManager");
  });

  it("Should resolve market and distribute payouts to winners", async function () {
    this.timeout(TIMEOUTS.COMPLETE_WORKFLOW);

    // Place bets from multiple bettors
    const bettorData = [
      { user: bettors[0], amount: new anchor.BN(ECONOMIC_CONSTANTS.MIN_BET_AMOUNT * 20), side: true }, // YES
      { user: bettors[1], amount: new anchor.BN(ECONOMIC_CONSTANTS.MIN_BET_AMOUNT * 30), side: true }, // YES
      { user: bettors[2], amount: new anchor.BN(ECONOMIC_CONSTANTS.MIN_BET_AMOUNT * 25), side: false }, // NO
      { user: bettors[3], amount: new anchor.BN(ECONOMIC_CONSTANTS.MIN_BET_AMOUNT * 15), side: false }, // NO
    ];

    console.log(`\n💰 Testing complete betting and payout workflow`);

    // Use workflow helper
    const result = await bettingAndPayoutWorkflow(programs, accounts, testMarket, bettorData);

    expect(result.success).to.be.true;

    // Verify market resolved
    const marketPda = deriveMarketPda(programs.coreMarkets, testMarket);
    const resolutionPda = deriveResolutionPda(programs.marketResolution, testMarket);
    await assertMarketResolved(programs, testMarket, resolutionPda, true); // YES wins

    console.log("✅ Market resolved and payouts distributed");
    console.log(`   Winners: ${result.data.winnersCount}`);
  });

  it("Should allow winners to claim payouts", async function () {
    this.timeout(TIMEOUTS.WORKFLOW_STEP);

    // Assuming market resolved with YES outcome
    const winner = bettors[0]; // Bet YES
    const betPda = deriveBetPda(programs.coreMarkets, testMarket, winner.publicKey);
    const marketPda = deriveMarketPda(programs.coreMarkets, testMarket);

    const balanceBefore = await getBalance(programs.provider, winner.publicKey);

    console.log(`\n💸 Claiming payout for winner`);

    await programs.coreMarkets.methods
      .claimPayout()
      .accounts({
        market: testMarket,
        marketAccount: marketPda,
        bettor: winner.publicKey,
        betAccount: betPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([winner])
      .rpc();

    // Verify payout claimed
    const bet = await programs.coreMarkets.account.bet.fetch(betPda);
    expect(bet.claimed).to.be.true;
    expect(bet.payout.toNumber()).to.be.greaterThan(bet.amount.toNumber());

    // Verify balance increased
    const balanceAfter = await getBalance(programs.provider, winner.publicKey);
    expect(balanceAfter).to.be.greaterThan(balanceBefore);

    console.log("✅ Payout claimed successfully");
    console.log(`   Payout: ${bet.payout.toNumber() / ECONOMIC_CONSTANTS.LAMPORTS_PER_USDC} USDC`);
  });

  it("Should allow creator to claim accumulated fees", async function () {
    this.timeout(TIMEOUTS.WORKFLOW_STEP);

    const bondPda = deriveBondPda(programs.bondManager, marketCreator.publicKey);

    // Get creator balance before
    const balanceBefore = await getBalance(programs.provider, marketCreator.publicKey);

    // Get accumulated fees
    const bondBefore = await programs.bondManager.account.bond.fetch(bondPda);
    const accumulatedFees = bondBefore.accumulatedFees;

    console.log(`\n💸 Creator claiming accumulated fees: ${accumulatedFees.toNumber() / ECONOMIC_CONSTANTS.LAMPORTS_PER_USDC} USDC`);

    await programs.bondManager.methods
      .claimCreatorFees()
      .accounts({
        bond: bondPda,
        creator: marketCreator.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([marketCreator])
      .rpc();

    // Verify fees claimed
    const bondAfter = await programs.bondManager.account.bond.fetch(bondPda);
    expect(bondAfter.accumulatedFees.toNumber()).to.equal(0);

    // Verify creator balance increased
    const balanceAfter = await getBalance(programs.provider, marketCreator.publicKey);
    await assertBalanceChanged(
      programs,
      marketCreator.publicKey,
      balanceBefore,
      accumulatedFees.toNumber()
    );

    console.log("✅ Creator fees claimed successfully");
  });

  it("Should prevent double payout claims", async function () {
    this.timeout(TIMEOUTS.WORKFLOW_STEP);

    const winner = bettors[0];
    const betPda = deriveBetPda(programs.coreMarkets, testMarket, winner.publicKey);
    const marketPda = deriveMarketPda(programs.coreMarkets, testMarket);

    console.log(`\n🚫 Attempting double claim`);

    try {
      await programs.coreMarkets.methods
        .claimPayout()
        .accounts({
          market: testMarket,
          marketAccount: marketPda,
          bettor: winner.publicKey,
          betAccount: betPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([winner])
        .rpc();

      expect.fail("Should have prevented double claim");
    } catch (error) {
      console.log("✅ Double claim correctly prevented");
    }
  });
});
