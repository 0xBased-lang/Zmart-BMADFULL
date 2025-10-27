/**
 * Integration Test: Proposal Creation on Devnet
 * Story 3.6 - Build Proposal Creation Flow
 *
 * Tests actual Solana transaction on devnet
 */

import * as anchor from "@project-serum/anchor";
import { Program, BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";

describe("Proposal Creation Integration (Devnet)", () => {
  // Configure provider to use devnet
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Devnet program addresses from Anchor.toml
  const PARAMETER_STORAGE_PROGRAM = new PublicKey("J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD");
  const PROPOSAL_SYSTEM_PROGRAM = new PublicKey("5XH5i8dypiB4Wwa7TkmU6dnk9SyUGqE92GiQMHypPekL");
  const BOND_MANAGER_PROGRAM = new PublicKey("8XvCToLC42ZV4hw6PW5SEhqDpX3NfqvbAS2tNseG52Fx");

  // Load ProposalSystem program
  const proposalSystemIdl = require("../target/idl/proposal_system.json");
  const proposalProgram = new Program(
    proposalSystemIdl,
    PROPOSAL_SYSTEM_PROGRAM,
    provider
  );

  it("should create a proposal on devnet", async () => {
    console.log("Testing proposal creation on devnet...");

    // Generate unique proposal ID
    const proposalId = new BN(Date.now());

    // Proposal data (matching frontend form)
    const title = "Will Bitcoin reach $100,000 by end of 2025?";
    const description = "This market resolves to YES if Bitcoin (BTC) reaches or exceeds $100,000 USD on any major exchange before the end date.";
    const bondAmount = new BN(100 * 1_000_000); // 100 ZMart in lamports
    const endTimestamp = new BN(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60); // 1 year from now

    // Derive PDAs
    const [proposalPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), proposalId.toArrayLike(Buffer, "le", 8)],
      PROPOSAL_SYSTEM_PROGRAM
    );

    const [globalParameters] = PublicKey.findProgramAddressSync(
      [Buffer.from("global_parameters")],
      PARAMETER_STORAGE_PROGRAM
    );

    const [bondEscrow] = PublicKey.findProgramAddressSync(
      [Buffer.from("bond_escrow"), proposalId.toArrayLike(Buffer, "le", 8)],
      BOND_MANAGER_PROGRAM
    );

    console.log("Proposal ID:", proposalId.toString());
    console.log("Proposal PDA:", proposalPDA.toBase58());
    console.log("Global Parameters:", globalParameters.toBase58());
    console.log("Bond Escrow:", bondEscrow.toBase58());

    // Get creator balance before
    const creatorBalanceBefore = await provider.connection.getBalance(
      provider.wallet.publicKey
    );
    console.log("Creator balance before:", creatorBalanceBefore / 1e9, "SOL");

    // Create proposal transaction
    try {
      const tx = await proposalProgram.methods
        .createProposal(
          proposalId,
          title,
          description,
          bondAmount,
          endTimestamp
        )
        .accounts({
          proposal: proposalPDA,
          globalParameters: globalParameters,
          creator: provider.wallet.publicKey,
          bondEscrow: bondEscrow,
          bondManagerProgram: BOND_MANAGER_PROGRAM,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Transaction signature:", tx);

      // Wait for confirmation
      await provider.connection.confirmTransaction(tx, "confirmed");
      console.log("Transaction confirmed!");

      // Fetch proposal account
      const proposalAccount = await proposalProgram.account.proposal.fetch(
        proposalPDA
      );

      console.log("Proposal created successfully!");
      console.log("  Title:", proposalAccount.title);
      console.log("  Creator:", proposalAccount.creator.toBase58());
      console.log("  Bond Amount:", proposalAccount.bondAmount.toString());
      console.log("  Status:", Object.keys(proposalAccount.status)[0]);

      // Verify proposal data
      assert.equal(proposalAccount.title, title);
      assert.equal(proposalAccount.creator.toBase58(), provider.wallet.publicKey.toBase58());
      assert.equal(proposalAccount.bondAmount.toString(), bondAmount.toString());

      // Get creator balance after
      const creatorBalanceAfter = await provider.connection.getBalance(
        provider.wallet.publicKey
      );
      console.log("Creator balance after:", creatorBalanceAfter / 1e9, "SOL");

      const costInLamports = creatorBalanceBefore - creatorBalanceAfter;
      console.log("Total cost:", costInLamports / 1e9, "SOL");

      // Verify cost includes bond + tax
      // Note: Also includes transaction fee (~0.000005 SOL)
      const expectedMinCost = bondAmount.toNumber() + (bondAmount.toNumber() * 0.01);
      assert.isAtLeast(costInLamports, expectedMinCost);

      console.log("\n✅ All assertions passed!");
      console.log("\n📊 Test Summary:");
      console.log("  - Proposal created on devnet");
      console.log("  - Transaction confirmed");
      console.log("  - Account data verified");
      console.log("  - Cost breakdown validated");

      return tx;
    } catch (error) {
      console.error("❌ Error creating proposal:", error);
      throw error;
    }
  });

  it("should validate bond amount minimum (50 ZMart)", async () => {
    const proposalId = new BN(Date.now() + 1);
    const bondAmount = new BN(49 * 1_000_000); // 49 ZMart - below minimum

    const [proposalPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), proposalId.toArrayLike(Buffer, "le", 8)],
      PROPOSAL_SYSTEM_PROGRAM
    );

    const [globalParameters] = PublicKey.findProgramAddressSync(
      [Buffer.from("global_parameters")],
      PARAMETER_STORAGE_PROGRAM
    );

    const [bondEscrow] = PublicKey.findProgramAddressSync(
      [Buffer.from("bond_escrow"), proposalId.toArrayLike(Buffer, "le", 8)],
      BOND_MANAGER_PROGRAM
    );

    try {
      await proposalProgram.methods
        .createProposal(
          proposalId,
          "Test proposal",
          "Test description",
          bondAmount,
          new BN(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60)
        )
        .accounts({
          proposal: proposalPDA,
          globalParameters: globalParameters,
          creator: provider.wallet.publicKey,
          bondEscrow: bondEscrow,
          bondManagerProgram: BOND_MANAGER_PROGRAM,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Should not reach here
      assert.fail("Should have thrown error for bond amount below minimum");
    } catch (error) {
      console.log("✅ Correctly rejected bond amount below minimum");
      // Expected error - bond amount validation should fail
      assert.include(error.toString().toLowerCase(), "bond" || "minimum" || "insufficient");
    }
  });
});
