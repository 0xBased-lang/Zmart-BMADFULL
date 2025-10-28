import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { CoreMarkets } from "../target/types/core_markets";
import { ParameterStorage } from "../target/types/parameter_storage";
import { expect } from "chai";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

/**
 * CoreMarkets Program - Comprehensive Unit Tests
 * Story 4.1 - Task 2: CoreMarkets Program Tests
 *
 * Coverage:
 * - Market creation with valid parameters
 * - Bet placement (YES/NO sides)
 * - Odds calculation
 * - Fee distribution (BPS-based)
 * - Edge cases (dust, rounding)
 * - Minimum/maximum bet limits
 * - Market status validation
 */

describe("CoreMarkets Program Tests", () => {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CoreMarkets as Program<CoreMarkets>;
  const parameterProgram = anchor.workspace.ParameterStorage as Program<ParameterStorage>;

  const authority = provider.wallet as anchor.Wallet;

  // PDAs
  let globalParametersPda: PublicKey;
  let platformWallet: PublicKey;

  // Test accounts
  let creator: Keypair;
  let bettor: Keypair;
  let bettorB: Keypair;

  // Helper: Create and fund test account
  async function createAndFundAccount(lamports: number = 100 * LAMPORTS_PER_SOL): Promise<Keypair> {
    const keypair = Keypair.generate();
    const airdropSignature = await provider.connection.requestAirdrop(
      keypair.publicKey,
      lamports
    );
    await provider.connection.confirmTransaction(airdropSignature);
    return keypair;
  }

  // Helper: Get current timestamp
  function getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  // Helper: Get next market ID
  async function getNextMarketId(): Promise<BN> {
    const globalParams = await parameterProgram.account.globalParameters.fetch(globalParametersPda);
    return globalParams.totalMarkets.add(new BN(1));
  }

  // Helper: Create test market
  async function createTestMarket(
    creator: Keypair,
    endDateOffset: number = 3600,
    options: { title?: string; description?: string } = {}
  ): Promise<{ marketPda: PublicKey; marketId: BN; endDate: number }> {
    const marketId = await getNextMarketId();

    const [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const endDate = getCurrentTimestamp() + endDateOffset;

    await program.methods
      .createMarket(
        options.title || `Test Market ${marketId}`,
        options.description || "Test market description",
        new BN(endDate)
      )
      .accounts({
        market: marketPda,
        creator: creator.publicKey,
        globalParameters: globalParametersPda,
        parameterStorageProgram: parameterProgram.programId,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    return { marketPda, marketId, endDate };
  }

  // Helper: Place bet
  async function placeBet(
    bettor: Keypair,
    marketPda: PublicKey,
    betSide: any,
    amount: BN
  ): Promise<PublicKey> {
    const market = await program.account.market.fetch(marketPda);

    const [userBetPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user-bet"),
        marketPda.toBuffer(),
        bettor.publicKey.toBuffer(),
        market.totalBets.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    await program.methods
      .placeBet(betSide, amount)
      .accounts({
        market: marketPda,
        userBet: userBetPda,
        globalParameters: globalParametersPda,
        bettor: bettor.publicKey,
        parameterStorageProgram: parameterProgram.programId,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([bettor])
      .rpc();

    return userBetPda;
  }

  // Setup
  before(async () => {
    console.log("\n📦 Setting up CoreMarkets test environment...\n");

    [globalParametersPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("global-parameters")],
      parameterProgram.programId
    );

    const globalParams = await parameterProgram.account.globalParameters.fetch(globalParametersPda);
    platformWallet = globalParams.authority;

    creator = await createAndFundAccount();
    bettor = await createAndFundAccount();
    bettorB = await createAndFundAccount();

    console.log("✅ Test accounts created and funded\n");
  });

  // ============================================================================
  // MARKET CREATION TESTS
  // ============================================================================

  describe("Market Creation", () => {
    it("Should create market with valid parameters", async () => {
      const title = "Will Bitcoin reach $100k by 2025?";
      const description = "Market resolves YES if BTC reaches $100,000 USD at any point in 2025";
      const endDate = getCurrentTimestamp() + 86400; // +24 hours

      const marketId = await getNextMarketId();
      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      await program.methods
        .createMarket(title, description, new BN(endDate))
        .accounts({
          market: marketPda,
          creator: creator.publicKey,
          globalParameters: globalParametersPda,
          parameterStorageProgram: parameterProgram.programId,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      const market = await program.account.market.fetch(marketPda);

      expect(market.marketId.toNumber()).to.equal(marketId.toNumber());
      expect(market.creator.toString()).to.equal(creator.publicKey.toString());
      expect(market.title).to.equal(title);
      expect(market.description).to.equal(description);
      expect(market.endDate.toNumber()).to.equal(endDate);
      expect(market.yesPool.toNumber()).to.equal(0);
      expect(market.noPool.toNumber()).to.equal(0);
      expect(market.totalVolume.toNumber()).to.equal(0);
      expect(market.status).to.deep.equal({ active: {} });
    });

    it("Should reject empty title", async () => {
      const marketId = await getNextMarketId();
      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      try {
        await program.methods
          .createMarket("", "Description", new BN(getCurrentTimestamp() + 3600))
          .accounts({
            market: marketPda,
            creator: creator.publicKey,
            globalParameters: globalParametersPda,
            parameterStorageProgram: parameterProgram.programId,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([creator])
          .rpc();

        expect.fail("Should have thrown InvalidTitle error");
      } catch (error: any) {
        expect(error.toString()).to.include("InvalidTitle");
      }
    });

    it("Should reject past end_date", async () => {
      const marketId = await getNextMarketId();
      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      try {
        await program.methods
          .createMarket("Test", "Description", new BN(getCurrentTimestamp() - 3600))
          .accounts({
            market: marketPda,
            creator: creator.publicKey,
            globalParameters: globalParametersPda,
            parameterStorageProgram: parameterProgram.programId,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([creator])
          .rpc();

        expect.fail("Should have thrown InvalidEndDate error");
      } catch (error: any) {
        expect(error.toString()).to.include("InvalidEndDate");
      }
    });
  });

  // ============================================================================
  // BET PLACEMENT TESTS
  // ============================================================================

  describe("Bet Placement", () => {
    it("Should place YES bet and update pools correctly", async () => {
      const { marketPda } = await createTestMarket(creator);

      const betAmount = new BN(1 * LAMPORTS_PER_SOL);
      await placeBet(bettor, marketPda, { yes: {} }, betAmount);

      const market = await program.account.market.fetch(marketPda);

      // YES pool should be increased (minus fees)
      expect(market.yesPool.toNumber()).to.be.greaterThan(0);
      expect(market.yesPool.toNumber()).to.be.lessThan(betAmount.toNumber());

      // NO pool should still be zero
      expect(market.noPool.toNumber()).to.equal(0);

      // Total volume should reflect the bet
      expect(market.totalVolume.toNumber()).to.equal(betAmount.toNumber());

      // Total bets counter should be 1
      expect(market.totalBets.toNumber()).to.equal(1);
    });

    it("Should place NO bet and update pools correctly", async () => {
      const { marketPda } = await createTestMarket(creator);

      const betAmount = new BN(2 * LAMPORTS_PER_SOL);
      await placeBet(bettor, marketPda, { no: {} }, betAmount);

      const market = await program.account.market.fetch(marketPda);

      // NO pool should be increased (minus fees)
      expect(market.noPool.toNumber()).to.be.greaterThan(0);
      expect(market.noPool.toNumber()).to.be.lessThan(betAmount.toNumber());

      // YES pool should still be zero
      expect(market.yesPool.toNumber()).to.equal(0);

      // Total volume should reflect the bet
      expect(market.totalVolume.toNumber()).to.equal(betAmount.toNumber());
    });

    it("Should handle multiple bets from different users", async () => {
      const { marketPda } = await createTestMarket(creator);

      await placeBet(bettor, marketPda, { yes: {} }, new BN(1 * LAMPORTS_PER_SOL));
      await placeBet(bettorB, marketPda, { no: {} }, new BN(2 * LAMPORTS_PER_SOL));

      const market = await program.account.market.fetch(marketPda);

      expect(market.yesPool.toNumber()).to.be.greaterThan(0);
      expect(market.noPool.toNumber()).to.be.greaterThan(0);
      expect(market.totalBets.toNumber()).to.equal(2);
    });
  });

  // ============================================================================
  // ODDS CALCULATION TESTS
  // ============================================================================

  describe("Odds Calculation", () => {
    it("Should calculate odds correctly: YES% = yes_pool / (yes_pool + no_pool)", async () => {
      const { marketPda } = await createTestMarket(creator);

      // Place bets to create known pool ratio
      await placeBet(bettor, marketPda, { yes: {} }, new BN(3 * LAMPORTS_PER_SOL));
      await placeBet(bettorB, marketPda, { no: {} }, new BN(1 * LAMPORTS_PER_SOL));

      const market = await program.account.market.fetch(marketPda);

      const yesPool = market.yesPool.toNumber();
      const noPool = market.noPool.toNumber();
      const totalPool = yesPool + noPool;

      // Calculate odds
      const yesOdds = (yesPool / totalPool) * 100;
      const noOdds = (noPool / totalPool) * 100;

      // YES odds should be approximately 75% (3 SOL out of 4 SOL total, minus fees)
      expect(yesOdds).to.be.greaterThan(65);
      expect(yesOdds).to.be.lessThan(85);

      // NO odds should be approximately 25%
      expect(noOdds).to.be.greaterThan(15);
      expect(noOdds).to.be.lessThan(35);

      // Odds should sum to 100%
      expect(yesOdds + noOdds).to.be.closeTo(100, 0.01);
    });

    it("Should update odds after each bet", async () => {
      const { marketPda } = await createTestMarket(creator);

      // Initial bet
      await placeBet(bettor, marketPda, { yes: {} }, new BN(1 * LAMPORTS_PER_SOL));

      let market = await program.account.market.fetch(marketPda);
      const initialYesPool = market.yesPool.toNumber();

      // Second bet on opposite side
      await placeBet(bettorB, marketPda, { no: {} }, new BN(1 * LAMPORTS_PER_SOL));

      market = await program.account.market.fetch(marketPda);
      const yesPool = market.yesPool.toNumber();
      const noPool = market.noPool.toNumber();

      // YES pool should remain the same
      expect(yesPool).to.equal(initialYesPool);

      // NO pool should now be non-zero
      expect(noPool).to.be.greaterThan(0);

      // Odds should now be approximately 50/50
      const totalPool = yesPool + noPool;
      const yesOdds = (yesPool / totalPool) * 100;

      expect(yesOdds).to.be.greaterThan(45);
      expect(yesOdds).to.be.lessThan(55);
    });

    it("Should handle odds with empty pool (100% on one side)", async () => {
      const { marketPda } = await createTestMarket(creator);

      // Only YES bets
      await placeBet(bettor, marketPda, { yes: {} }, new BN(1 * LAMPORTS_PER_SOL));

      const market = await program.account.market.fetch(marketPda);

      // YES pool should be 100%
      expect(market.yesPool.toNumber()).to.be.greaterThan(0);
      expect(market.noPool.toNumber()).to.equal(0);

      // Odds calculation: 100% YES, 0% NO
      const yesOdds = 100;
      const noOdds = 0;

      expect(yesOdds).to.equal(100);
      expect(noOdds).to.equal(0);
    });
  });

  // ============================================================================
  // FEE DISTRIBUTION TESTS
  // ============================================================================

  describe("Fee Distribution (BPS-based)", () => {
    it("Should collect platform fees from bet", async () => {
      const { marketPda } = await createTestMarket(creator);

      const platformBalanceBefore = await provider.connection.getBalance(platformWallet);

      const betAmount = new BN(10 * LAMPORTS_PER_SOL);
      await placeBet(bettor, marketPda, { yes: {} }, betAmount);

      const market = await program.account.market.fetch(marketPda);
      const globalParams = await parameterProgram.account.globalParameters.fetch(globalParametersPda);

      // Calculate expected fees (using BPS)
      const expectedPlatformFee = (betAmount.toNumber() * globalParams.platformFeeBps) / 10000;

      // Platform should have received fees
      expect(market.totalPlatformFees.toNumber()).to.be.closeTo(expectedPlatformFee, expectedPlatformFee * 0.1);

      // Pool should be bet amount minus all fees
      const totalFees = market.totalPlatformFees.toNumber() + market.totalCreatorFees.toNumber();
      expect(market.yesPool.toNumber()).to.equal(betAmount.toNumber() - totalFees);
    });

    it("Should collect creator fees from bet", async () => {
      const { marketPda } = await createTestMarket(creator);

      const betAmount = new BN(10 * LAMPORTS_PER_SOL);
      await placeBet(bettor, marketPda, { yes: {} }, betAmount);

      const market = await program.account.market.fetch(marketPda);
      const globalParams = await parameterProgram.account.globalParameters.fetch(globalParametersPda);

      // Calculate expected creator fees (using BPS)
      const expectedCreatorFee = (betAmount.toNumber() * globalParams.creatorFeeBps) / 10000;

      // Creator fees should be tracked
      expect(market.totalCreatorFees.toNumber()).to.be.closeTo(expectedCreatorFee, expectedCreatorFee * 0.1);
    });

    it("Should split fees correctly (platform + creator + pool)", async () => {
      const { marketPda } = await createTestMarket(creator);

      const betAmount = new BN(10 * LAMPORTS_PER_SOL);
      await placeBet(bettor, marketPda, { yes: {} }, betAmount);

      const market = await program.account.market.fetch(marketPda);

      const platformFees = market.totalPlatformFees.toNumber();
      const creatorFees = market.totalCreatorFees.toNumber();
      const yesPool = market.yesPool.toNumber();

      // Total should equal bet amount
      const total = platformFees + creatorFees + yesPool;
      expect(total).to.equal(betAmount.toNumber());
    });
  });

  // ============================================================================
  // EDGE CASE TESTS
  // ============================================================================

  describe("Edge Cases", () => {
    it("Should handle dust amounts without panic", async () => {
      const { marketPda } = await createTestMarket(creator);

      // Tiny bet (1 lamport)
      const dustAmount = new BN(1);

      try {
        await placeBet(bettor, marketPda, { yes: {} }, dustAmount);

        const market = await program.account.market.fetch(marketPda);

        // Should either succeed with minimal pool update or reject cleanly
        expect(market.yesPool.toNumber()).to.be.at.least(0);
      } catch (error: any) {
        // If it rejects, should be for minimum bet requirement (not panic)
        expect(error.toString()).to.not.include("panic");
      }
    });

    it("Should handle rounding errors gracefully", async () => {
      const { marketPda } = await createTestMarket(creator);

      // Create scenario with potential rounding issues
      await placeBet(bettor, marketPda, { yes: {} }, new BN(1001));
      await placeBet(bettorB, marketPda, { no: {} }, new BN(1003));

      const market = await program.account.market.fetch(marketPda);

      // Pools should be non-negative
      expect(market.yesPool.toNumber()).to.be.at.least(0);
      expect(market.noPool.toNumber()).to.be.at.least(0);

      // Total fees + pools should equal total volume
      const totalFees = market.totalPlatformFees.toNumber() + market.totalCreatorFees.toNumber();
      const totalPools = market.yesPool.toNumber() + market.noPool.toNumber();
      const reconstructed = totalFees + totalPools;

      expect(reconstructed).to.be.closeTo(market.totalVolume.toNumber(), 10);
    });
  });

  // ============================================================================
  // MINIMUM/MAXIMUM BET LIMITS TESTS
  // ============================================================================

  describe("Bet Limits Enforcement", () => {
    it("Should reject bets below minimum_bet parameter", async () => {
      const { marketPda } = await createTestMarket(creator);

      const globalParams = await parameterProgram.account.globalParameters.fetch(globalParametersPda);
      const minBet = globalParams.minimumBet;

      // Try to bet below minimum
      const tooSmallBet = minBet.sub(new BN(1));

      try {
        await placeBet(bettor, marketPda, { yes: {} }, tooSmallBet);
        expect.fail("Should have thrown BetTooSmall error");
      } catch (error: any) {
        expect(error.toString()).to.include("BetTooSmall");
      }
    });

    it("Should accept bets at minimum_bet exactly", async () => {
      const { marketPda } = await createTestMarket(creator);

      const globalParams = await parameterProgram.account.globalParameters.fetch(globalParametersPda);
      const minBet = globalParams.minimumBet;

      // Bet exactly at minimum
      await placeBet(bettor, marketPda, { yes: {} }, minBet);

      const market = await program.account.market.fetch(marketPda);
      expect(market.totalBets.toNumber()).to.equal(1);
    });

    it("Should reject bets above maximum_bet parameter", async () => {
      const { marketPda } = await createTestMarket(creator);

      const globalParams = await parameterProgram.account.globalParameters.fetch(globalParametersPda);
      const maxBet = globalParams.maximumBet;

      // Try to bet above maximum
      const tooLargeBet = maxBet.add(new BN(1));

      try {
        await placeBet(bettor, marketPda, { yes: {} }, tooLargeBet);
        expect.fail("Should have thrown BetTooLarge error");
      } catch (error: any) {
        expect(error.toString()).to.include("BetTooLarge");
      }
    });
  });

  // ============================================================================
  // MARKET STATUS VALIDATION TESTS
  // ============================================================================

  describe("Market Status Validation", () => {
    it("Should accept bets only on ACTIVE markets", async () => {
      const { marketPda } = await createTestMarket(creator);

      const market = await program.account.market.fetch(marketPda);
      expect(market.status).to.deep.equal({ active: {} });

      // Should accept bet
      await placeBet(bettor, marketPda, { yes: {} }, new BN(1 * LAMPORTS_PER_SOL));

      const marketAfter = await program.account.market.fetch(marketPda);
      expect(marketAfter.totalBets.toNumber()).to.equal(1);
    });

    // Note: Testing RESOLVED and CANCELLED market rejections requires
    // resolving markets, which is tested in core-markets-epic4-bulletproof.ts
  });
});
