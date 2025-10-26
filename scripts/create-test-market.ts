#!/usr/bin/env ts-node
/**
 * BMAD-Zmart Test Market Creation Script
 *
 * Creates a test prediction market on devnet for betting verification.
 *
 * Usage:
 *   ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
 *   ANCHOR_WALLET=~/.config/solana/id.json \
 *   npx ts-node scripts/create-test-market.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CoreMarkets } from "../target/types/core_markets";

async function main() {
  console.log("🎯 Creating Test Prediction Market on Devnet\n");

  // Setup provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Get program
  const program = anchor.workspace.CoreMarkets as Program<CoreMarkets>;
  const creator = provider.wallet as anchor.Wallet;

  console.log(`📋 Creator: ${creator.publicKey.toBase58()}`);
  console.log(`📦 Program: ${program.programId.toBase58()}\n`);

  // Generate unique market ID
  const marketId = new anchor.BN(Date.now());
  console.log(`🆔 Market ID: ${marketId.toString()}\n`);

  // Derive market PDA
  const [marketPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  console.log(`🔍 Market PDA: ${marketPda.toBase58()}\n`);

  // Check if market already exists
  try {
    const existingMarket = await program.account.market.fetch(marketPda);
    console.log("⚠️  Market already exists!\n");
    console.log("📊 Existing Market:");
    console.log(`   Title: ${existingMarket.title}`);
    console.log(`   Description: ${existingMarket.description}`);
    console.log(`   Creator: ${existingMarket.creator.toBase58()}`);
    console.log(`   Status: ${JSON.stringify(existingMarket.status)}`);
    console.log(`   End Date: ${new Date(existingMarket.endDate.toNumber() * 1000).toISOString()}`);
    console.log(`   Yes Pool: ${existingMarket.yesPool.toString()} lamports`);
    console.log(`   No Pool: ${existingMarket.noPool.toString()} lamports`);
    console.log(`   Total Bets: ${existingMarket.totalBets.toString()}`);
    console.log("\n✅ Market ready for betting!");
    console.log(`\n📝 To place a bet, run:`);
    console.log(`   npx ts-node scripts/place-test-bet.ts ${marketId.toString()}`);
    return;
  } catch (e) {
    // Market doesn't exist - proceed with creation
    console.log("🔨 Creating new market...\n");
  }

  // Market details
  const title = "Will Bitcoin reach $100,000 by end of 2025?";
  const description = "This market resolves to YES if Bitcoin (BTC) trades at or above $100,000 USD on any major exchange before December 31, 2025 23:59:59 UTC. Otherwise resolves to NO.";

  // Set end date to 7 days from now for testing
  const endDate = new anchor.BN(Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60));

  console.log("📝 Market Details:");
  console.log(`   Title: ${title}`);
  console.log(`   Description: ${description.substring(0, 100)}...`);
  console.log(`   End Date: ${new Date(endDate.toNumber() * 1000).toISOString()}`);
  console.log(`   (7 days from now)\n`);

  try {
    // Create market
    const tx = await program.methods
      .createMarket(
        marketId,
        title,
        description,
        endDate
      )
      .rpc();

    console.log(`✅ Market created successfully!`);
    console.log(`   TX: ${tx}\n`);

    // Wait for confirmation
    await provider.connection.confirmTransaction(tx, "confirmed");
    console.log("✅ Transaction confirmed!\n");

    // Fetch and display market
    const market = await program.account.market.fetch(marketPda);

    console.log("📊 Created Market:");
    console.log(`   Market ID: ${market.marketId.toString()}`);
    console.log(`   PDA: ${marketPda.toBase58()}`);
    console.log(`   Title: ${market.title}`);
    console.log(`   Creator: ${market.creator.toBase58()}`);
    console.log(`   Status: ${JSON.stringify(market.status)}`);
    console.log(`   End Date: ${new Date(market.endDate.toNumber() * 1000).toISOString()}`);
    console.log(`   Yes Pool: ${market.yesPool.toString()} lamports`);
    console.log(`   No Pool: ${market.noPool.toString()} lamports`);
    console.log(`   Total Bets: ${market.totalBets.toString()}`);

    console.log("\n🎉 SUCCESS! Market is ready for betting!");

    console.log("\n📝 Next Steps:");
    console.log(`   1. Place a bet: npx ts-node scripts/place-test-bet.ts ${marketId.toString()}`);
    console.log(`   2. View on explorer: https://explorer.solana.com/address/${marketPda.toBase58()}?cluster=devnet`);

    console.log("\n📋 Market Information (save this):");
    console.log(`   Market ID: ${marketId.toString()}`);
    console.log(`   Market PDA: ${marketPda.toBase58()}`);

  } catch (error: any) {
    console.error("\n❌ Market creation failed:", error.message);

    if (error.logs) {
      console.error("\n📜 Program logs:");
      error.logs.forEach((log: string) => console.error(`   ${log}`));
    }

    // Check if it's a known error
    if (error.message.includes("0x0")) {
      console.error("\n💡 Hint: Account may already exist or insufficient funds");
    }

    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
