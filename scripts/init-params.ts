/**
 * Simple parameter initialization script
 * Run with: ANCHOR_PROVIDER_URL=https://api.devnet.solana.com ANCHOR_WALLET=~/.config/solana/id.json npx ts-node scripts/init-params.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ParameterStorage } from "../target/types/parameter_storage";

async function main() {
  console.log("🚀 Initializing Parameters on Devnet\n");

  // Setup provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Get program
  const program = anchor.workspace.ParameterStorage as Program<ParameterStorage>;
  const authority = provider.wallet as anchor.Wallet;

  console.log(`📋 Wallet: ${authority.publicKey.toBase58()}`);
  console.log(`📦 Program: ${program.programId.toBase58()}\n`);

  // Derive PDAs
  const [globalParametersPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("global-parameters")],
    program.programId
  );

  const [globalTogglesPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("global-toggles")],
    program.programId
  );

  console.log(`🔍 Parameters PDA: ${globalParametersPda.toBase58()}`);
  console.log(`🔍 Toggles PDA: ${globalTogglesPda.toBase58()}\n`);

  // Check if already initialized
  try {
    const params = await program.account.globalParameters.fetch(globalParametersPda);
    console.log("⚠️  Parameters already initialized!\n");
    console.log("📊 Current Values:");
    console.log(`   Authority: ${params.authority.toBase58()}`);
    console.log(`   Min Bet: ${params.minBetLamports.toString()} lamports (${params.minBetLamports.toNumber() / 1e9} SOL)`);
    console.log(`   Max Bet: ${params.maxBetLamports.toString()} lamports (${params.maxBetLamports.toNumber() / 1e9} SOL)`);
    console.log(`   Platform Fee: ${params.platformFeeBps} bps (${params.platformFeeBps / 100}%)`);
    console.log(`   Creator Fee: ${params.creatorFeeBps} bps (${params.creatorFeeBps / 100}%)`);
    console.log("\n✅ System ready for market creation!");
    return;
  } catch (e) {
    // Not initialized - proceed
    console.log("🔨 Initializing parameters...\n");
  }

  try {
    const tx = await program.methods
      .initializeParameters()
      .rpc();

    console.log(`✅ Initialization successful!`);
    console.log(`   TX: ${tx}\n`);

    // Fetch and display
    const params = await program.account.globalParameters.fetch(globalParametersPda);
    console.log("📊 Initialized Parameters:");
    console.log(`   Authority: ${params.authority.toBase58()}`);
    console.log(`   Creation Bond: ${params.creationBondLamports.toString()} lamports`);
    console.log(`   Platform Fee: ${params.platformFeeBps} bps`);
    console.log(`   Creator Fee: ${params.creatorFeeBps} bps`);
    console.log(`   Min Bet: ${params.minBetLamports.toString()} lamports`);
    console.log(`   Max Bet: ${params.maxBetLamports.toString()} lamports`);

    console.log("\n🎉 SUCCESS! Ready for market creation!");
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    if (error.logs) {
      console.error("\nProgram logs:");
      error.logs.forEach((log: string) => console.error(log));
    }
    process.exit(1);
  }
}

main().catch(console.error);
