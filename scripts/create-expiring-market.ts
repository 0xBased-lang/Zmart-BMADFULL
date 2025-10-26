/**
 * Create Expiring Test Market
 * Creates a market that expires in 2 minutes for testing expired market betting
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CoreMarkets } from "../target/types/core_markets";

async function createExpiringMarket() {
  console.log("\n⏰ Creating Market That Expires in 2 Minutes\n");

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CoreMarkets as Program<CoreMarkets>;

  // Generate unique market ID
  const marketId = new anchor.BN(Date.now());

  // End date: 2 minutes from now
  const endDate = new anchor.BN(Math.floor(Date.now() / 1000) + 120); // +120 seconds

  console.log(`🆔 Market ID: ${marketId.toString()}`);
  console.log(`⏰ End Date: ${new Date((endDate.toNumber()) * 1000).toISOString()}`);
  console.log(`⏳ Expires in: 2 minutes\n`);

  const [marketPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  console.log(`🔍 Market PDA: ${marketPda.toBase58()}\n`);

  try {
    const tx = await program.methods
      .createMarket(
        marketId,
        "Test: Will this market expire in 2 minutes?",
        "This market is for testing expired market rejection. It will expire in 2 minutes.",
        endDate
      )
      .rpc();

    console.log(`✅ Market created successfully!`);
    console.log(`   TX: ${tx}\n`);

    console.log(`📋 Test Instructions:`);
    console.log(`   1. Wait 2-3 minutes for market to expire`);
    console.log(`   2. Try betting: npx ts-node scripts/place-test-bet.ts ${marketId.toString()} yes 0.1`);
    console.log(`   3. Should reject with MarketEnded error\n`);

    console.log(`⏰ Market will expire at: ${new Date(endDate.toNumber() * 1000).toISOString()}`);
    console.log(`   Current time: ${new Date().toISOString()}`);
    console.log(`   Time until expiry: ~2 minutes\n`);

    return { marketId, marketPda, endDate };
  } catch (error) {
    console.error("\n❌ Failed to create market:", error);
    throw error;
  }
}

createExpiringMarket().catch(console.error);
