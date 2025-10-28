/**
 * Multi-Program Account Management Utilities
 *
 * Provides helper functions for managing accounts across multiple Solana programs
 * in integration tests. Handles PDA derivation, account initialization, and
 * state verification for cross-program workflows.
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { CoreMarkets } from "../../../target/types/core_markets";
import { ParameterStorage } from "../../../target/types/parameter_storage";
import { MarketResolution } from "../../../target/types/market_resolution";
import { ProposalSystem } from "../../../target/types/proposal_system";
import { BondManager } from "../../../target/types/bond_manager";
import { ProgramRegistry } from "../../../target/types/program_registry";

/**
 * Program instances for integration testing
 */
export interface ProgramInstances {
  coreMarkets: Program<CoreMarkets>;
  parameterStorage: Program<ParameterStorage>;
  marketResolution: Program<MarketResolution>;
  proposalSystem: Program<ProposalSystem>;
  bondManager: Program<BondManager>;
  programRegistry: Program<ProgramRegistry>;
  provider: AnchorProvider;
}

/**
 * Test account set with all program-related PDAs
 */
export interface TestAccounts {
  authority: Keypair;
  parametersPda: PublicKey;
  registryPda: PublicKey;
  bondManagerPda: PublicKey;
  treasury: PublicKey;
  teamWallet: PublicKey;
  burnWallet: PublicKey;
}

/**
 * Initialize all program instances for integration testing
 */
export async function initializePrograms(provider: AnchorProvider): Promise<ProgramInstances> {
  const coreMarkets = anchor.workspace.CoreMarkets as Program<CoreMarkets>;
  const parameterStorage = anchor.workspace.ParameterStorage as Program<ParameterStorage>;
  const marketResolution = anchor.workspace.MarketResolution as Program<MarketResolution>;
  const proposalSystem = anchor.workspace.ProposalSystem as Program<ProposalSystem>;
  const bondManager = anchor.workspace.BondManager as Program<BondManager>;
  const programRegistry = anchor.workspace.ProgramRegistry as Program<ProgramRegistry>;

  return {
    coreMarkets,
    parameterStorage,
    marketResolution,
    proposalSystem,
    bondManager,
    programRegistry,
    provider,
  };
}

/**
 * Set up all common test accounts and PDAs
 */
export async function setupTestAccounts(
  programs: ProgramInstances
): Promise<TestAccounts> {
  const provider = programs.provider;
  const authority = (provider.wallet as any).payer as Keypair;

  // Derive parameters PDA
  const [parametersPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("parameters")],
    programs.parameterStorage.programId
  );

  // Derive program registry PDA
  const [registryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("program_registry")],
    programs.programRegistry.programId
  );

  // Derive bond manager PDA
  const [bondManagerPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("bond_manager")],
    programs.bondManager.programId
  );

  // Create fee collection wallets
  const treasury = Keypair.generate().publicKey;
  const teamWallet = Keypair.generate().publicKey;
  const burnWallet = Keypair.generate().publicKey;

  return {
    authority,
    parametersPda,
    registryPda,
    bondManagerPda,
    treasury,
    teamWallet,
    burnWallet,
  };
}

/**
 * Fund a test account with SOL
 */
export async function fundAccount(
  provider: AnchorProvider,
  account: PublicKey,
  lamports: number
): Promise<void> {
  const tx = await provider.connection.requestAirdrop(account, lamports);
  await provider.connection.confirmTransaction(tx);
}

/**
 * Create and fund a new test user
 */
export async function createTestUser(
  provider: AnchorProvider,
  lamports: number = 10 * LAMPORTS_PER_SOL
): Promise<Keypair> {
  const user = Keypair.generate();
  await fundAccount(provider, user.publicKey, lamports);
  return user;
}

/**
 * Derive market PDA for a given market account
 */
export function deriveMarketPda(
  coreMarketsProgram: Program<CoreMarkets>,
  marketKey: PublicKey
): PublicKey {
  const [marketPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("market"), marketKey.toBuffer()],
    coreMarketsProgram.programId
  );
  return marketPda;
}

/**
 * Derive proposal PDA
 */
export function deriveProposalPda(
  proposalSystemProgram: Program<ProposalSystem>,
  proposalId: number
): PublicKey {
  const [proposalPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("proposal"),
      new anchor.BN(proposalId).toArrayLike(Buffer, "le", 8),
    ],
    proposalSystemProgram.programId
  );
  return proposalPda;
}

/**
 * Derive bet PDA for a user on a market
 */
export function deriveBetPda(
  coreMarketsProgram: Program<CoreMarkets>,
  marketKey: PublicKey,
  user: PublicKey
): PublicKey {
  const [betPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("bet"), marketKey.toBuffer(), user.toBuffer()],
    coreMarketsProgram.programId
  );
  return betPda;
}

/**
 * Derive resolution PDA for a market
 */
export function deriveResolutionPda(
  marketResolutionProgram: Program<MarketResolution>,
  marketKey: PublicKey
): PublicKey {
  const [resolutionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("resolution"), marketKey.toBuffer()],
    marketResolutionProgram.programId
  );
  return resolutionPda;
}

/**
 * Derive bond account PDA for a proposal creator
 */
export function deriveBondPda(
  bondManagerProgram: Program<BondManager>,
  creator: PublicKey
): PublicKey {
  const [bondPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("bond"), creator.toBuffer()],
    bondManagerProgram.programId
  );
  return bondPda;
}

/**
 * Get account balance in lamports
 */
export async function getBalance(
  provider: AnchorProvider,
  account: PublicKey
): Promise<number> {
  return await provider.connection.getBalance(account);
}

/**
 * Wait for account to exist (useful after account initialization)
 */
export async function waitForAccount(
  provider: AnchorProvider,
  account: PublicKey,
  timeoutMs: number = 30000
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const accountInfo = await provider.connection.getAccountInfo(account);
    if (accountInfo !== null) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Account ${account.toBase58()} not found after ${timeoutMs}ms`);
}

/**
 * Clean up test accounts (close accounts to reclaim rent)
 */
export async function cleanupAccounts(
  provider: AnchorProvider,
  accounts: PublicKey[]
): Promise<void> {
  // Note: Actual account closing would require program-specific instructions
  // This is a placeholder for cleanup logic
  console.log(`Cleaning up ${accounts.length} test accounts...`);
}
