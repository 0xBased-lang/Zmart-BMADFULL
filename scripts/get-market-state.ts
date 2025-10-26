/**
 * Get Market State - Comprehensive Market Data Retrieval
 *
 * Fetches and displays complete market state including:
 * - Market details and status
 * - Pool balances and odds
 * - Total bets and statistics
 * - Fee accumulation
 * - Account verification
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { CoreMarkets } from "../target/types/core_markets";
import { ParameterStorage } from "../target/types/parameter_storage";

async function getMarketState() {
  console.log("\n🔍 Fetching Market State from Devnet\n");

  // Get market ID from command line
  const marketId = process.argv[2];
  if (!marketId) {
    console.error("❌ Usage: npx ts-node scripts/get-market-state.ts <market_id>");
    process.exit(1);
  }

  const marketIdNum = parseInt(marketId);
  console.log(`📊 Market ID: ${marketIdNum}\n`);

  try {
    // Setup provider
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    // Load programs
    const coreMarketsProgram = anchor.workspace.CoreMarkets as Program<CoreMarkets>;
    const parameterStorageProgram = anchor.workspace.ParameterStorage as Program<ParameterStorage>;

    console.log(`📦 Core Markets Program: ${coreMarketsProgram.programId.toBase58()}`);
    console.log(`📦 Parameter Storage Program: ${parameterStorageProgram.programId.toBase58()}\n`);

    // Derive market PDA
    const marketIdBN = new anchor.BN(marketIdNum);
    const [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), marketIdBN.toArrayLike(Buffer, "le", 8)],
      coreMarketsProgram.programId
    );

    console.log(`🔍 Market PDA: ${marketPda.toBase58()}\n`);

    // Fetch market account
    const marketAccount = await coreMarketsProgram.account.market.fetch(marketPda);

    // Derive global parameters PDA
    const [globalParamsPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("global-parameters")],
      parameterStorageProgram.programId
    );

    console.log(`🔍 Global Parameters PDA: ${globalParamsPda.toBase58()}\n`);

    // Fetch global parameters
    const globalParams = await parameterStorageProgram.account.globalParameters.fetch(globalParamsPda);

    // Get market account balance
    const marketBalance = await provider.connection.getBalance(marketPda);

    // Display market state
    console.log("=" .repeat(70));
    console.log("📊 MARKET STATE");
    console.log("=".repeat(70));
    console.log(`\n📋 Basic Info:`);
    console.log(`   Market ID: ${marketAccount.marketId.toString()}`);
    console.log(`   Creator: ${marketAccount.creator.toBase58()}`);
    console.log(`   Status: ${JSON.stringify(marketAccount.status)}`);
    console.log(`   End Date: ${new Date(marketAccount.endDate.toNumber() * 1000).toISOString()}`);
    console.log(`   Bump: ${marketAccount.bump}`);

    console.log(`\n📝 Market Details:`);
    console.log(`   Title: ${marketAccount.title}`);
    console.log(`   Description: ${marketAccount.description.substring(0, 100)}...`);

    console.log(`\n💰 Pool Balances:`);
    console.log(`   Yes Pool: ${marketAccount.yesPool.toString()} lamports (${(marketAccount.yesPool.toNumber() / anchor.web3.LAMPORTS_PER_SOL).toFixed(6)} SOL)`);
    console.log(`   No Pool: ${marketAccount.noPool.toString()} lamports (${(marketAccount.noPool.toNumber() / anchor.web3.LAMPORTS_PER_SOL).toFixed(6)} SOL)`);
    console.log(`   Total Pools: ${(marketAccount.yesPool.toNumber() + marketAccount.noPool.toNumber())} lamports (${((marketAccount.yesPool.toNumber() + marketAccount.noPool.toNumber()) / anchor.web3.LAMPORTS_PER_SOL).toFixed(6)} SOL)`);

    console.log(`\n📈 Betting Statistics:`);
    console.log(`   Total Bets: ${marketAccount.totalBets.toString()}`);
    console.log(`   Total Volume: ${(marketAccount.yesPool.toNumber() + marketAccount.noPool.toNumber())} lamports in pools`);

    // Calculate current odds
    const yesPool = marketAccount.yesPool.toNumber();
    const noPool = marketAccount.noPool.toNumber();
    const totalPool = yesPool + noPool;

    let yesOdds, noOdds;
    if (totalPool === 0) {
      yesOdds = 50.0;
      noOdds = 50.0;
    } else {
      yesOdds = (noPool / totalPool) * 100;
      noOdds = (yesPool / totalPool) * 100;
    }

    console.log(`\n📊 Current Odds:`);
    console.log(`   YES: ${yesOdds.toFixed(2)}%`);
    console.log(`   NO: ${noOdds.toFixed(2)}%`);

    console.log(`\n💳 Account Info:`);
    console.log(`   Market Account Balance: ${marketBalance} lamports (${(marketBalance / anchor.web3.LAMPORTS_PER_SOL).toFixed(6)} SOL)`);
    console.log(`   Rent Reserve: ~${((783 * 6960) / anchor.web3.LAMPORTS_PER_SOL).toFixed(6)} SOL (estimated)`);

    // Calculate fees accumulated (market balance - rent - pools)
    const estimatedRent = 783 * 6960; // rough estimate
    const feesAccumulated = marketBalance - estimatedRent - totalPool;
    console.log(`   Fees Accumulated: ~${feesAccumulated} lamports (~${(feesAccumulated / anchor.web3.LAMPORTS_PER_SOL).toFixed(6)} SOL)`);

    // Display global parameters
    console.log("\n" + "=".repeat(70));
    console.log("⚙️  GLOBAL PARAMETERS");
    console.log("=".repeat(70));
    console.log(`\n💰 Bet Limits:`);
    console.log(`   Min Bet: ${globalParams.minBetLamports.toString()} lamports (${(globalParams.minBetLamports.toNumber() / anchor.web3.LAMPORTS_PER_SOL).toFixed(6)} SOL)`);
    console.log(`   Max Bet: ${globalParams.maxBetLamports.toString()} lamports (${(globalParams.maxBetLamports.toNumber() / anchor.web3.LAMPORTS_PER_SOL).toFixed(6)} SOL)`);

    console.log(`\n💳 Fee Structure:`);
    console.log(`   Platform Fee: ${globalParams.platformFeeBps} bps (${(globalParams.platformFeeBps / 100).toFixed(2)}%)`);
    console.log(`   Creator Fee: ${globalParams.creatorFeeBps} bps (${(globalParams.creatorFeeBps / 100).toFixed(2)}%)`);
    console.log(`   Total Fees: ${globalParams.platformFeeBps + globalParams.creatorFeeBps} bps (${((globalParams.platformFeeBps + globalParams.creatorFeeBps) / 100).toFixed(2)}%)`);

    console.log(`\n🔐 Authority:`);
    console.log(`   Authority: ${globalParams.authority.toBase58()}`);
    console.log(`   Last Updated: ${new Date(globalParams.lastUpdated.toNumber() * 1000).toISOString()}`);
    console.log(`   Cooldown Until: ${new Date(globalParams.cooldownUntil.toNumber() * 1000).toISOString()}`);

    console.log(`\n⏰ Timing:`);
    console.log(`   Min Duration: ${globalParams.minDurationSeconds.toString()} seconds (${(globalParams.minDurationSeconds.toNumber() / 3600).toFixed(2)} hours)`);
    console.log(`   Max Duration: ${globalParams.maxDurationSeconds.toString()} seconds (${(globalParams.maxDurationSeconds.toNumber() / 86400).toFixed(2)} days)`);
    console.log(`   Dispute Window: ${globalParams.disputeWindowSeconds.toString()} seconds (${(globalParams.disputeWindowSeconds.toNumber() / 3600).toFixed(2)} hours)`);

    console.log("\n" + "=".repeat(70));
    console.log("✅ Market state retrieved successfully!");
    console.log("=".repeat(70) + "\n");

    // Return state for programmatic use
    return {
      market: marketAccount,
      marketPda,
      globalParams,
      globalParamsPda,
      marketBalance,
      yesOdds,
      noOdds,
      feesAccumulated,
    };

  } catch (error) {
    console.error("\n❌ Failed to fetch market state:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  getMarketState().catch(console.error);
}

export { getMarketState };
