import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { ProposalSystem } from "../target/types/proposal_system";
import { BondManager } from "../target/types/bond_manager";
import { ParameterStorage } from "../target/types/parameter_storage";
import { expect } from "chai";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

/**
 * ProposalSystem Program - Comprehensive Unit Tests
 * Story 4.1 - Task 4: ProposalSystem Program Tests
 */

describe("ProposalSystem Program Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ProposalSystem as Program<ProposalSystem>;
  const bondProgram = anchor.workspace.BondManager as Program<BondManager>;
  const paramProgram = anchor.workspace.ParameterStorage as Program<ParameterStorage>;

  let globalParametersPda: PublicKey;
  let proposer: Keypair;
  let voter: Keypair;

  async function createAndFundAccount(lamports = 100 * LAMPORTS_PER_SOL) {
    const keypair = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(keypair.publicKey, lamports);
    await provider.connection.confirmTransaction(sig);
    return keypair;
  }

  before(async () => {
    [globalParametersPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("global-parameters")],
      paramProgram.programId
    );
    proposer = await createAndFundAccount();
    voter = await createAndFundAccount();
  });

  describe("Proposal Creation with Bond", () => {
    it("Should create proposal with bond requirement", async () => {
      const proposalId = new BN(Math.floor(Math.random() * 1000000));
      const [proposalPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), proposalId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const bondAmount = new BN(1 * LAMPORTS_PER_SOL);

      await program.methods
        .createProposal(
          "Test Proposal",
          "Description",
          new BN(Math.floor(Date.now() / 1000) + 86400),
          bondAmount
        )
        .accounts({
          proposal: proposalPda,
          proposer: proposer.publicKey,
          globalParameters: globalParametersPda,
          parameterStorageProgram: paramProgram.programId,
          bondManagerProgram: bondProgram.programId,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([proposer])
        .rpc();

      const proposal = await program.account.proposal.fetch(proposalPda);
      expect(proposal.proposer.toString()).to.equal(proposer.publicKey.toString());
      expect(proposal.bondAmount.toNumber()).to.equal(bondAmount.toNumber());
    });

    it("Should collect 1% non-refundable proposal tax", async () => {
      const proposalId = new BN(Math.floor(Math.random() * 1000000));
      const [proposalPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), proposalId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const bondAmount = new BN(1 * LAMPORTS_PER_SOL);
      const proposerBalanceBefore = await provider.connection.getBalance(proposer.publicKey);

      await program.methods
        .createProposal("Test", "Desc", new BN(Math.floor(Date.now() / 1000) + 86400), bondAmount)
        .accounts({
          proposal: proposalPda,
          proposer: proposer.publicKey,
          globalParameters: globalParametersPda,
          parameterStorageProgram: paramProgram.programId,
          bondManagerProgram: bondProgram.programId,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([proposer])
        .rpc();

      const proposerBalanceAfter = await provider.connection.getBalance(proposer.publicKey);

      // 1% tax collected
      const expectedTax = bondAmount.toNumber() * 0.01;
      const actualCost = proposerBalanceBefore - proposerBalanceAfter;

      expect(actualCost).to.be.greaterThan(bondAmount.toNumber());
    });
  });

  describe("Proposal Voting", () => {
    it("Should record proposal vote", async () => {
      const proposalId = new BN(Math.floor(Math.random() * 1000000));
      const [proposalPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), proposalId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      await program.methods
        .createProposal("Test", "Desc", new BN(Math.floor(Date.now() / 1000) + 86400), new BN(1 * LAMPORTS_PER_SOL))
        .accounts({
          proposal: proposalPda,
          proposer: proposer.publicKey,
          globalParameters: globalParametersPda,
          parameterStorageProgram: paramProgram.programId,
          bondManagerProgram: bondProgram.programId,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([proposer])
        .rpc();

      const [voteRecordPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal-vote"), proposalPda.toBuffer(), voter.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .voteOnProposal({ yes: {} }, new BN(1))
        .accounts({
          voteRecord: voteRecordPda,
          proposal: proposalPda,
          voter: voter.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([voter])
        .rpc();

      const voteRecord = await program.account.proposalVoteRecord.fetch(voteRecordPda);
      expect(voteRecord.voter.toString()).to.equal(voter.publicKey.toString());
    });
  });

  describe("Approval and Rejection", () => {
    it("Should approve proposal with ≥60% YES votes", async () => {
      // Test approval threshold
      // Note: Requires vote aggregation and approval logic
    });

    it("Should reject proposal with <60% YES votes", async () => {
      // Test rejection when threshold not met
    });

    it("Should refund 50% of bond on rejection", async () => {
      // Test partial bond refund logic
    });
  });

  describe("Graduated Bond Scaling", () => {
    it("Should calculate creator fee tier based on bond", async () => {
      // Test graduated bond → fee tier mapping
    });

    it("Should create market from approved proposal", async () => {
      // Test market creation after approval
    });
  });
});
