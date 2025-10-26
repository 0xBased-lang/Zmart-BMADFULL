import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ProgramRegistry } from "../target/types/program_registry";
import { expect } from "chai";

describe("program-registry", () => {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ProgramRegistry as Program<ProgramRegistry>;
  const authority = provider.wallet as anchor.Wallet;

  // PDA for registry account
  let registryPda: anchor.web3.PublicKey;
  let registryBump: number;

  before(async () => {
    // Derive the registry PDA
    [registryPda, registryBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("program-registry")],
      program.programId
    );
  });

  describe("initialize_registry", () => {
    it("Should initialize the program registry successfully", async () => {
      // Initialize the registry
      const tx = await program.methods
        .initializeRegistry()
        .accounts({
          registry: registryPda,
          authority: authority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Registry initialized, tx:", tx);

      // Fetch and verify the registry account
      const registryAccount = await program.account.programRegistry.fetch(registryPda);

      expect(registryAccount.authority.toString()).to.equal(
        authority.publicKey.toString()
      );
      expect(registryAccount.programs).to.be.an("array").that.is.empty;
      expect(registryAccount.bump).to.equal(registryBump);
    });

    it("Should fail to initialize registry twice", async () => {
      try {
        await program.methods
          .initializeRegistry()
          .accounts({
            registry: registryPda,
            authority: authority.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error) {
        // Expected: account already initialized
        expect(error).to.exist;
      }
    });
  });

  describe("register_program", () => {
    it("Should register a new program successfully", async () => {
      const programName = "test-program";
      const testProgramId = anchor.web3.Keypair.generate().publicKey;
      const version = "1.0.0";

      const tx = await program.methods
        .registerProgram(programName, testProgramId, version)
        .accounts({
          registry: registryPda,
          authority: authority.publicKey,
        })
        .rpc();

      console.log("Program registered, tx:", tx);

      // Verify registration
      const registryAccount = await program.account.programRegistry.fetch(registryPda);
      expect(registryAccount.programs).to.have.lengthOf(1);

      const entry = registryAccount.programs[0];
      expect(entry.name).to.equal(programName);
      expect(entry.programId.toString()).to.equal(testProgramId.toString());
      expect(entry.version).to.equal(version);
    });

    it("Should register multiple programs", async () => {
      const programs = [
        { name: "core-markets", version: "1.0.0" },
        { name: "parameter-storage", version: "1.0.0" },
        { name: "market-resolution", version: "1.0.0" },
      ];

      for (const prog of programs) {
        const programId = anchor.web3.Keypair.generate().publicKey;
        await program.methods
          .registerProgram(prog.name, programId, prog.version)
          .accounts({
            registry: registryPda,
            authority: authority.publicKey,
          })
          .rpc();
      }

      // Verify all programs registered
      const registryAccount = await program.account.programRegistry.fetch(registryPda);
      expect(registryAccount.programs).to.have.lengthOf(4); // 1 from previous test + 3 new
    });

    it("Should update an existing program", async () => {
      const programName = "test-program";
      const newProgramId = anchor.web3.Keypair.generate().publicKey;
      const newVersion = "2.0.0";

      await program.methods
        .registerProgram(programName, newProgramId, newVersion)
        .accounts({
          registry: registryPda,
          authority: authority.publicKey,
        })
        .rpc();

      // Verify update
      const registryAccount = await program.account.programRegistry.fetch(registryPda);
      const entry = registryAccount.programs.find((p) => p.name === programName);

      expect(entry).to.exist;
      expect(entry!.programId.toString()).to.equal(newProgramId.toString());
      expect(entry!.version).to.equal(newVersion);
      // Should still have 4 programs (not 5)
      expect(registryAccount.programs).to.have.lengthOf(4);
    });

    it("Should fail with invalid program name (empty)", async () => {
      try {
        await program.methods
          .registerProgram("", anchor.web3.Keypair.generate().publicKey, "1.0.0")
          .accounts({
            registry: registryPda,
            authority: authority.publicKey,
          })
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.error.errorCode.code).to.equal("InvalidProgramName");
      }
    });

    it("Should fail with invalid program name (too long)", async () => {
      try {
        const longName = "a".repeat(33);
        await program.methods
          .registerProgram(longName, anchor.web3.Keypair.generate().publicKey, "1.0.0")
          .accounts({
            registry: registryPda,
            authority: authority.publicKey,
          })
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.error.errorCode.code).to.equal("InvalidProgramName");
      }
    });

    it("Should fail with invalid version (empty)", async () => {
      try {
        await program.methods
          .registerProgram("test", anchor.web3.Keypair.generate().publicKey, "")
          .accounts({
            registry: registryPda,
            authority: authority.publicKey,
          })
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.error.errorCode.code).to.equal("InvalidVersion");
      }
    });

    it("Should fail when called by non-authority", async () => {
      const unauthorized = anchor.web3.Keypair.generate();

      // Airdrop SOL to unauthorized account
      const airdropSignature = await provider.connection.requestAirdrop(
        unauthorized.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSignature);

      try {
        await program.methods
          .registerProgram("test", anchor.web3.Keypair.generate().publicKey, "1.0.0")
          .accounts({
            registry: registryPda,
            authority: unauthorized.publicKey,
          })
          .signers([unauthorized])
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.error.errorCode.code).to.equal("Unauthorized");
      }
    });
  });

  describe("get_program_address", () => {
    it("Should get program address successfully", async () => {
      const programName = "test-program";

      // Call the view function
      const result = await program.methods
        .getProgramAddress(programName)
        .accounts({
          registry: registryPda,
        })
        .view();

      // Verify it returns the correct address
      const registryAccount = await program.account.programRegistry.fetch(registryPda);
      const entry = registryAccount.programs.find((p) => p.name === programName);

      expect(result.toString()).to.equal(entry!.programId.toString());
    });

    it("Should fail to get non-existent program", async () => {
      try {
        await program.methods
          .getProgramAddress("non-existent-program")
          .accounts({
            registry: registryPda,
          })
          .view();

        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.error.errorCode.code).to.equal("ProgramNotFound");
      }
    });

    it("Should get all registered programs", async () => {
      const registryAccount = await program.account.programRegistry.fetch(registryPda);

      console.log("\nRegistered Programs:");
      console.log("===================");
      registryAccount.programs.forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.name} v${entry.version}`);
        console.log(`   Address: ${entry.programId.toString()}`);
      });
      console.log(`\nTotal: ${registryAccount.programs.length} programs`);

      expect(registryAccount.programs.length).to.be.greaterThan(0);
    });
  });

  describe("Edge Cases and Stress Tests", () => {
    it("Should handle semantic versioning correctly", async () => {
      const testCases = [
        { name: "semver-test-1", version: "0.1.0" },
        { name: "semver-test-2", version: "1.0.0-alpha" },
        { name: "semver-test-3", version: "2.5.3-beta.1" },
      ];

      for (const tc of testCases) {
        await program.methods
          .registerProgram(tc.name, anchor.web3.Keypair.generate().publicKey, tc.version)
          .accounts({
            registry: registryPda,
            authority: authority.publicKey,
          })
          .rpc();
      }

      const registryAccount = await program.account.programRegistry.fetch(registryPda);
      for (const tc of testCases) {
        const entry = registryAccount.programs.find((p) => p.name === tc.name);
        expect(entry).to.exist;
        expect(entry!.version).to.equal(tc.version);
      }
    });

    it("Should handle maximum name length", async () => {
      const maxName = "a".repeat(32);
      await program.methods
        .registerProgram(maxName, anchor.web3.Keypair.generate().publicKey, "1.0.0")
        .accounts({
          registry: registryPda,
          authority: authority.publicKey,
        })
        .rpc();

      const registryAccount = await program.account.programRegistry.fetch(registryPda);
      const entry = registryAccount.programs.find((p) => p.name === maxName);
      expect(entry).to.exist;
    });

    it("Should handle maximum version length", async () => {
      const maxVersion = "9".repeat(16);
      await program.methods
        .registerProgram("max-version-test", anchor.web3.Keypair.generate().publicKey, maxVersion)
        .accounts({
          registry: registryPda,
          authority: authority.publicKey,
        })
        .rpc();

      const registryAccount = await program.account.programRegistry.fetch(registryPda);
      const entry = registryAccount.programs.find((p) => p.name === "max-version-test");
      expect(entry).to.exist;
      expect(entry!.version).to.equal(maxVersion);
    });
  });
});
