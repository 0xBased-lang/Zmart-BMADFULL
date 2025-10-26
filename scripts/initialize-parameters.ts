#!/usr/bin/env ts-node
/**
 * BMAD-Zmart Parameter Initialization Script
 *
 * Initializes the global parameter storage on devnet.
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import * as fs from "fs";

const DEVNET_RPC = "https://api.devnet.solana.com";

async function main() {
  console.log("🚀 BMAD-Zmart Parameter Initialization\n");

  // Setup provider
  const connection = new Connection(DEVNET_RPC, "confirmed");
  const walletPath = process.env.HOME + "/.config/solana/id.json";
  const walletKeypair = anchor.web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );

  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  console.log(`📋 Wallet: ${wallet.publicKey.toBase58()}`);

  // Load program
  const parameterStorageProgramId = new PublicKey(
    "J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD"
  );

  const idl = JSON.parse(
    fs.readFileSync("target/idl/parameter_storage.json", "utf-8")
  );

  const program = new Program(
    idl,
    provider
  ) as any;

  console.log(
    `📦 Program: ${parameterStorageProgramId.toBase58()}\n`
  );

  // Derive PDA for parameter storage
  const [parameterStoragePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("parameters")],
    program.programId
  );

  console.log(`🔍 Parameter Storage PDA: ${parameterStoragePda.toBase58()}`);

  // Check if already initialized
  try {
    const accountInfo = await connection.getAccountInfo(parameterStoragePda);
    if (accountInfo) {
      console.log(
        "\n⚠️  Parameters already initialized!"
      );
      console.log(`Account exists with ${accountInfo.data.length} bytes`);

      // Try to fetch and display parameters
      try {
        const params = await program.account.globalParameters.fetch(
          parameterStoragePda
        );
        console.log("\n📊 Current Parameters:");
        console.log(`   Authority: ${params.authority.toBase58()}`);
        console.log(`   Min Bet: ${params.minBetAmount.toString()} lamports`);
        console.log(`   Max Bet: ${params.maxBetAmount.toString()} lamports`);
        console.log(`   Platform Fee: ${params.platformFeeBps} bps`);
        console.log(`   Resolution Fee: ${params.resolutionFeeBps} bps`);
        console.log(`   Paused: ${params.paused}`);
        console.log("\n✅ Initialization complete! Ready for market creation.");
        process.exit(0);
      } catch (e) {
        console.log("\n⚠️  Could not decode parameters. May need re-initialization.");
      }
    }
  } catch (error) {
    // Account doesn't exist - proceed with initialization
  }

  console.log("\n🔨 Initializing parameters...\n");

  try {
    // Initialize parameters
    const tx = await program.methods
      .initialize(
        new anchor.BN(10_000_000), // min_bet_amount: 0.01 SOL
        new anchor.BN(10_000_000_000), // max_bet_amount: 10 SOL
        250, // platform_fee_bps: 2.5%
        100  // resolution_fee_bps: 1%
      )
      .accounts({
        globalParameters: parameterStoragePda,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(`✅ Initialization successful!`);
    console.log(`   Transaction: ${tx}`);
    console.log(`   Confirming...\n`);

    // Wait for confirmation
    await connection.confirmTransaction(tx, "confirmed");

    console.log("✅ Transaction confirmed!\n");

    // Fetch and verify
    const params = await program.account.globalParameters.fetch(
      parameterStoragePda
    );

    console.log("📊 Initialized Parameters:");
    console.log(`   Authority: ${params.authority.toBase58()}`);
    console.log(`   Min Bet: ${params.minBetAmount.toString()} lamports (0.01 SOL)`);
    console.log(`   Max Bet: ${params.maxBetAmount.toString()} lamports (10 SOL)`);
    console.log(`   Platform Fee: ${params.platformFeeBps} bps (2.5%)`);
    console.log(`   Resolution Fee: ${params.resolutionFeeBps} bps (1%)`);
    console.log(`   Paused: ${params.paused}`);

    console.log("\n🎉 SUCCESS! Parameters initialized on devnet!");
    console.log("\n📝 Next steps:");
    console.log("   1. Create test market: npx ts-node scripts/create-test-market.ts");
    console.log("   2. Test betting in the application!");

  } catch (error: any) {
    console.error("\n❌ Initialization failed:", error);

    if (error.logs) {
      console.error("\n📜 Program logs:");
      error.logs.forEach((log: string) => console.error(`   ${log}`));
    }

    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
