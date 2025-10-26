#!/usr/bin/env ts-node
/**
 * BMAD-Zmart Test Bet Placement Script
 *
 * Places a test bet on a prediction market on devnet.
 *
 * Usage:
 *   ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
 *   ANCHOR_WALLET=~/.config/solana/id.json \
 *   npx ts-node scripts/place-test-bet.ts <market_id> [bet_side] [amount_sol]
 *
 * Examples:
 *   npx ts-node scripts/place-test-bet.ts 1730000000000 yes 0.1
 *   npx ts-node scripts/place-test-bet.ts 1730000000000 no 0.05
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CoreMarkets } from "../target/types/core_markets";

async function main() {
  console.log("💰 Placing Test Bet on Devnet\n");

  // Parse arguments
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("❌ Usage: npx ts-node scripts/place-test-bet.ts <market_id> [bet_side] [amount_sol]");
    console.error("\nExamples:");
    console.error("  npx ts-node scripts/place-test-bet.ts 1730000000000 yes 0.1");
    console.error("  npx ts-node scripts/place-test-bet.ts 1730000000000 no 0.05");
    process.exit(1);
  }

  const marketId = new anchor.BN(args[0]);
  const betSideStr = (args[1] || "yes").toLowerCase();
  const amountSol = parseFloat(args[2] || "0.05");

  if (betSideStr !== "yes" && betSideStr !== "no") {
    console.error("❌ Bet side must be 'yes' or 'no'");
    process.exit(1);
  }

  const betSide = betSideStr === "yes" ? { yes: {} } : { no: {} };
  const amountLamports = new anchor.BN(amountSol * anchor.web3.LAMPORTS_PER_SOL);

  // Setup provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Get programs
  const program = anchor.workspace.CoreMarkets as Program<CoreMarkets>;
  const parameterStorageProgram = anchor.workspace.ParameterStorage as any;
  const bettor = provider.wallet as anchor.Wallet;

  console.log(`📋 Bettor: ${bettor.publicKey.toBase58()}`);
  console.log(`📦 Program: ${program.programId.toBase58()}`);
  console.log(`🆔 Market ID: ${marketId.toString()}`);
  console.log(`🎯 Bet Side: ${betSideStr.toUpperCase()}`);
  console.log(`💵 Amount: ${amountSol} SOL (${amountLamports.toString()} lamports)\n`);

  // Derive PDAs
  const [marketPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  // Get global parameters PDA from parameter storage
  const [globalParametersPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("global-parameters")],
    parameterStorageProgram.programId
  );

  console.log(`🔍 Market PDA: ${marketPda.toBase58()}`);
  console.log(`🔍 Global Parameters PDA: ${globalParametersPda.toBase58()}\n`);

  // Check market exists and get data
  let market: any;
  try {
    market = await program.account.market.fetch(marketPda);
    console.log("📊 Market Status:");
    console.log(`   Title: ${market.title}`);
    console.log(`   Status: ${JSON.stringify(market.status)}`);
    console.log(`   End Date: ${new Date(market.endDate.toNumber() * 1000).toISOString()}`);
    console.log(`   Yes Pool: ${market.yesPool.toString()} lamports (${market.yesPool.toNumber() / anchor.web3.LAMPORTS_PER_SOL} SOL)`);
    console.log(`   No Pool: ${market.noPool.toString()} lamports (${market.noPool.toNumber() / anchor.web3.LAMPORTS_PER_SOL} SOL)`);
    console.log(`   Total Bets: ${market.totalBets.toString()}\n`);

    // Calculate current odds
    const yesPool = market.yesPool.toNumber();
    const noPool = market.noPool.toNumber();
    const totalPool = yesPool + noPool;

    if (totalPool > 0) {
      const yesOdds = (yesPool / totalPool * 100).toFixed(2);
      const noOdds = (noPool / totalPool * 100).toFixed(2);
      console.log(`📈 Current Odds:`);
      console.log(`   YES: ${yesOdds}%`);
      console.log(`   NO: ${noOdds}%\n`);
    } else {
      console.log(`📈 Current Odds: No bets placed yet (50/50)\n`);
    }

    // Check if market is active
    if (!market.status.active) {
      console.error("❌ Market is not active for betting");
      process.exit(1);
    }

    // Check if end date has passed
    const now = Math.floor(Date.now() / 1000);
    if (now >= market.endDate.toNumber()) {
      console.error("❌ Market has ended");
      process.exit(1);
    }

  } catch (error: any) {
    console.error("❌ Market not found or error fetching:", error.message);
    process.exit(1);
  }

  // Check bettor balance
  const balance = await provider.connection.getBalance(bettor.publicKey);
  console.log(`💰 Bettor Balance: ${balance / anchor.web3.LAMPORTS_PER_SOL} SOL`);

  if (balance < amountLamports.toNumber()) {
    console.error(`❌ Insufficient balance. Need ${amountSol} SOL, have ${balance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
    process.exit(1);
  }
  console.log();

  // Derive userBet PDA using market's total_bets
  const [userBetPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("user-bet"),
      marketPda.toBuffer(),
      bettor.publicKey.toBuffer(),
      market.totalBets.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );

  console.log(`🔍 User Bet PDA: ${userBetPda.toBase58()}`);
  console.log(`   (Derived using total_bets: ${market.totalBets.toString()})\n`);

  // Check for existing bet
  try {
    const existingBet = await program.account.userBet.fetch(userBetPda);
    console.log("⚠️  You already have a bet on this market!");
    console.log(`   Side: ${JSON.stringify(existingBet.betSide)}`);
    console.log(`   Amount: ${existingBet.amount.toString()} lamports (${existingBet.amount.toNumber() / anchor.web3.LAMPORTS_PER_SOL} SOL)`);
    console.log(`   Timestamp: ${new Date(existingBet.timestamp.toNumber() * 1000).toISOString()}\n`);
    return;
  } catch (e) {
    // No existing bet - proceed
    console.log("🔨 Placing bet...\n");
  }

  try {
    // Place bet with explicit accounts
    const tx = await program.methods
      .placeBet(betSide as any, amountLamports)
      .accountsPartial({
        market: marketPda,
        userBet: userBetPda,
        globalParameters: globalParametersPda,
        bettor: bettor.publicKey,
        parameterStorageProgram: parameterStorageProgram.programId,
      })
      .rpc();

    console.log(`✅ Bet placed successfully!`);
    console.log(`   TX: ${tx}\n`);

    // Wait for confirmation
    await provider.connection.confirmTransaction(tx, "confirmed");
    console.log("✅ Transaction confirmed!\n");

    // Fetch and display bet
    const userBet = await program.account.userBet.fetch(userBetPda);
    console.log("📊 Your Bet:");
    console.log(`   Market ID: ${userBet.marketId.toString()}`);
    console.log(`   Bettor: ${userBet.bettor.toBase58()}`);
    console.log(`   Side: ${JSON.stringify(userBet.betSide).toUpperCase()}`);
    console.log(`   Amount: ${userBet.amount.toString()} lamports (${userBet.amount.toNumber() / anchor.web3.LAMPORTS_PER_SOL} SOL)`);
    console.log(`   Amount to Pool: ${userBet.amountToPool.toString()} lamports`);
    console.log(`   Platform Fee: ${userBet.platformFee.toString()} lamports`);
    console.log(`   Creator Fee: ${userBet.creatorFee.toString()} lamports`);
    console.log(`   Timestamp: ${new Date(userBet.timestamp.toNumber() * 1000).toISOString()}`);
    console.log(`   Claimed: ${userBet.claimed}`);
    console.log(`   Odds at Bet: ${userBet.oddsAtBet / 100}%`);

    // Fetch updated market
    const updatedMarket = await program.account.market.fetch(marketPda);
    console.log("\n📊 Updated Market:");
    console.log(`   Yes Pool: ${updatedMarket.yesPool.toString()} lamports (${updatedMarket.yesPool.toNumber() / anchor.web3.LAMPORTS_PER_SOL} SOL)`);
    console.log(`   No Pool: ${updatedMarket.noPool.toString()} lamports (${updatedMarket.noPool.toNumber() / anchor.web3.LAMPORTS_PER_SOL} SOL)`);
    console.log(`   Total Bets: ${updatedMarket.totalBets.toString()}`);

    // Calculate new odds
    const yesPool = updatedMarket.yesPool.toNumber();
    const noPool = updatedMarket.noPool.toNumber();
    const totalPool = yesPool + noPool;

    if (totalPool > 0) {
      const yesOdds = (yesPool / totalPool * 100).toFixed(2);
      const noOdds = (noPool / totalPool * 100).toFixed(2);
      console.log(`\n📈 New Odds:`);
      console.log(`   YES: ${yesOdds}%`);
      console.log(`   NO: ${noOdds}%`);
    }

    console.log("\n🎉 SUCCESS! Your bet has been placed on devnet!");

    console.log("\n📝 Next Steps:");
    console.log(`   1. View bet on explorer: https://explorer.solana.com/address/${userBetPda.toBase58()}?cluster=devnet`);
    console.log(`   2. View market on explorer: https://explorer.solana.com/address/${marketPda.toBase58()}?cluster=devnet`);
    console.log(`   3. View transaction: https://explorer.solana.com/tx/${tx}?cluster=devnet`);

  } catch (error: any) {
    console.error("\n❌ Bet placement failed:", error.message);

    if (error.logs) {
      console.error("\n📜 Program logs:");
      error.logs.forEach((log: string) => console.error(`   ${log}`));
    }

    // Check for common errors
    if (error.message.includes("0x1")) {
      console.error("\n💡 Hint: You may not have permission or the market may be closed");
    } else if (error.message.includes("0x0")) {
      console.error("\n💡 Hint: Account initialization failed or insufficient funds");
    }

    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
