/**
 * Market Creation from Approved Proposals
 *
 * This service orchestrates the complete proposal → market creation workflow:
 * 1. Approve proposal on ProposalSystem program
 * 2. Create market on CoreMarkets program
 * 3. Return market ID and transaction hashes for database sync
 *
 * Following Web3 dApp best practices:
 * - Type-safe contract interactions with Anchor
 * - Comprehensive error handling and recovery
 * - Transaction confirmation with timeouts
 * - User-friendly error messages
 */

import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor'
import { getWallet } from '@/lib/solana/wallet'
import coreMarketsIdl from '@/lib/solana/idl/core_markets.json'
import proposalSystemIdl from '@/lib/solana/idl/proposal_system.json'

// Program IDs from environment (devnet)
function getCoreMarketsProgramId(): PublicKey {
  return new PublicKey(
    process.env.NEXT_PUBLIC_CORE_MARKETS_ID || '6BBZWsJZq23k2NX3YnENgXTEPhbVEHXYmPxmamN83eEV'
  )
}
const PROPOSAL_SYSTEM_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROPOSAL_SYSTEM_ID || '5XH5i8dypiB4Wwa7TkmU6dnk9SyUGqE92GiQMHypPekL'
)
function getParameterStorageProgramId(): PublicKey {
  return new PublicKey(
    process.env.NEXT_PUBLIC_PARAMETER_STORAGE_ID || 'J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD'
  )
}
function getBondManagerProgramId(): PublicKey {
  return new PublicKey(
    process.env.NEXT_PUBLIC_BOND_MANAGER_ID || '8XvCToLC42ZV4hw6PW5SEhqDpX3NfqvbAS2tNseG52Fx'
  )
}

// RPC endpoint configuration
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com'
const COMMITMENT = 'confirmed'

export interface ProposalData {
  proposal_id: number
  title: string
  description: string
  end_date: string // ISO timestamp
  creator_address: string
}

export interface CreateMarketFromProposalResult {
  success: boolean
  marketId?: number
  approvalTxHash?: string
  creationTxHash?: string
  error?: string
  errorCode?: MarketCreationErrorCode
}

export enum MarketCreationErrorCode {
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  USER_REJECTED = 'USER_REJECTED',
  VOTING_NOT_ENDED = 'VOTING_NOT_ENDED',
  INSUFFICIENT_APPROVAL = 'INSUFFICIENT_APPROVAL',
  PROPOSAL_ALREADY_PROCESSED = 'PROPOSAL_ALREADY_PROCESSED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Complete workflow: Approve proposal + Create market
 *
 * This is the main entry point for converting an approved proposal into a live market.
 * It handles both on-chain operations and provides detailed error handling.
 *
 * @param proposalData - Proposal information from Supabase
 * @param authority - Admin wallet address (must be authorized)
 * @returns Result with market ID and transaction hashes
 */
export async function createMarketFromProposal(
  proposalData: ProposalData,
  authority: PublicKey
): Promise<CreateMarketFromProposalResult> {
  console.log('🚀 Starting market creation from proposal:', proposalData.proposal_id)

  try {
    // Step 0: Validate wallet connection
    const wallet = getWallet()
    if (!wallet || !wallet.signTransaction) {
      return {
        success: false,
        error: 'Please connect your wallet',
        errorCode: MarketCreationErrorCode.WALLET_NOT_CONNECTED
      }
    }

    // Step 1: Setup connection and provider
    const connection = new Connection(RPC_ENDPOINT, COMMITMENT)
    const provider = new AnchorProvider(
      connection,
      wallet as any,
      { commitment: COMMITMENT }
    )

    // Step 2: Generate unique market ID
    const marketId = await getNextMarketId()
    console.log('📊 Generated market ID:', marketId)

    // Step 3: Approve proposal on ProposalSystem
    console.log('✅ Step 1/2: Approving proposal on-chain...')
    const approvalTxHash = await approveProposalOnChain(
      proposalData,
      marketId,
      authority,
      provider
    )
    console.log('✅ Proposal approved! Tx:', approvalTxHash)

    // Step 4: Create market on CoreMarkets
    console.log('📈 Step 2/2: Creating market on-chain...')
    const creationTxHash = await createMarketOnChain(
      proposalData,
      marketId,
      authority,
      provider
    )
    console.log('✅ Market created! Tx:', creationTxHash)

    // Step 5: Return success with data for database sync
    return {
      success: true,
      marketId,
      approvalTxHash,
      creationTxHash
    }

  } catch (error: any) {
    console.error('❌ Market creation error:', error)
    return parseMarketCreationError(error)
  }
}

/**
 * Step 3: Approve proposal on ProposalSystem program
 *
 * Calls proposal_system.approve_proposal() which:
 * - Validates ≥60% YES votes
 * - Updates proposal status to Approved
 * - Stores the market_id
 */
async function approveProposalOnChain(
  proposalData: ProposalData,
  marketId: number,
  authority: PublicKey,
  provider: AnchorProvider
): Promise<string> {

  // Initialize ProposalSystem program
  const program = new Program(proposalSystemIdl as any, provider)

  const proposalIdBN = new BN(proposalData.proposal_id)
  const marketIdBN = new BN(marketId)

  // Derive proposal PDA
  const [proposalPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('proposal'),
      proposalIdBN.toArrayLike(Buffer, 'le', 8)
    ],
    PROPOSAL_SYSTEM_PROGRAM_ID
  )

  // Build approve_proposal transaction
  const tx = await (program as any).methods
    .approveProposal(marketIdBN)
    .accounts({
      proposal: proposalPda,
      authority: authority
    })
    .transaction()

  // Sign and send
  const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash(COMMITMENT)
  tx.recentBlockhash = blockhash
  tx.feePayer = authority

  const signedTx = await provider.wallet.signTransaction!(tx)
  const signature = await provider.connection.sendRawTransaction(signedTx.serialize())

  // Confirm with timeout (30 seconds)
  const confirmation = await provider.connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight
  }, COMMITMENT)

  if (confirmation.value.err) {
    throw new Error(`Proposal approval failed: ${confirmation.value.err.toString()}`)
  }

  return signature
}

/**
 * Step 4: Create market on CoreMarkets program
 *
 * Calls core_markets.create_market() which:
 * - Initializes market PDA with proposal data
 * - Sets up liquidity pools (empty initially)
 * - Emits MarketCreatedEvent
 */
async function createMarketOnChain(
  proposalData: ProposalData,
  marketId: number,
  creator: PublicKey,
  provider: AnchorProvider
): Promise<string> {

  // Initialize CoreMarkets program
  const program = new Program(coreMarketsIdl as any, provider)

  const marketIdBN = new BN(marketId)

  // Derive PDAs
  const [marketPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('market'),
      marketIdBN.toArrayLike(Buffer, 'le', 8)
    ],
    getCoreMarketsProgramId()
  )

  // Convert end_date to Unix timestamp
  const endDate = Math.floor(new Date(proposalData.end_date).getTime() / 1000)
  const endDateBN = new BN(endDate)

  // Build create_market transaction
  // Per IDL: create_market(market_id, title, description, end_date)
  const tx = await (program as any).methods
    .createMarket(
      marketIdBN,
      proposalData.title,
      proposalData.description,
      endDateBN
    )
    .accounts({
      market: marketPda,
      creator: creator,
      systemProgram: SystemProgram.programId
    })
    .transaction()

  // Sign and send
  const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash(COMMITMENT)
  tx.recentBlockhash = blockhash
  tx.feePayer = creator

  const signedTx = await provider.wallet.signTransaction!(tx)
  const signature = await provider.connection.sendRawTransaction(signedTx.serialize())

  // Confirm with timeout
  const confirmation = await provider.connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight
  }, COMMITMENT)

  if (confirmation.value.err) {
    throw new Error(`Market creation failed: ${confirmation.value.err.toString()}`)
  }

  return signature
}

/**
 * Get next available market ID
 *
 * Strategy:
 * 1. Try to fetch from database API (ensures uniqueness)
 * 2. Fallback to timestamp if API unavailable
 */
async function getNextMarketId(): Promise<number> {
  try {
    const response = await fetch('/api/markets/next-id')
    if (response.ok) {
      const { nextId } = await response.json()
      return nextId
    }
  } catch (error) {
    console.warn('Failed to get next market ID from database, using timestamp:', error)
  }

  // Fallback: Use timestamp for uniqueness
  return Date.now()
}

/**
 * Parse errors into user-friendly messages
 *
 * Following Web3 dApp error handling best practices:
 * - Specific error codes for each failure scenario
 * - User-friendly messages (no raw blockchain errors)
 * - Differentiate between user errors and system errors
 */
function parseMarketCreationError(error: any): CreateMarketFromProposalResult {
  console.error('Parsing error:', error)

  // User rejected transaction
  if (error.message?.includes('User rejected') || error.code === 4001) {
    return {
      success: false,
      error: 'Transaction cancelled by user',
      errorCode: MarketCreationErrorCode.USER_REJECTED
    }
  }

  // Insufficient balance
  if (error.message?.includes('insufficient') || error.message?.includes('balance')) {
    return {
      success: false,
      error: 'Insufficient SOL balance to create market',
      errorCode: MarketCreationErrorCode.INSUFFICIENT_BALANCE
    }
  }

  // Program errors (from Anchor)
  if (error.message?.includes('VotingNotEnded')) {
    return {
      success: false,
      error: 'Voting period has not ended yet',
      errorCode: MarketCreationErrorCode.VOTING_NOT_ENDED
    }
  }

  if (error.message?.includes('InsufficientApproval')) {
    return {
      success: false,
      error: 'Proposal does not have ≥60% YES votes',
      errorCode: MarketCreationErrorCode.INSUFFICIENT_APPROVAL
    }
  }

  if (error.message?.includes('ProposalAlreadyProcessed')) {
    return {
      success: false,
      error: 'Proposal has already been approved or rejected',
      errorCode: MarketCreationErrorCode.PROPOSAL_ALREADY_PROCESSED
    }
  }

  // Network errors
  if (error.message?.includes('network') || error.message?.includes('timeout')) {
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
      errorCode: MarketCreationErrorCode.NETWORK_ERROR
    }
  }

  // Transaction failed (generic)
  if (error.message?.includes('Transaction') || error.message?.includes('failed')) {
    return {
      success: false,
      error: 'Transaction failed. Please try again.',
      errorCode: MarketCreationErrorCode.TRANSACTION_FAILED
    }
  }

  // Unknown error
  return {
    success: false,
    error: error.message || 'An unexpected error occurred',
    errorCode: MarketCreationErrorCode.UNKNOWN_ERROR
  }
}

/**
 * Estimate gas/transaction fees
 *
 * Useful for showing users expected costs before confirmation.
 * Returns estimated SOL cost for both transactions.
 */
export async function estimateMarketCreationCost(): Promise<number> {
  try {
    const connection = new Connection(RPC_ENDPOINT, COMMITMENT)

    // Get recent prioritization fees
    const recentFees = await connection.getRecentPrioritizationFees()
    const avgFee = recentFees.length > 0
      ? recentFees.reduce((sum, fee) => sum + fee.prioritizationFee, 0) / recentFees.length
      : 5000 // Default 5000 micro-lamports

    // Estimate: 2 transactions × (5000 lamports base + priority fee)
    const baseFeeLamports = 5000
    const estimatedTotalLamports = 2 * (baseFeeLamports + avgFee)

    // Convert to SOL
    return estimatedTotalLamports / 1_000_000_000
  } catch (error) {
    console.warn('Failed to estimate costs:', error)
    return 0.00002 // Conservative estimate: 0.00002 SOL
  }
}
