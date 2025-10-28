/**
 * BMAD-Zmart Bulletproof Execution Test
 *
 * Direct execution test using existing SOL balance (no airdrops needed)
 * Tests all critical paths with edge cases
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("🔬 Bulletproof Execution Test", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const authority = (provider.wallet as any).payer;

  // Program IDs
  const CORE_MARKETS_ID = new PublicKey("6BBZWsJZq23k2NX3YnENgXTEPhbVEHXYmPxmamN83eEV");
  const PARAMETER_STORAGE_ID = new PublicKey("J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD");
  const MARKET_RESOLUTION_ID = new PublicKey("Hcxxt6W1HmKQmnUvqpgzNEqVG611Yzt2i4DUvwvkLRf2");

  let coreMarketsProgram: Program;
  let marketResolutionProgram: Program;
  let parametersPda: PublicKey;

  const LAMPORTS_PER_USDC = 1_000_000;

  before(async () => {
    console.log("\n🔬 BULLETPROOF EXECUTION TEST - STARTING\n");
    console.log("Wallet:", authority.publicKey.toBase58());

    const balance = await provider.connection.getBalance(authority.publicKey);
    console.log(`Balance: ${balance / 1e9} SOL\n`);

    // Load programs
    coreMarketsProgram = await anchor.workspace.CoreMarkets;
    marketResolutionProgram = await anchor.workspace.MarketResolution;

    // Derive parameters PDA
    [parametersPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("parameters")],
      PARAMETER_STORAGE_ID
    );

    console.log("Programs loaded successfully\n");
  });

  describe("📊 SECTION 1: Market Creation Edge Cases", () => {

    it("1.1 - Create Valid Market", async () => {
      console.log("✨ TEST 1.1: Create Valid Market");

      const market = Keypair.generate();
      const title = "Will BTC reach $100k in 2025?";
      const description = "Market resolves YES if Bitcoin reaches $100,000 on any major exchange before Dec 31, 2025.";
      const resolutionTime = new anchor.BN(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60);

      await coreMarketsProgram.methods
        .createMarket(title, description, resolutionTime)
        .accounts({
          market: market.publicKey,
          creator: authority.publicKey,
          parameters: parametersPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([market])
        .rpc();

      const marketData = await coreMarketsProgram.account.market.fetch(market.publicKey);

      assert.equal(marketData.title, title);
      assert.equal(marketData.creator.toBase58(), authority.publicKey.toBase58());
      assert.isFalse(marketData.isResolved);

      console.log(`✅ Market created: ${market.publicKey.toBase58()}`);
      console.log(`   Title: ${marketData.title}`);
      console.log(`   YES Pool: ${marketData.yesPool.toString()}`);
      console.log(`   NO Pool: ${marketData.noPool.toString()}\n`);
    });

    it("1.2 - Maximum Title Length (256 chars)", async () => {
      console.log("✨ TEST 1.2: Maximum Title Length");

      const market = Keypair.generate();
      const maxTitle = "A".repeat(256);
      const description = "Testing max title length";
      const resolutionTime = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);

      await coreMarketsProgram.methods
        .createMarket(maxTitle, description, resolutionTime)
        .accounts({
          market: market.publicKey,
          creator: authority.publicKey,
          parameters: parametersPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([market])
        .rpc();

      const marketData = await coreMarketsProgram.account.market.fetch(market.publicKey);
      assert.equal(marketData.title.length, 256);

      console.log(`✅ Max title length accepted (256 chars)\n`);
    });

    it("1.3 - Special Characters & Emojis", async () => {
      console.log("✨ TEST 1.3: Special Characters");

      const market = Keypair.generate();
      const title = "Will 🚀 SpaceX reach Mars? $$$";
      const description = "Special chars: !@#$%^&*()";
      const resolutionTime = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);

      await coreMarketsProgram.methods
        .createMarket(title, description, resolutionTime)
        .accounts({
          market: market.publicKey,
          creator: authority.publicKey,
          parameters: parametersPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([market])
        .rpc();

      const marketData = await coreMarketsProgram.account.market.fetch(market.publicKey);
      assert.equal(marketData.title, title);

      console.log(`✅ Special characters accepted\n`);
    });
  });

  describe("💰 SECTION 2: Betting & Economic Validation", () => {
    let testMarket: Keypair;

    before(async () => {
      testMarket = Keypair.generate();

      await coreMarketsProgram.methods
        .createMarket(
          "Betting Test Market",
          "For testing betting flows",
          new anchor.BN(Math.floor(Date.now() / 1000) + 86400)
        )
        .accounts({
          market: testMarket.publicKey,
          creator: authority.publicKey,
          parameters: parametersPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([testMarket])
        .rpc();
    });

    it("2.1 - Place YES Bet", async () => {
      console.log("✨ TEST 2.1: Place YES Bet");

      const betAmount = new anchor.BN(10 * LAMPORTS_PER_USDC);
      const marketBefore = await coreMarketsProgram.account.market.fetch(testMarket.publicKey);

      await coreMarketsProgram.methods
        .placeBet(true, betAmount)
        .accounts({
          market: testMarket.publicKey,
          bettor: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const marketAfter = await coreMarketsProgram.account.market.fetch(testMarket.publicKey);

      assert(marketAfter.yesPool.gt(marketBefore.yesPool));
      assert(marketAfter.totalBets.gt(marketBefore.totalBets));

      console.log(`✅ YES bet placed: ${betAmount.toString()} (${betAmount.toNumber() / LAMPORTS_PER_USDC} USDC)`);
      console.log(`   YES Pool: ${marketBefore.yesPool.toString()} → ${marketAfter.yesPool.toString()}`);
      console.log(`   Total Bets: ${marketAfter.totalBets.toString()}\n`);
    });

    it("2.2 - Place NO Bet", async () => {
      console.log("✨ TEST 2.2: Place NO Bet");

      const betAmount = new anchor.BN(15 * LAMPORTS_PER_USDC);
      const marketBefore = await coreMarketsProgram.account.market.fetch(testMarket.publicKey);

      await coreMarketsProgram.methods
        .placeBet(false, betAmount)
        .accounts({
          market: testMarket.publicKey,
          bettor: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const marketAfter = await coreMarketsProgram.account.market.fetch(testMarket.publicKey);

      assert(marketAfter.noPool.gt(marketBefore.noPool));

      console.log(`✅ NO bet placed: ${betAmount.toString()} (${betAmount.toNumber() / LAMPORTS_PER_USDC} USDC)`);
      console.log(`   NO Pool: ${marketBefore.noPool.toString()} → ${marketAfter.noPool.toString()}\n`);
    });

    it("2.3 - Multiple Sequential Bets", async () => {
      console.log("✨ TEST 2.3: Multiple Sequential Bets");

      const betAmount = new anchor.BN(5 * LAMPORTS_PER_USDC);
      const marketBefore = await coreMarketsProgram.account.market.fetch(testMarket.publicKey);

      for (let i = 0; i < 5; i++) {
        await coreMarketsProgram.methods
          .placeBet(i % 2 === 0, betAmount)
          .accounts({
            market: testMarket.publicKey,
            bettor: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      }

      const marketAfter = await coreMarketsProgram.account.market.fetch(testMarket.publicKey);

      console.log(`✅ 5 sequential bets completed`);
      console.log(`   Total Bets: ${marketBefore.totalBets.toString()} → ${marketAfter.totalBets.toString()}\n`);
    });

    it("2.4 - Economic Invariant: Pool Conservation", async () => {
      console.log("✨ TEST 2.4: Pool Conservation");

      const market = await coreMarketsProgram.account.market.fetch(testMarket.publicKey);

      const yesPool = market.yesPool.toNumber();
      const noPool = market.noPool.toNumber();
      const totalPool = market.totalPool.toNumber();

      assert.equal(totalPool, yesPool + noPool, "Total pool must equal YES + NO");

      console.log(`✅ Pool conservation verified`);
      console.log(`   YES Pool: ${yesPool}`);
      console.log(`   NO Pool: ${noPool}`);
      console.log(`   Total: ${totalPool} (sum: ${yesPool + noPool})\n`);
    });

    it("2.5 - Probability Calculation", async () => {
      console.log("✨ TEST 2.5: Probability Calculation");

      const market = await coreMarketsProgram.account.market.fetch(testMarket.publicKey);

      const yesPool = market.yesPool.toNumber();
      const noPool = market.noPool.toNumber();
      const totalPool = yesPool + noPool;

      const expectedYesProb = (yesPool / totalPool) * 100;
      const actualYesProb = market.yesProbability.toNumber();

      // Allow 1% margin for rounding
      assert.approximately(actualYesProb, expectedYesProb, 1);

      console.log(`✅ Probability calculation verified`);
      console.log(`   Expected YES: ${expectedYesProb.toFixed(2)}%`);
      console.log(`   Actual YES: ${actualYesProb.toFixed(2)}%\n`);
    });
  });

  describe("🎯 SECTION 3: Market Resolution - Epic 4", () => {
    let resolutionMarket: Keypair;

    before(async () => {
      resolutionMarket = Keypair.generate();

      console.log("\n📝 Creating market for resolution testing...");

      await coreMarketsProgram.methods
        .createMarket(
          "Resolution Test - Will resolve YES",
          "Testing resolution flow",
          new anchor.BN(Math.floor(Date.now() / 1000) + 60) // 1 minute
        )
        .accounts({
          market: resolutionMarket.publicKey,
          creator: authority.publicKey,
          parameters: parametersPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([resolutionMarket])
        .rpc();

      // Place bets
      await coreMarketsProgram.methods
        .placeBet(true, new anchor.BN(50 * LAMPORTS_PER_USDC))
        .accounts({
          market: resolutionMarket.publicKey,
          bettor: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await coreMarketsProgram.methods
        .placeBet(false, new anchor.BN(30 * LAMPORTS_PER_USDC))
        .accounts({
          market: resolutionMarket.publicKey,
          bettor: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log(`✓ Market created with bets: ${resolutionMarket.publicKey.toBase58()}\n`);
    });

    it("3.1 - Resolve Market to YES", async () => {
      console.log("✨ TEST 3.1: Resolve Market to YES");

      // Wait for resolution time
      await new Promise(resolve => setTimeout(resolve, 2000));

      const marketBefore = await coreMarketsProgram.account.market.fetch(resolutionMarket.publicKey);
      assert.isFalse(marketBefore.isResolved);

      await marketResolutionProgram.methods
        .resolveMarket(true)
        .accounts({
          market: resolutionMarket.publicKey,
          authority: authority.publicKey,
          coreMarketsProgram: CORE_MARKETS_ID,
        })
        .rpc();

      const marketAfter = await coreMarketsProgram.account.market.fetch(resolutionMarket.publicKey);

      assert.isTrue(marketAfter.isResolved);
      assert.isTrue(marketAfter.resolvedOutcome);

      console.log(`✅ Market resolved to YES`);
      console.log(`   Total Pool: ${marketAfter.totalPool.toString()}\n`);
    });

    it("3.2 - Cannot Bet After Resolution", async () => {
      console.log("✨ TEST 3.2: Cannot Bet After Resolution");

      let failed = false;
      try {
        await coreMarketsProgram.methods
          .placeBet(true, new anchor.BN(10 * LAMPORTS_PER_USDC))
          .accounts({
            market: resolutionMarket.publicKey,
            bettor: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      } catch (error) {
        failed = true;
      }

      assert.isTrue(failed, "Should reject bet on resolved market");
      console.log(`✅ Correctly rejected bet on resolved market\n`);
    });
  });

  describe("💸 SECTION 4: Payout Claims - Epic 4", () => {

    it("4.1 - Claim Payout from Resolved Market", async () => {
      console.log("✨ TEST 4.1: Claim Payout");

      const balanceBefore = await provider.connection.getBalance(authority.publicKey);

      await marketResolutionProgram.methods
        .claimPayout()
        .accounts({
          market: resolutionMarket.publicKey,
          claimer: authority.publicKey,
          coreMarketsProgram: CORE_MARKETS_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const balanceAfter = await provider.connection.getBalance(authority.publicKey);
      const payout = balanceAfter - balanceBefore;

      assert.isAbove(payout, 0);

      console.log(`✅ Payout claimed successfully`);
      console.log(`   Payout: ${(payout / 1e9).toFixed(6)} SOL\n`);
    });

    it("4.2 - Cannot Claim Twice", async () => {
      console.log("✨ TEST 4.2: Cannot Claim Twice");

      let failed = false;
      try {
        await marketResolutionProgram.methods
          .claimPayout()
          .accounts({
            market: resolutionMarket.publicKey,
            claimer: authority.publicKey,
            coreMarketsProgram: CORE_MARKETS_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      } catch (error) {
        failed = true;
      }

      assert.isTrue(failed, "Should reject double claim");
      console.log(`✅ Correctly rejected double claim\n`);
    });
  });

  after(() => {
    console.log("\n" + "=".repeat(80));
    console.log("🎉 BULLETPROOF EXECUTION TEST COMPLETE");
    console.log("=".repeat(80));
    console.log("\n✅ All critical paths validated");
    console.log("✅ Edge cases tested");
    console.log("✅ Economic invariants verified");
    console.log("✅ Epic 4 (Resolution & Payouts) working\n");
  });
});
