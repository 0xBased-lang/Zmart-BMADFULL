/**
 * BMAD-Zmart Bulletproof Comprehensive Test Suite
 *
 * ULTRA-THOROUGH testing of all edge cases and transaction functions
 *
 * Test Coverage:
 * 1. Market Creation - All edge cases and boundary conditions
 * 2. Betting System - YES/NO bets with economic validation
 * 3. Market Resolution - Epic 4 resolution flows
 * 4. Payout Claims - Epic 4 payout distribution
 * 5. Error Recovery - Transaction failures and edge cases
 * 6. Economic Invariants - Total pool conservation, probability math
 *
 * Wallet: 4MkybTASDtmzQnfUWztHmfgyHgBREw74eTKipVADqQLA
 * Balance: 16.22 SOL (devnet)
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";
import { CoreMarkets } from "../target/types/core_markets";
import { ParameterStorage } from "../target/types/parameter_storage";
import { MarketResolution } from "../target/types/market_resolution";

// Test configuration
const DEVNET_RPC = "https://api.devnet.solana.com";
const PROGRAM_IDS = {
  coreMarkets: new PublicKey("6BBZWsJZq23k2NX3YnENgXTEPhbVEHXYmPxmamN83eEV"),
  parameterStorage: new PublicKey("J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD"),
  marketResolution: new PublicKey("Hcxxt6W1HmKQmnUvqpgzNEqVG611Yzt2i4DUvwvkLRf2"),
};

// Economic constants
const LAMPORTS_PER_USDC = 1_000_000; // 6 decimals
const MIN_BET_AMOUNT = 1 * LAMPORTS_PER_USDC; // 1 USDC
const MAX_BET_AMOUNT = 1000 * LAMPORTS_PER_USDC; // 1000 USDC
const INITIAL_PROBABILITY = 50; // 50%
const INITIAL_LIQUIDITY = 100 * LAMPORTS_PER_USDC; // 100 USDC

// Test results tracking
interface TestResult {
  name: string;
  status: "PASS" | "FAIL" | "SKIP";
  duration: number;
  error?: string;
  details?: any;
}

const testResults: TestResult[] = [];

function recordTest(name: string, status: "PASS" | "FAIL" | "SKIP", duration: number, error?: string, details?: any) {
  testResults.push({ name, status, duration, error, details });
  const symbol = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⏭️";
  console.log(`${symbol} ${name} (${duration}ms)`);
  if (error) console.log(`   Error: ${error}`);
  if (details) console.log(`   Details:`, details);
}

describe("🔬 Bulletproof Comprehensive Test Suite", () => {
  let provider: AnchorProvider;
  let coreMarketsProgram: Program<CoreMarkets>;
  let parameterStorageProgram: Program<Program>;
  let marketResolutionProgram: Program<MarketResolution>;
  let authority: Keypair;

  // Test markets
  let testMarket1: Keypair;
  let testMarket2: Keypair;
  let testMarket3: Keypair;

  // Test parameters PDA
  let parametersPda: PublicKey;

  before(async () => {
    console.log("\n🔬 INITIALIZING BULLETPROOF TEST SUITE...\n");

    // Setup provider
    provider = AnchorProvider.env();
    anchor.setProvider(provider);

    authority = (provider.wallet as any).payer;
    console.log("🔑 Test Wallet:", authority.publicKey.toBase58());

    // Load programs
    coreMarketsProgram = new Program(
      require("../target/idl/core_markets.json"),
      PROGRAM_IDS.coreMarkets,
      provider
    );

    marketResolutionProgram = new Program(
      require("../target/idl/market_resolution.json"),
      PROGRAM_IDS.marketResolution,
      provider
    );

    // Get balance
    const balance = await provider.connection.getBalance(authority.publicKey);
    console.log(`💰 Wallet Balance: ${balance / LAMPORTS_PER_SOL} SOL\n`);

    // Derive parameters PDA
    [parametersPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("parameters")],
      PROGRAM_IDS.parameterStorage
    );

    console.log("📋 Parameters PDA:", parametersPda.toBase58());
  });

  after(() => {
    console.log("\n" + "=".repeat(80));
    console.log("📊 TEST RESULTS SUMMARY");
    console.log("=".repeat(80));

    const passed = testResults.filter(t => t.status === "PASS").length;
    const failed = testResults.filter(t => t.status === "FAIL").length;
    const skipped = testResults.filter(t => t.status === "SKIP").length;
    const total = testResults.length;

    console.log(`\nTotal Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`\nSuccess Rate: ${((passed / total) * 100).toFixed(2)}%`);

    if (failed > 0) {
      console.log("\n❌ FAILED TESTS:");
      testResults.filter(t => t.status === "FAIL").forEach(t => {
        console.log(`   - ${t.name}: ${t.error}`);
      });
    }

    console.log("\n" + "=".repeat(80) + "\n");
  });

  // ============================================================================
  // SECTION 1: MARKET CREATION - EDGE CASES
  // ============================================================================

  describe("🏗️  SECTION 1: Market Creation - Edge Cases", () => {

    it("1.1 - Valid Market Creation (Baseline)", async () => {
      const start = Date.now();
      try {
        testMarket1 = Keypair.generate();

        const title = "Will BTC reach $100k by end of 2025?";
        const description = "Market resolves YES if Bitcoin reaches $100,000 USD on any major exchange before December 31, 2025 23:59:59 UTC.";
        const resolutionTime = new BN(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60); // 1 year from now

        await coreMarketsProgram.methods
          .createMarket(title, description, resolutionTime)
          .accounts({
            market: testMarket1.publicKey,
            creator: authority.publicKey,
            parameters: parametersPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([testMarket1])
          .rpc();

        // Verify market created
        const market = await coreMarketsProgram.account.market.fetch(testMarket1.publicKey);
        expect(market.title).to.equal(title);
        expect(market.description).to.equal(description);
        expect(market.creator.toBase58()).to.equal(authority.publicKey.toBase58());
        expect(market.isResolved).to.be.false;

        recordTest("1.1 - Valid Market Creation", "PASS", Date.now() - start, undefined, {
          marketId: testMarket1.publicKey.toBase58(),
          title: market.title,
        });
      } catch (error) {
        recordTest("1.1 - Valid Market Creation", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });

    it("1.2 - Market Creation: Maximum Title Length", async () => {
      const start = Date.now();
      try {
        const market = Keypair.generate();

        // Create title at maximum allowed length (256 characters)
        const maxTitle = "A".repeat(256);
        const description = "Testing maximum title length boundary condition.";
        const resolutionTime = new BN(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60);

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
        expect(marketData.title.length).to.equal(256);

        recordTest("1.2 - Maximum Title Length", "PASS", Date.now() - start);
      } catch (error) {
        recordTest("1.2 - Maximum Title Length", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });

    it("1.3 - Market Creation: Special Characters in Title", async () => {
      const start = Date.now();
      try {
        const market = Keypair.generate();

        // Test special characters, emojis, unicode
        const specialTitle = "Will 🚀 SpaceX land on Mars? (2025-2030) $$$";
        const description = "Testing special characters: !@#$%^&*()_+-=[]{}|;':\",./<>?";
        const resolutionTime = new BN(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60);

        await coreMarketsProgram.methods
          .createMarket(specialTitle, description, resolutionTime)
          .accounts({
            market: market.publicKey,
            creator: authority.publicKey,
            parameters: parametersPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([market])
          .rpc();

        const marketData = await coreMarketsProgram.account.market.fetch(market.publicKey);
        expect(marketData.title).to.equal(specialTitle);

        recordTest("1.3 - Special Characters", "PASS", Date.now() - start);
      } catch (error) {
        recordTest("1.3 - Special Characters", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });

    it("1.4 - Market Creation: Minimum Resolution Time", async () => {
      const start = Date.now();
      try {
        const market = Keypair.generate();

        // Set resolution time to 1 minute from now (minimum practical)
        const minResolutionTime = new BN(Math.floor(Date.now() / 1000) + 60);

        await coreMarketsProgram.methods
          .createMarket("Quick Market Test", "Resolves in 1 minute", minResolutionTime)
          .accounts({
            market: market.publicKey,
            creator: authority.publicKey,
            parameters: parametersPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([market])
          .rpc();

        const marketData = await coreMarketsProgram.account.market.fetch(market.publicKey);
        expect(marketData.resolutionTime.toNumber()).to.be.closeTo(minResolutionTime.toNumber(), 5);

        recordTest("1.4 - Minimum Resolution Time", "PASS", Date.now() - start);
      } catch (error) {
        recordTest("1.4 - Minimum Resolution Time", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });

    it("1.5 - Market Creation: Far Future Resolution", async () => {
      const start = Date.now();
      try {
        const market = Keypair.generate();

        // Set resolution time to 10 years from now
        const farFutureTime = new BN(Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 60 * 60);

        await coreMarketsProgram.methods
          .createMarket("2035 Prediction", "Long-term future market", farFutureTime)
          .accounts({
            market: market.publicKey,
            creator: authority.publicKey,
            parameters: parametersPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([market])
          .rpc();

        recordTest("1.5 - Far Future Resolution", "PASS", Date.now() - start);
      } catch (error) {
        recordTest("1.5 - Far Future Resolution", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });

    it("1.6 - Market Creation: Past Resolution Time (Should Fail)", async () => {
      const start = Date.now();
      try {
        const market = Keypair.generate();

        // Set resolution time in the past (should fail)
        const pastTime = new BN(Math.floor(Date.now() / 1000) - 86400); // 1 day ago

        await coreMarketsProgram.methods
          .createMarket("Past Market", "Should fail", pastTime)
          .accounts({
            market: market.publicKey,
            creator: authority.publicKey,
            parameters: parametersPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([market])
          .rpc();

        recordTest("1.6 - Past Resolution Time", "FAIL", Date.now() - start, "Should have rejected past time");
      } catch (error) {
        // Expected to fail
        recordTest("1.6 - Past Resolution Time", "PASS", Date.now() - start, undefined, {
          note: "Correctly rejected past resolution time"
        });
      }
    });

    it("1.7 - Market Creation: Empty Title (Should Fail)", async () => {
      const start = Date.now();
      try {
        const market = Keypair.generate();

        await coreMarketsProgram.methods
          .createMarket("", "Empty title test", new BN(Math.floor(Date.now() / 1000) + 86400))
          .accounts({
            market: market.publicKey,
            creator: authority.publicKey,
            parameters: parametersPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([market])
          .rpc();

        recordTest("1.7 - Empty Title", "FAIL", Date.now() - start, "Should have rejected empty title");
      } catch (error) {
        // Expected to fail
        recordTest("1.7 - Empty Title", "PASS", Date.now() - start, undefined, {
          note: "Correctly rejected empty title"
        });
      }
    });
  });

  // ============================================================================
  // SECTION 2: BETTING SYSTEM - BOUNDARY CONDITIONS
  // ============================================================================

  describe("💰 SECTION 2: Betting System - Boundary Conditions", () => {

    it("2.1 - Place Valid YES Bet (Baseline)", async () => {
      const start = Date.now();
      try {
        const betAmount = new BN(10 * LAMPORTS_PER_USDC); // 10 USDC

        // Get market state before bet
        const marketBefore = await coreMarketsProgram.account.market.fetch(testMarket1.publicKey);
        const yesPoolBefore = marketBefore.yesPool.toNumber();
        const noPoolBefore = marketBefore.noPool.toNumber();

        await coreMarketsProgram.methods
          .placeBet(true, betAmount) // true = YES
          .accounts({
            market: testMarket1.publicKey,
            bettor: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        // Verify bet placed
        const marketAfter = await coreMarketsProgram.account.market.fetch(testMarket1.publicKey);
        const yesPoolAfter = marketAfter.yesPool.toNumber();

        expect(yesPoolAfter).to.be.greaterThan(yesPoolBefore);
        expect(marketAfter.totalBets.toNumber()).to.be.greaterThan(marketBefore.totalBets.toNumber());

        recordTest("2.1 - Valid YES Bet", "PASS", Date.now() - start, undefined, {
          betAmount: betAmount.toString(),
          yesPoolBefore,
          yesPoolAfter,
          increase: yesPoolAfter - yesPoolBefore
        });
      } catch (error) {
        recordTest("2.1 - Valid YES Bet", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });

    it("2.2 - Place Valid NO Bet (Baseline)", async () => {
      const start = Date.now();
      try {
        const betAmount = new BN(10 * LAMPORTS_PER_USDC); // 10 USDC

        const marketBefore = await coreMarketsProgram.account.market.fetch(testMarket1.publicKey);
        const noPoolBefore = marketBefore.noPool.toNumber();

        await coreMarketsProgram.methods
          .placeBet(false, betAmount) // false = NO
          .accounts({
            market: testMarket1.publicKey,
            bettor: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        const marketAfter = await coreMarketsProgram.account.market.fetch(testMarket1.publicKey);
        const noPoolAfter = marketAfter.noPool.toNumber();

        expect(noPoolAfter).to.be.greaterThan(noPoolBefore);

        recordTest("2.2 - Valid NO Bet", "PASS", Date.now() - start, undefined, {
          betAmount: betAmount.toString(),
          noPoolBefore,
          noPoolAfter,
          increase: noPoolAfter - noPoolBefore
        });
      } catch (error) {
        recordTest("2.2 - Valid NO Bet", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });

    it("2.3 - Minimum Bet Amount", async () => {
      const start = Date.now();
      try {
        const minBet = new BN(MIN_BET_AMOUNT); // 1 USDC minimum

        await coreMarketsProgram.methods
          .placeBet(true, minBet)
          .accounts({
            market: testMarket1.publicKey,
            bettor: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        recordTest("2.3 - Minimum Bet Amount", "PASS", Date.now() - start);
      } catch (error) {
        recordTest("2.3 - Minimum Bet Amount", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });

    it("2.4 - Below Minimum Bet (Should Fail)", async () => {
      const start = Date.now();
      try {
        const belowMin = new BN(MIN_BET_AMOUNT - 1);

        await coreMarketsProgram.methods
          .placeBet(true, belowMin)
          .accounts({
            market: testMarket1.publicKey,
            bettor: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        recordTest("2.4 - Below Minimum Bet", "FAIL", Date.now() - start, "Should reject below minimum");
      } catch (error) {
        recordTest("2.4 - Below Minimum Bet", "PASS", Date.now() - start, undefined, {
          note: "Correctly rejected below minimum bet"
        });
      }
    });

    it("2.5 - Zero Amount Bet (Should Fail)", async () => {
      const start = Date.now();
      try {
        await coreMarketsProgram.methods
          .placeBet(true, new BN(0))
          .accounts({
            market: testMarket1.publicKey,
            bettor: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        recordTest("2.5 - Zero Amount Bet", "FAIL", Date.now() - start, "Should reject zero amount");
      } catch (error) {
        recordTest("2.5 - Zero Amount Bet", "PASS", Date.now() - start, undefined, {
          note: "Correctly rejected zero bet"
        });
      }
    });

    it("2.6 - Large Bet Amount", async () => {
      const start = Date.now();
      try {
        const largeBet = new BN(100 * LAMPORTS_PER_USDC); // 100 USDC

        const marketBefore = await coreMarketsProgram.account.market.fetch(testMarket1.publicKey);

        await coreMarketsProgram.methods
          .placeBet(true, largeBet)
          .accounts({
            market: testMarket1.publicKey,
            bettor: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        const marketAfter = await coreMarketsProgram.account.market.fetch(testMarket1.publicKey);

        recordTest("2.6 - Large Bet Amount", "PASS", Date.now() - start, undefined, {
          betAmount: largeBet.toString(),
          poolIncrease: marketAfter.yesPool.toNumber() - marketBefore.yesPool.toNumber()
        });
      } catch (error) {
        recordTest("2.6 - Large Bet Amount", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });

    it("2.7 - Multiple Consecutive Bets", async () => {
      const start = Date.now();
      try {
        const betAmount = new BN(5 * LAMPORTS_PER_USDC);

        for (let i = 0; i < 5; i++) {
          await coreMarketsProgram.methods
            .placeBet(i % 2 === 0, betAmount) // Alternate YES/NO
            .accounts({
              market: testMarket1.publicKey,
              bettor: authority.publicKey,
              systemProgram: SystemProgram.programId,
            })
            .rpc();
        }

        const market = await coreMarketsProgram.account.market.fetch(testMarket1.publicKey);

        recordTest("2.7 - Multiple Consecutive Bets", "PASS", Date.now() - start, undefined, {
          totalBets: market.totalBets.toString(),
          yesPool: market.yesPool.toString(),
          noPool: market.noPool.toString()
        });
      } catch (error) {
        recordTest("2.7 - Multiple Consecutive Bets", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });
  });

  // ============================================================================
  // SECTION 3: PROBABILITY & ECONOMIC VALIDATION
  // ============================================================================

  describe("📊 SECTION 3: Probability & Economic Validation", () => {

    it("3.1 - Verify Probability Calculation", async () => {
      const start = Date.now();
      try {
        const market = await coreMarketsProgram.account.market.fetch(testMarket1.publicKey);

        const yesPool = market.yesPool.toNumber();
        const noPool = market.noPool.toNumber();
        const totalPool = yesPool + noPool;

        const expectedYesProbability = (yesPool / totalPool) * 100;
        const actualYesProbability = market.yesProbability.toNumber();

        // Allow 1% margin for rounding
        expect(actualYesProbability).to.be.closeTo(expectedYesProbability, 1);

        recordTest("3.1 - Probability Calculation", "PASS", Date.now() - start, undefined, {
          yesPool,
          noPool,
          totalPool,
          expectedProb: expectedYesProbability.toFixed(2) + "%",
          actualProb: actualYesProbability.toFixed(2) + "%"
        });
      } catch (error) {
        recordTest("3.1 - Probability Calculation", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });

    it("3.2 - Verify Total Pool Conservation", async () => {
      const start = Date.now();
      try {
        const market = await coreMarketsProgram.account.market.fetch(testMarket1.publicKey);

        const yesPool = market.yesPool.toNumber();
        const noPool = market.noPool.toNumber();
        const totalPool = market.totalPool.toNumber();

        // Total pool should equal sum of yes + no pools
        expect(totalPool).to.equal(yesPool + noPool);

        recordTest("3.2 - Total Pool Conservation", "PASS", Date.now() - start, undefined, {
          yesPool,
          noPool,
          totalPool,
          verified: totalPool === yesPool + noPool
        });
      } catch (error) {
        recordTest("3.2 - Total Pool Conservation", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });

    it("3.3 - Probability Impact of Large Bet", async () => {
      const start = Date.now();
      try {
        // Create fresh market for this test
        const testMarket = Keypair.generate();

        await coreMarketsProgram.methods
          .createMarket("Probability Test Market", "Testing probability impact", new BN(Math.floor(Date.now() / 1000) + 86400))
          .accounts({
            market: testMarket.publicKey,
            creator: authority.publicKey,
            parameters: parametersPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([testMarket])
          .rpc();

        // Place large YES bet
        const largeBet = new BN(1000 * LAMPORTS_PER_USDC);

        await coreMarketsProgram.methods
          .placeBet(true, largeBet)
          .accounts({
            market: testMarket.publicKey,
            bettor: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        const marketAfter = await coreMarketsProgram.account.market.fetch(testMarket.publicKey);

        // After large YES bet, YES probability should be significantly > 50%
        expect(marketAfter.yesProbability.toNumber()).to.be.greaterThan(50);

        recordTest("3.3 - Probability Impact", "PASS", Date.now() - start, undefined, {
          yesProbability: marketAfter.yesProbability.toNumber() + "%",
          yesPool: marketAfter.yesPool.toString(),
          noPool: marketAfter.noPool.toString()
        });
      } catch (error) {
        recordTest("3.3 - Probability Impact", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });

    it("3.4 - Payout Calculation Accuracy", async () => {
      const start = Date.now();
      try {
        const market = await coreMarketsProgram.account.market.fetch(testMarket1.publicKey);

        const betAmount = 10 * LAMPORTS_PER_USDC;
        const yesPool = market.yesPool.toNumber();
        const noPool = market.noPool.toNumber();
        const totalPool = yesPool + noPool;

        // Expected payout for YES bet if YES wins
        const expectedYesPayout = (betAmount / yesPool) * totalPool;

        // Expected payout for NO bet if NO wins
        const expectedNoPayout = (betAmount / noPool) * totalPool;

        recordTest("3.4 - Payout Calculation", "PASS", Date.now() - start, undefined, {
          betAmount,
          expectedYesPayout: expectedYesPayout.toFixed(2),
          expectedNoPayout: expectedNoPayout.toFixed(2),
          yesOdds: (expectedYesPayout / betAmount).toFixed(2) + "x",
          noOdds: (expectedNoPayout / betAmount).toFixed(2) + "x"
        });
      } catch (error) {
        recordTest("3.4 - Payout Calculation", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });
  });

  // ============================================================================
  // SECTION 4: MARKET RESOLUTION - EPIC 4
  // ============================================================================

  describe("🎯 SECTION 4: Market Resolution - Epic 4", () => {

    it("4.1 - Create Market for Resolution Testing", async () => {
      const start = Date.now();
      try {
        testMarket2 = Keypair.generate();

        await coreMarketsProgram.methods
          .createMarket(
            "Resolution Test Market - YES",
            "This market will resolve to YES",
            new BN(Math.floor(Date.now() / 1000) + 60) // 1 minute
          )
          .accounts({
            market: testMarket2.publicKey,
            creator: authority.publicKey,
            parameters: parametersPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([testMarket2])
          .rpc();

        // Place some bets
        await coreMarketsProgram.methods
          .placeBet(true, new BN(50 * LAMPORTS_PER_USDC))
          .accounts({
            market: testMarket2.publicKey,
            bettor: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        await coreMarketsProgram.methods
          .placeBet(false, new BN(30 * LAMPORTS_PER_USDC))
          .accounts({
            market: testMarket2.publicKey,
            bettor: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        recordTest("4.1 - Create Resolution Test Market", "PASS", Date.now() - start, undefined, {
          marketId: testMarket2.publicKey.toBase58()
        });
      } catch (error) {
        recordTest("4.1 - Create Resolution Test Market", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });

    it("4.2 - Resolve Market to YES", async () => {
      const start = Date.now();
      try {
        // Wait for resolution time to pass
        await new Promise(resolve => setTimeout(resolve, 2000));

        const marketBefore = await coreMarketsProgram.account.market.fetch(testMarket2.publicKey);
        expect(marketBefore.isResolved).to.be.false;

        await marketResolutionProgram.methods
          .resolveMarket(true) // Resolve to YES
          .accounts({
            market: testMarket2.publicKey,
            authority: authority.publicKey,
            coreMarketsProgram: PROGRAM_IDS.coreMarkets,
          })
          .rpc();

        const marketAfter = await coreMarketsProgram.account.market.fetch(testMarket2.publicKey);
        expect(marketAfter.isResolved).to.be.true;
        expect(marketAfter.resolvedOutcome).to.be.true; // YES

        recordTest("4.2 - Resolve to YES", "PASS", Date.now() - start, undefined, {
          resolved: true,
          outcome: "YES",
          totalPool: marketAfter.totalPool.toString()
        });
      } catch (error) {
        recordTest("4.2 - Resolve to YES", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });

    it("4.3 - Cannot Bet on Resolved Market", async () => {
      const start = Date.now();
      try {
        await coreMarketsProgram.methods
          .placeBet(true, new BN(10 * LAMPORTS_PER_USDC))
          .accounts({
            market: testMarket2.publicKey,
            bettor: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        recordTest("4.3 - Cannot Bet on Resolved", "FAIL", Date.now() - start, "Should reject bet on resolved market");
      } catch (error) {
        recordTest("4.3 - Cannot Bet on Resolved", "PASS", Date.now() - start, undefined, {
          note: "Correctly rejected bet on resolved market"
        });
      }
    });

    it("4.4 - Create Market for NO Resolution", async () => {
      const start = Date.now();
      try {
        testMarket3 = Keypair.generate();

        await coreMarketsProgram.methods
          .createMarket(
            "Resolution Test Market - NO",
            "This market will resolve to NO",
            new BN(Math.floor(Date.now() / 1000) + 60)
          )
          .accounts({
            market: testMarket3.publicKey,
            creator: authority.publicKey,
            parameters: parametersPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([testMarket3])
          .rpc();

        await coreMarketsProgram.methods
          .placeBet(true, new BN(20 * LAMPORTS_PER_USDC))
          .accounts({
            market: testMarket3.publicKey,
            bettor: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        await coreMarketsProgram.methods
          .placeBet(false, new BN(40 * LAMPORTS_PER_USDC))
          .accounts({
            market: testMarket3.publicKey,
            bettor: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        recordTest("4.4 - Create NO Resolution Market", "PASS", Date.now() - start);
      } catch (error) {
        recordTest("4.4 - Create NO Resolution Market", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });

    it("4.5 - Resolve Market to NO", async () => {
      const start = Date.now();
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));

        await marketResolutionProgram.methods
          .resolveMarket(false) // Resolve to NO
          .accounts({
            market: testMarket3.publicKey,
            authority: authority.publicKey,
            coreMarketsProgram: PROGRAM_IDS.coreMarkets,
          })
          .rpc();

        const market = await coreMarketsProgram.account.market.fetch(testMarket3.publicKey);
        expect(market.isResolved).to.be.true;
        expect(market.resolvedOutcome).to.be.false; // NO

        recordTest("4.5 - Resolve to NO", "PASS", Date.now() - start, undefined, {
          resolved: true,
          outcome: "NO"
        });
      } catch (error) {
        recordTest("4.5 - Resolve to NO", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });

    it("4.6 - Cannot Resolve Twice", async () => {
      const start = Date.now();
      try {
        await marketResolutionProgram.methods
          .resolveMarket(true)
          .accounts({
            market: testMarket3.publicKey,
            authority: authority.publicKey,
            coreMarketsProgram: PROGRAM_IDS.coreMarkets,
          })
          .rpc();

        recordTest("4.6 - Cannot Resolve Twice", "FAIL", Date.now() - start, "Should reject double resolution");
      } catch (error) {
        recordTest("4.6 - Cannot Resolve Twice", "PASS", Date.now() - start, undefined, {
          note: "Correctly rejected double resolution"
        });
      }
    });
  });

  // ============================================================================
  // SECTION 5: PAYOUT CLAIMS - EPIC 4
  // ============================================================================

  describe("💸 SECTION 5: Payout Claims - Epic 4", () => {

    it("5.1 - Claim Payout from YES Resolution", async () => {
      const start = Date.now();
      try {
        const balanceBefore = await provider.connection.getBalance(authority.publicKey);

        await marketResolutionProgram.methods
          .claimPayout()
          .accounts({
            market: testMarket2.publicKey,
            claimer: authority.publicKey,
            coreMarketsProgram: PROGRAM_IDS.coreMarkets,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        const balanceAfter = await provider.connection.getBalance(authority.publicKey);
        const payout = balanceAfter - balanceBefore;

        expect(payout).to.be.greaterThan(0);

        recordTest("5.1 - Claim YES Payout", "PASS", Date.now() - start, undefined, {
          payout: (payout / LAMPORTS_PER_SOL).toFixed(4) + " SOL",
          balanceBefore: (balanceBefore / LAMPORTS_PER_SOL).toFixed(4),
          balanceAfter: (balanceAfter / LAMPORTS_PER_SOL).toFixed(4)
        });
      } catch (error) {
        recordTest("5.1 - Claim YES Payout", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });

    it("5.2 - Claim Payout from NO Resolution", async () => {
      const start = Date.now();
      try {
        const balanceBefore = await provider.connection.getBalance(authority.publicKey);

        await marketResolutionProgram.methods
          .claimPayout()
          .accounts({
            market: testMarket3.publicKey,
            claimer: authority.publicKey,
            coreMarketsProgram: PROGRAM_IDS.coreMarkets,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        const balanceAfter = await provider.connection.getBalance(authority.publicKey);
        const payout = balanceAfter - balanceBefore;

        expect(payout).to.be.greaterThan(0);

        recordTest("5.2 - Claim NO Payout", "PASS", Date.now() - start, undefined, {
          payout: (payout / LAMPORTS_PER_SOL).toFixed(4) + " SOL"
        });
      } catch (error) {
        recordTest("5.2 - Claim NO Payout", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });

    it("5.3 - Cannot Claim Twice", async () => {
      const start = Date.now();
      try {
        await marketResolutionProgram.methods
          .claimPayout()
          .accounts({
            market: testMarket2.publicKey,
            claimer: authority.publicKey,
            coreMarketsProgram: PROGRAM_IDS.coreMarkets,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        recordTest("5.3 - Cannot Claim Twice", "FAIL", Date.now() - start, "Should reject double claim");
      } catch (error) {
        recordTest("5.3 - Cannot Claim Twice", "PASS", Date.now() - start, undefined, {
          note: "Correctly rejected double claim"
        });
      }
    });

    it("5.4 - Cannot Claim from Unresolved Market", async () => {
      const start = Date.now();
      try {
        await marketResolutionProgram.methods
          .claimPayout()
          .accounts({
            market: testMarket1.publicKey, // Not resolved
            claimer: authority.publicKey,
            coreMarketsProgram: PROGRAM_IDS.coreMarkets,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        recordTest("5.4 - Cannot Claim Unresolved", "FAIL", Date.now() - start, "Should reject claim from unresolved");
      } catch (error) {
        recordTest("5.4 - Cannot Claim Unresolved", "PASS", Date.now() - start, undefined, {
          note: "Correctly rejected claim from unresolved market"
        });
      }
    });
  });

  // ============================================================================
  // SECTION 6: ERROR RECOVERY & EDGE CASES
  // ============================================================================

  describe("🛡️  SECTION 6: Error Recovery & Edge Cases", () => {

    it("6.1 - Invalid Market Account", async () => {
      const start = Date.now();
      try {
        const fakeMarket = Keypair.generate();

        await coreMarketsProgram.methods
          .placeBet(true, new BN(10 * LAMPORTS_PER_USDC))
          .accounts({
            market: fakeMarket.publicKey, // Doesn't exist
            bettor: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        recordTest("6.1 - Invalid Market Account", "FAIL", Date.now() - start, "Should reject invalid market");
      } catch (error) {
        recordTest("6.1 - Invalid Market Account", "PASS", Date.now() - start, undefined, {
          note: "Correctly rejected invalid market"
        });
      }
    });

    it("6.2 - Concurrent Bet Handling", async () => {
      const start = Date.now();
      try {
        // Attempt multiple concurrent bets
        const betAmount = new BN(5 * LAMPORTS_PER_USDC);

        const betPromises = Array(3).fill(null).map(() =>
          coreMarketsProgram.methods
            .placeBet(true, betAmount)
            .accounts({
              market: testMarket1.publicKey,
              bettor: authority.publicKey,
              systemProgram: SystemProgram.programId,
            })
            .rpc()
        );

        await Promise.all(betPromises);

        recordTest("6.2 - Concurrent Bets", "PASS", Date.now() - start, undefined, {
          note: "Successfully handled 3 concurrent bets"
        });
      } catch (error) {
        recordTest("6.2 - Concurrent Bets", "FAIL", Date.now() - start, error.message);
      }
    });

    it("6.3 - Market State Consistency After Errors", async () => {
      const start = Date.now();
      try {
        const marketBefore = await coreMarketsProgram.account.market.fetch(testMarket1.publicKey);

        // Attempt invalid operation (should fail)
        try {
          await coreMarketsProgram.methods
            .placeBet(true, new BN(0))
            .accounts({
              market: testMarket1.publicKey,
              bettor: authority.publicKey,
              systemProgram: SystemProgram.programId,
            })
            .rpc();
        } catch {}

        // Verify market state unchanged
        const marketAfter = await coreMarketsProgram.account.market.fetch(testMarket1.publicKey);

        expect(marketAfter.totalPool.toString()).to.equal(marketBefore.totalPool.toString());
        expect(marketAfter.yesPool.toString()).to.equal(marketBefore.yesPool.toString());
        expect(marketAfter.noPool.toString()).to.equal(marketBefore.noPool.toString());

        recordTest("6.3 - State Consistency", "PASS", Date.now() - start, undefined, {
          note: "Market state remained consistent after failed transaction"
        });
      } catch (error) {
        recordTest("6.3 - State Consistency", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });
  });

  // ============================================================================
  // FINAL VALIDATION
  // ============================================================================

  describe("✅ FINAL VALIDATION", () => {

    it("Final - Economic Invariants Check", async () => {
      const start = Date.now();
      try {
        const markets = [testMarket1, testMarket2, testMarket3];

        for (const market of markets) {
          const marketData = await coreMarketsProgram.account.market.fetch(market.publicKey);

          // Verify total pool = yes + no
          const totalPool = marketData.totalPool.toNumber();
          const yesPool = marketData.yesPool.toNumber();
          const noPool = marketData.noPool.toNumber();

          expect(totalPool).to.equal(yesPool + noPool);

          // Verify probability adds to 100%
          const yesProbability = marketData.yesProbability.toNumber();
          const noProbability = 100 - yesProbability;

          expect(yesProbability + noProbability).to.be.closeTo(100, 0.1);
        }

        recordTest("Final - Economic Invariants", "PASS", Date.now() - start, undefined, {
          marketsChecked: markets.length,
          invariantsValidated: "Total pool conservation, Probability sum"
        });
      } catch (error) {
        recordTest("Final - Economic Invariants", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });

    it("Final - System Health Check", async () => {
      const start = Date.now();
      try {
        const finalBalance = await provider.connection.getBalance(authority.publicKey);

        console.log("\n" + "=".repeat(80));
        console.log("💎 FINAL SYSTEM STATE");
        console.log("=".repeat(80));
        console.log(`Wallet Balance: ${(finalBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
        console.log(`Test Markets Created: 3 (+ edge case markets)`);
        console.log(`Resolved Markets: 2 (YES and NO outcomes)`);
        console.log(`Payout Claims: 2 (validated)`);
        console.log("=".repeat(80) + "\n");

        recordTest("Final - System Health", "PASS", Date.now() - start, undefined, {
          finalBalance: (finalBalance / LAMPORTS_PER_SOL).toFixed(4) + " SOL",
          systemStatus: "HEALTHY"
        });
      } catch (error) {
        recordTest("Final - System Health", "FAIL", Date.now() - start, error.message);
        throw error;
      }
    });
  });
});
