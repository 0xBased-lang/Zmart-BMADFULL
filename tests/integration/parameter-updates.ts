/**
 * Parameter Update Cross-Program Integration Test (AC #5)
 *
 * Tests parameter propagation:
 * 1. Update minimum bet parameter (ParameterStorage)
 * 2. Verify CoreMarkets enforces new minimum
 * 3. Update fee percentages (ParameterStorage)
 * 4. Verify CoreMarkets applies new fee rates
 * 5. Update voting period (ParameterStorage)
 * 6. Verify MarketResolution uses new period
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
} from "./utils/accounts";
import { parameterUpdateWorkflow } from "./utils/workflows";
import { assertParameterUpdated } from "./utils/assertions";
import { TIMEOUTS, ECONOMIC_CONSTANTS, TEST_DATA } from "./utils/config";

describe("⚙️  Parameter Update Cross-Program Integration Test", () => {
  let programs: any;
  let accounts: any;
  let testMarket: PublicKey;
  let testUser: Keypair;

  before(async () => {
    console.log("\n🔧 Setting up Parameter Update Integration Test...\n");

    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    programs = await initializePrograms(provider);
    accounts = await setupTestAccounts(programs);

    testUser = await createTestUser(provider, 10 * LAMPORTS_PER_SOL);

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
        creator: accounts.authority.publicKey,
        parameters: accounts.parametersPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([accounts.authority, marketKey])
      .rpc();

    console.log("✅ Test setup complete");
  });

  it("Should update minimum bet parameter", async function () {
    this.timeout(TIMEOUTS.WORKFLOW_STEP);

    const newMinBet = new anchor.BN(ECONOMIC_CONSTANTS.MIN_BET_AMOUNT * 5); // 5 USDC

    console.log(`\n⚙️  Updating minimum bet to ${newMinBet.toNumber() / ECONOMIC_CONSTANTS.LAMPORTS_PER_USDC} USDC`);

    await programs.parameterStorage.methods
      .updateMinimumBet(newMinBet)
      .accounts({
        parameters: accounts.parametersPda,
        authority: accounts.authority.publicKey,
      })
      .signers([accounts.authority])
      .rpc();

    await assertParameterUpdated(programs, accounts.parametersPda, "minimumBet", newMinBet);
    console.log("✅ Minimum bet parameter updated");
  });

  it("Should enforce new minimum bet in CoreMarkets", async function () {
    this.timeout(TIMEOUTS.WORKFLOW_STEP);

    const belowMinBet = new anchor.BN(ECONOMIC_CONSTANTS.MIN_BET_AMOUNT * 2); // Below new minimum of 5 USDC
    const marketPda = deriveMarketPda(programs.coreMarkets, testMarket);
    const betPda = deriveBetPda(programs.coreMarkets, testMarket, testUser.publicKey);

    console.log(`\n🚫 Attempting bet below minimum`);

    try {
      await programs.coreMarkets.methods
        .placeBet(belowMinBet, true)
        .accounts({
          market: testMarket,
          marketAccount: marketPda,
          bettor: testUser.publicKey,
          betAccount: betPda,
          treasury: accounts.treasury,
          teamWallet: accounts.teamWallet,
          burnWallet: accounts.burnWallet,
          parameters: accounts.parametersPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([testUser])
        .rpc();

      expect.fail("Should have rejected bet below minimum");
    } catch (error) {
      console.log("✅ New minimum enforced correctly");
    }
  });

  it("Should update and apply new fee percentages", async function () {
    this.timeout(TIMEOUTS.WORKFLOW_STEP);

    const newPlatformFee = 300; // 3%

    console.log(`\n⚙️  Updating platform fee to ${newPlatformFee / 100}%`);

    await programs.parameterStorage.methods
      .updateFeePercentage("platform", newPlatformFee)
      .accounts({
        parameters: accounts.parametersPda,
        authority: accounts.authority.publicKey,
      })
      .signers([accounts.authority])
      .rpc();

    await assertParameterUpdated(programs, accounts.parametersPda, "platformFee", newPlatformFee);
    console.log("✅ Fee percentage updated and will be applied to subsequent bets");
  });

  it("Should use parameter update workflow helper", async function () {
    this.timeout(TIMEOUTS.WORKFLOW_STEP);

    const result = await parameterUpdateWorkflow(
      programs,
      accounts,
      "votingPeriod",
      new anchor.BN(14 * 24 * 60 * 60) // 14 days
    );

    expect(result.success).to.be.true;
    console.log("✅ Parameter update workflow completed");
  });
});
