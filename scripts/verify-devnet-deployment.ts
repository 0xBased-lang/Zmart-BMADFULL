#!/usr/bin/env ts-node
/**
 * BMAD-Zmart Devnet Deployment Verification Script
 *
 * Verifies that all programs are deployed and ready for initialization.
 *
 * Usage:
 *   npx ts-node scripts/verify-devnet-deployment.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

interface ProgramInfo {
  name: string;
  programId: PublicKey;
  idlPath: string;
}

const DEVNET_RPC = "https://api.devnet.solana.com";

async function loadProgramIds(): Promise<ProgramInfo[]> {
  const anchorToml = fs.readFileSync("Anchor.toml", "utf-8");
  const programIds: ProgramInfo[] = [];

  // Parse program IDs from Anchor.toml
  const programs = [
    { name: "parameter_storage", idl: "parameter_storage" },
    { name: "core_markets", idl: "core_markets" },
    { name: "market_resolution", idl: "market_resolution" },
    { name: "proposal_system", idl: "proposal_system" },
    { name: "bond_manager", idl: "bond_manager" },
  ];

  for (const prog of programs) {
    const regex = new RegExp(`${prog.name}\\s*=\\s*"([A-Za-z0-9]+)"`, "i");
    const match = anchorToml.match(regex);

    if (match && match[1]) {
      programIds.push({
        name: prog.name,
        programId: new PublicKey(match[1]),
        idlPath: `target/idl/${prog.idl}.json`,
      });
    }
  }

  return programIds;
}

async function verifyProgramDeployment(
  connection: Connection,
  program: ProgramInfo
): Promise<boolean> {
  try {
    const accountInfo = await connection.getAccountInfo(program.programId);

    if (!accountInfo) {
      console.log(`❌ ${program.name}: NOT DEPLOYED`);
      return false;
    }

    if (!accountInfo.executable) {
      console.log(`❌ ${program.name}: Account exists but not executable`);
      return false;
    }

    // Check if IDL exists
    const idlExists = fs.existsSync(program.idlPath);

    console.log(
      `✅ ${program.name}: Deployed at ${program.programId.toBase58()}`
    );
    if (!idlExists) {
      console.log(`   ⚠️  Warning: IDL not found at ${program.idlPath}`);
    }

    return true;
  } catch (error) {
    console.log(`❌ ${program.name}: Error verifying - ${error}`);
    return false;
  }
}

async function checkParameterInitialization(
  connection: Connection,
  programId: PublicKey
): Promise<boolean> {
  try {
    // Derive parameter storage PDA
    const [parameterStoragePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("parameters")],
      programId
    );

    const accountInfo = await connection.getAccountInfo(parameterStoragePda);

    if (!accountInfo) {
      console.log(`⏳ Parameters: NOT YET INITIALIZED`);
      console.log(`   Expected PDA: ${parameterStoragePda.toBase58()}`);
      return false;
    }

    console.log(`✅ Parameters: INITIALIZED`);
    console.log(`   PDA: ${parameterStoragePda.toBase58()}`);
    console.log(`   Data length: ${accountInfo.data.length} bytes`);

    return true;
  } catch (error) {
    console.log(`❌ Parameters: Error checking - ${error}`);
    return false;
  }
}

async function main() {
  console.log("🔍 BMAD-Zmart Devnet Deployment Verification\n");
  console.log(`RPC Endpoint: ${DEVNET_RPC}\n`);

  const connection = new Connection(DEVNET_RPC, "confirmed");

  // Load program IDs
  console.log("📋 Loading program IDs from Anchor.toml...\n");
  const programs = await loadProgramIds();

  if (programs.length === 0) {
    console.log("❌ No programs found in Anchor.toml");
    process.exit(1);
  }

  // Verify deployments
  console.log("🔍 Verifying program deployments...\n");
  let allDeployed = true;

  for (const program of programs) {
    const deployed = await verifyProgramDeployment(connection, program);
    if (!deployed) {
      allDeployed = false;
    }
  }

  console.log("\n" + "=".repeat(70) + "\n");

  // Check parameter initialization
  const parameterProgram = programs.find(
    (p) => p.name === "parameter_storage"
  );

  if (parameterProgram) {
    console.log("🔍 Checking parameter initialization...\n");
    const initialized = await checkParameterInitialization(
      connection,
      parameterProgram.programId
    );

    console.log("\n" + "=".repeat(70) + "\n");

    // Final status
    if (!allDeployed) {
      console.log("❌ DEPLOYMENT STATUS: INCOMPLETE");
      console.log(
        "\n⚠️  Some programs are not deployed. Run 'anchor deploy' to deploy."
      );
      process.exit(1);
    } else if (!initialized) {
      console.log("✅ DEPLOYMENT STATUS: COMPLETE");
      console.log("⏳ INITIALIZATION STATUS: PENDING");
      console.log(
        "\n📝 Next step: Run initialization script to set up parameters"
      );
      console.log("   Command: ./scripts/init-devnet.sh");
      process.exit(0);
    } else {
      console.log("✅ DEPLOYMENT STATUS: COMPLETE");
      console.log("✅ INITIALIZATION STATUS: COMPLETE");
      console.log("\n🎉 System is ready for market creation and testing!");
      console.log("\n📝 Next steps:");
      console.log("   1. Create a test market: npx ts-node scripts/create-test-market.ts");
      console.log("   2. Start testing bet placement");
      process.exit(0);
    }
  } else {
    console.log("❌ parameter_storage program not found");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
