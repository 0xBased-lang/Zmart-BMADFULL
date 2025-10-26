/**
 * Rapid Bet Test - Place 10 sequential bets rapidly
 * Tests state consistency under rapid sequential operations
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CoreMarkets } from "../target/types/core_markets";

async function rapidBetTest() {
  console.log("\n🚀 Rapid Bet Test - 10 Sequential Bets\n");

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CoreMarkets as Program<CoreMarkets>;

  const marketId = new anchor.BN(1761401939440);

  console.log(`📊 Market ID: ${marketId.toString()}`);
  console.log(`🎯 Placing 10 bets of 0.01 SOL each (alternating YES/NO)\n`);

  const results: any[] = [];

  for (let i = 0; i < 10; i++) {
    const betSide = i % 2 === 0 ? "yes" : "no";
    const amount = 0.01;

    console.log(`📍 Bet ${i + 1}/10: ${betSide.toUpperCase()} ${amount} SOL...`);

    try {
      const betSideEnum = betSide === "yes" ? { yes: {} } : { no: {} };
      const amountLamports = new anchor.BN(amount * anchor.web3.LAMPORTS_PER_SOL);

      const [marketPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Fetch current total_bets to derive UserBet PDA
      const marketAccount = await program.account.market.fetch(marketPda);
      const currentTotalBets = marketAccount.totalBets.toNumber();

      const totalBetsBN = new anchor.BN(currentTotalBets);
      const [userBetPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user-bet"),
          marketPda.toBuffer(),
          provider.wallet.publicKey.toBuffer(),
          totalBetsBN.toArrayLike(Buffer, "le", 8)
        ],
        program.programId
      );

      const [globalParamsPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("global-parameters")],
        new anchor.web3.PublicKey("J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD")
      );

      const startTime = Date.now();

      const tx = await program.methods
        .placeBet(betSideEnum, amountLamports)
        .accounts({
          market: marketPda,
          userBet: userBetPda,
          bettor: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          globalParameters: globalParamsPda,
          parameterStorageProgram: new anchor.web3.PublicKey("J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD"),
        })
        .rpc();

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`   ✅ Success! TX: ${tx.substring(0, 20)}... (${duration}ms)\n`);

      results.push({
        betNumber: i + 1,
        side: betSide,
        amount,
        tx,
        duration,
        totalBetsAtStart: currentTotalBets,
        success: true
      });

    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}\n`);
      results.push({
        betNumber: i + 1,
        side: betSide,
        amount,
        error: error.message,
        success: false
      });
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("📊 RAPID BET TEST RESULTS");
  console.log("=".repeat(70) + "\n");

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}/10`);
  console.log(`❌ Failed: ${failed.length}/10`);

  if (successful.length > 0) {
    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    console.log(`⏱️  Average Duration: ${avgDuration.toFixed(0)}ms`);
  }

  console.log(`\n📋 Detailed Results:`);
  results.forEach(r => {
    if (r.success) {
      console.log(`   ${r.betNumber}. ✅ ${r.side.toUpperCase()} ${r.amount} SOL - ${r.duration}ms - total_bets: ${r.totalBetsAtStart}`);
    } else {
      console.log(`   ${r.betNumber}. ❌ ${r.side.toUpperCase()} ${r.amount} SOL - ${r.error}`);
    }
  });

  console.log("\n" + "=".repeat(70) + "\n");

  return results;
}

rapidBetTest().catch(console.error);
