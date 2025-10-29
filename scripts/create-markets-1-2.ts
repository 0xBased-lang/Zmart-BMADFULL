#!/usr/bin/env ts-node
/**
 * Create Markets #1 and #2 on Devnet (matching database)
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CoreMarkets } from "../target/types/core_markets";

async function createMarket(program: Program<CoreMarkets>, marketIdNum: number, title: string, description: string) {
  const marketId = new anchor.BN(marketIdNum);

  // Derive market PDA
  const [marketPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  console.log(`\n🎯 Creating Market #${marketIdNum}`);
  console.log(`   PDA: ${marketPda.toBase58()}`);

  // Check if exists
  try {
    await program.account.market.fetch(marketPda);
    console.log(`   ⚠️  Market #${marketIdNum} already exists!`);
    return;
  } catch (e) {
    console.log(`   ✅ Market doesn't exist, creating...`);
  }

  // Set end date to 30 days from now
  const endDate = new anchor.BN(Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60));

  try {
    const tx = await program.methods
      .createMarket(marketId, title, description, endDate)
      .rpc();

    console.log(`   ✅ Created! TX: ${tx}`);

    // Wait for confirmation
    await program.provider.connection.confirmTransaction(tx, "confirmed");

    const market = await program.account.market.fetch(marketPda);
    console.log(`   📊 Yes Pool: ${market.yesPool.toString()} | No Pool: ${market.noPool.toString()}`);
    console.log(`   🔗 https://explorer.solana.com/address/${marketPda.toBase58()}?cluster=devnet`);

  } catch (error: any) {
    console.error(`   ❌ Failed:`, error.message);
    if (error.logs) {
      error.logs.forEach((log: string) => console.error(`      ${log}`));
    }
  }
}

async function main() {
  console.log("🚀 Creating Markets #1 and #2 on Devnet\n");

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CoreMarkets as Program<CoreMarkets>;
  const wallet = provider.wallet as anchor.Wallet;

  console.log(`💼 Wallet: ${wallet.publicKey.toBase58()}`);
  console.log(`📦 Program: ${program.programId.toBase58()}`);

  // Create Market #1
  await createMarket(
    program,
    1,
    "Will BTC reach $100k by Q1 2025?",
    "This market resolves to YES if Bitcoin trades at or above $100,000 USD on any major exchange before March 31, 2025 23:59:59 UTC."
  );

  // Create Market #2
  await createMarket(
    program,
    2,
    "Will ETH reach $5k by Q2 2025?",
    "This market resolves to YES if Ethereum trades at or above $5,000 USD on any major exchange before June 30, 2025 23:59:59 UTC."
  );

  console.log("\n🎉 Done! Markets ready for betting!");
}

main().catch(console.error);
