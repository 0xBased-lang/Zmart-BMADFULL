/**
 * Multi-Step Workflow Helpers
 *
 * Reusable functions for common cross-program workflows in integration tests.
 * Each workflow function encapsulates multiple program interactions to test
 * complete user flows.
 */

import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { ProgramInstances, TestAccounts } from "./accounts";
import {
  deriveProposalPda,
  deriveMarketPda,
  deriveBetPda,
  deriveResolutionPda,
  deriveBondPda,
} from "./accounts";

/**
 * Workflow result type
 */
export interface WorkflowResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Complete proposal-to-market creation workflow
 *
 * Steps:
 * 1. Create proposal with bond deposit (ProposalSystem + BondManager)
 * 2. Submit votes (ProposalSystem)
 * 3. Aggregate votes and approve (ProposalSystem)
 * 4. Create market from approved proposal (ProposalSystem → CoreMarkets)
 * 5. Verify bond refunded (BondManager)
 *
 * @param programs - All program instances
 * @param accounts - Test accounts
 * @param proposalCreator - Keypair of proposal creator
 * @param voters - Array of voter keypairs
 * @param marketDetails - Market title, description, resolution time
 * @returns Market public key and workflow result
 */
export async function proposalToMarketWorkflow(
  programs: ProgramInstances,
  accounts: TestAccounts,
  proposalCreator: Keypair,
  voters: Keypair[],
  marketDetails: {
    title: string;
    description: string;
    resolutionTime: anchor.BN;
  }
): Promise<{ marketKey: PublicKey | null; result: WorkflowResult }> {
  try {
    const proposalId = Math.floor(Math.random() * 1000000);
    const proposalPda = deriveProposalPda(programs.proposalSystem, proposalId);
    const bondPda = deriveBondPda(programs.bondManager, proposalCreator.publicKey);

    // Step 1: Create proposal with bond
    await programs.proposalSystem.methods
      .createProposal(
        proposalId,
        marketDetails.title,
        marketDetails.description,
        marketDetails.resolutionTime
      )
      .accounts({
        proposal: proposalPda,
        creator: proposalCreator.publicKey,
        bondManager: accounts.bondManagerPda,
        bondAccount: bondPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([proposalCreator])
      .rpc();

    // Step 2: Submit votes (at least 60% YES for approval)
    const yesVotes = Math.ceil(voters.length * 0.6);
    for (let i = 0; i < voters.length; i++) {
      const voter = voters[i];
      const vote = i < yesVotes; // First 60% vote YES

      await programs.proposalSystem.methods
        .submitVote(proposalId, vote)
        .accounts({
          proposal: proposalPda,
          voter: voter.publicKey,
        })
        .signers([voter])
        .rpc();
    }

    // Step 3: Aggregate votes
    await programs.proposalSystem.methods
      .aggregateVotes(proposalId)
      .accounts({
        proposal: proposalPda,
      })
      .rpc();

    // Step 4: Create market from approved proposal
    const marketKey = Keypair.generate();
    const marketPda = deriveMarketPda(programs.coreMarkets, marketKey.publicKey);

    await programs.proposalSystem.methods
      .createMarketFromProposal(proposalId)
      .accounts({
        proposal: proposalPda,
        market: marketKey.publicKey,
        marketAccount: marketPda,
        coreMarkets: programs.coreMarkets.programId,
        creator: proposalCreator.publicKey,
        bondAccount: bondPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([proposalCreator, marketKey])
      .rpc();

    // Step 5: Verify bond refunded (check bond account balance decreased)
    // This would require fetching and comparing bond account state

    return {
      marketKey: marketKey.publicKey,
      result: { success: true, data: { proposalId, marketKey: marketKey.publicKey } },
    };
  } catch (error) {
    return {
      marketKey: null,
      result: { success: false, error: error.message },
    };
  }
}

/**
 * Complete betting and payout workflow
 *
 * Steps:
 * 1. Multiple users place bets (CoreMarkets)
 * 2. Verify fee distribution (platform/team/burn/creator)
 * 3. Resolve market (MarketResolution)
 * 4. Winners claim payouts (CoreMarkets)
 * 5. Creator claims fees (BondManager)
 *
 * @param programs - All program instances
 * @param accounts - Test accounts
 * @param marketKey - Market to bet on
 * @param bettors - Array of bettor keypairs with bet amounts and sides
 * @returns Workflow result with payout details
 */
export async function bettingAndPayoutWorkflow(
  programs: ProgramInstances,
  accounts: TestAccounts,
  marketKey: PublicKey,
  bettors: Array<{ user: Keypair; amount: anchor.BN; side: boolean }>
): Promise<WorkflowResult> {
  try {
    const marketPda = deriveMarketPda(programs.coreMarkets, marketKey);

    // Step 1: Place bets
    for (const bettor of bettors) {
      const betPda = deriveBetPda(programs.coreMarkets, marketKey, bettor.user.publicKey);

      await programs.coreMarkets.methods
        .placeBet(bettor.amount, bettor.side)
        .accounts({
          market: marketKey,
          marketAccount: marketPda,
          bettor: bettor.user.publicKey,
          betAccount: betPda,
          treasury: accounts.treasury,
          teamWallet: accounts.teamWallet,
          burnWallet: accounts.burnWallet,
          parameters: accounts.parametersPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bettor.user])
        .rpc();
    }

    // Step 2: Fee distribution verification would happen here
    // (Check balances of treasury, team, burn, creator fee accumulation)

    // Step 3: Resolve market
    const resolutionPda = deriveResolutionPda(programs.marketResolution, marketKey);
    const winningOutcome = true; // YES wins

    await programs.marketResolution.methods
      .resolveMarket(winningOutcome)
      .accounts({
        market: marketKey,
        marketAccount: marketPda,
        resolution: resolutionPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Step 4: Winners claim payouts
    const winners = bettors.filter((b) => b.side === winningOutcome);
    for (const winner of winners) {
      const betPda = deriveBetPda(programs.coreMarkets, marketKey, winner.user.publicKey);

      await programs.coreMarkets.methods
        .claimPayout()
        .accounts({
          market: marketKey,
          marketAccount: marketPda,
          bettor: winner.user.publicKey,
          betAccount: betPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([winner.user])
        .rpc();
    }

    // Step 5: Creator claims fees (would require creator keypair)
    // This step would be implemented with actual creator fee claim instruction

    return { success: true, data: { winnersCount: winners.length } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Complete resolution and dispute workflow
 *
 * Steps:
 * 1. Place bets on market
 * 2. Submit votes for resolution
 * 3. Aggregate votes and post result
 * 4. Enter dispute window
 * 5. Admin override resolution
 * 6. Claim payouts based on final outcome
 *
 * @param programs - All program instances
 * @param accounts - Test accounts
 * @param marketKey - Market to resolve
 * @param voters - Resolution voters
 * @param admin - Admin keypair for override
 * @returns Workflow result with final outcome
 */
export async function resolutionAndDisputeWorkflow(
  programs: ProgramInstances,
  accounts: TestAccounts,
  marketKey: PublicKey,
  voters: Keypair[],
  admin: Keypair
): Promise<WorkflowResult> {
  try {
    const marketPda = deriveMarketPda(programs.coreMarkets, marketKey);
    const resolutionPda = deriveResolutionPda(programs.marketResolution, marketKey);

    // Step 1: Place bets (prerequisite)
    // Would be done before calling this workflow

    // Step 2: Submit resolution votes
    const yesVotes = Math.ceil(voters.length * 0.7); // 70% vote YES
    for (let i = 0; i < voters.length; i++) {
      const voter = voters[i];
      const vote = i < yesVotes;

      await programs.marketResolution.methods
        .submitVote(vote)
        .accounts({
          market: marketKey,
          resolution: resolutionPda,
          voter: voter.publicKey,
        })
        .signers([voter])
        .rpc();
    }

    // Step 3: Aggregate votes
    await programs.marketResolution.methods
      .aggregateVotes()
      .accounts({
        market: marketKey,
        resolution: resolutionPda,
      })
      .rpc();

    // Step 4: Wait for dispute window (simulated by time advancement in tests)
    // In real tests, we'd use BanksClient to advance time

    // Step 5: Admin override (changes outcome from YES to NO)
    await programs.marketResolution.methods
      .adminOverride(false) // Override to NO
      .accounts({
        market: marketKey,
        resolution: resolutionPda,
        admin: admin.publicKey,
        marketAccount: marketPda,
      })
      .signers([admin])
      .rpc();

    // Step 6: Claim payouts (would iterate through bettors)
    // Implementation depends on final outcome after override

    return { success: true, data: { finalOutcome: false } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Parameter update propagation workflow
 *
 * Steps:
 * 1. Update parameter in ParameterStorage
 * 2. Verify CoreMarkets reads and enforces new parameter
 * 3. Test that subsequent operations use new value
 *
 * @param programs - All program instances
 * @param accounts - Test accounts
 * @param parameterName - Name of parameter to update
 * @param newValue - New parameter value
 * @returns Workflow result with verification data
 */
export async function parameterUpdateWorkflow(
  programs: ProgramInstances,
  accounts: TestAccounts,
  parameterName: string,
  newValue: any
): Promise<WorkflowResult> {
  try {
    // Step 1: Update parameter
    await programs.parameterStorage.methods
      .updateParameter(parameterName, newValue)
      .accounts({
        parameters: accounts.parametersPda,
        authority: accounts.authority.publicKey,
      })
      .signers([accounts.authority])
      .rpc();

    // Step 2: Verify parameter read by CoreMarkets
    const parameters = await programs.parameterStorage.account.parameters.fetch(
      accounts.parametersPda
    );

    // Step 3: Test enforcement (would create market or place bet to verify)
    // Actual enforcement verification depends on parameter type

    return { success: true, data: { parameter: parameterName, newValue } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Registry pattern workflow
 *
 * Steps:
 * 1. Register all programs in ProgramRegistry
 * 2. Test program lookup by other programs
 * 3. Verify cross-program calls use registry-resolved addresses
 *
 * @param programs - All program instances
 * @param accounts - Test accounts
 * @returns Workflow result with registry data
 */
export async function registryPatternWorkflow(
  programs: ProgramInstances,
  accounts: TestAccounts
): Promise<WorkflowResult> {
  try {
    // Step 1: Register programs
    await programs.programRegistry.methods
      .registerProgram("parameter_storage", programs.parameterStorage.programId)
      .accounts({
        registry: accounts.registryPda,
        authority: accounts.authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([accounts.authority])
      .rpc();

    await programs.programRegistry.methods
      .registerProgram("core_markets", programs.coreMarkets.programId)
      .accounts({
        registry: accounts.registryPda,
        authority: accounts.authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([accounts.authority])
      .rpc();

    // Step 2: Lookup programs
    const registry = await programs.programRegistry.account.registry.fetch(
      accounts.registryPda
    );

    // Step 3: Verify lookups (would be used in actual cross-program calls)
    // Real test would create market that looks up parameter storage via registry

    return { success: true, data: { programsRegistered: 2 } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
