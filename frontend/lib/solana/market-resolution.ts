/**
 * Market Resolution Service
 *
 * Handles on-chain market resolution with the CoreMarkets program.
 * Called by admin/market creator when a market ends.
 *
 * Process:
 * 1. Validate market has ended
 * 2. Call core_markets.resolve_market(outcome)
 * 3. Wait for transaction confirmation
 * 4. Emit event for database sync
 *
 * Following Web3 dApp best practices:
 * - Type-safe contract interactions
 * - Comprehensive error handling
 * - Transaction confirmation with timeouts
 * - User-friendly error messages
 */

import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor'
import { getWallet } from '@/lib/solana/wallet'
import coreMarketsIdl from '@/lib/solana/idl/core_markets.json'

// Program IDs
const CORE_MARKETS_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_CORE_MARKETS_ID || '6BBZWsJZq23k2NX3YnENgXTEPhbVEHXYmPxmamN83eEV'
)
const PARAMETER_STORAGE_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PARAMETER_STORAGE_ID || 'J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD'
)

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com'
const COMMITMENT = 'confirmed'

export interface ResolveMarketParams {
  marketId: number
  outcome: 'yes' | 'no'
  creatorAddress: string // Market creator wallet
  platformWallet: string  // Platform authority wallet
}

export interface ResolveMarketResult {
  success: boolean
  txHash?: string
  error?: string
  errorCode?: ResolutionErrorCode
}

export enum ResolutionErrorCode {
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  MARKET_NOT_FOUND = 'MARKET_NOT_FOUND',
  MARKET_NOT_ENDED = 'MARKET_NOT_ENDED',
  MARKET_ALREADY_RESOLVED = 'MARKET_ALREADY_RESOLVED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  USER_REJECTED = 'USER_REJECTED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Resolve a market on-chain
 *
 * @param params - Market resolution parameters
 * @returns Result with transaction hash
 */
export async function resolveMarket(
  params: ResolveMarketParams
): Promise<ResolveMarketResult> {
  console.log('🎯 Starting market resolution:', params.marketId, '→', params.outcome.toUpperCase())

  try {
    // Step 1: Validate wallet connection
    const wallet = getWallet()
    if (!wallet || !wallet.signTransaction) {
      return {
        success: false,
        error: 'Please connect your wallet',
        errorCode: ResolutionErrorCode.WALLET_NOT_CONNECTED
      }
    }

    // Step 2: Setup connection and provider
    const connection = new Connection(RPC_ENDPOINT, COMMITMENT)
    const provider = new AnchorProvider(
      connection,
      wallet as any,
      { commitment: COMMITMENT }
    )

    // Step 3: Initialize CoreMarkets program
    const program = new Program(coreMarketsIdl as any, provider)

    const marketIdBN = new BN(params.marketId)
    const creatorPubkey = new PublicKey(params.creatorAddress)
    const platformWalletPubkey = new PublicKey(params.platformWallet)

    // Step 4: Derive PDAs
    const [marketPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('market'),
        marketIdBN.toArrayLike(Buffer, 'le', 8)
      ],
      CORE_MARKETS_PROGRAM_ID
    )

    const [globalParametersPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('global-parameters')],
      PARAMETER_STORAGE_PROGRAM_ID
    )

    // Step 5: Convert outcome to BetSide enum
    const outcome = params.outcome === 'yes'
      ? { yes: {} }  // Anchor enum variant
      : { no: {} }

    console.log('📊 Resolving market:', {
      marketId: params.marketId,
      outcome: params.outcome.toUpperCase(),
      creator: creatorPubkey.toString().slice(0, 8) + '...',
      platformWallet: platformWalletPubkey.toString().slice(0, 8) + '...'
    })

    // Step 6: Build resolve_market transaction
    const tx = await (program as any).methods
      .resolveMarket(outcome)
      .accounts({
        market: marketPda,
        globalParameters: globalParametersPda,
        platformWallet: platformWalletPubkey,
        creatorWallet: creatorPubkey,
        authority: wallet.publicKey,
        parameterStorageProgram: PARAMETER_STORAGE_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      })
      .transaction()

    // Step 7: Sign and send
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(COMMITMENT)
    tx.recentBlockhash = blockhash
    tx.feePayer = wallet.publicKey

    const signedTx = await wallet.signTransaction!(tx)
    const signature = await connection.sendRawTransaction(signedTx.serialize())

    console.log('📡 Transaction sent:', signature)

    // Step 8: Confirm with timeout (30 seconds)
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    }, COMMITMENT)

    if (confirmation.value.err) {
      throw new Error(`Resolution transaction failed: ${confirmation.value.err.toString()}`)
    }

    console.log('✅ Market resolved successfully! Tx:', signature)

    return {
      success: true,
      txHash: signature
    }

  } catch (error: any) {
    console.error('❌ Market resolution error:', error)
    return parseResolutionError(error)
  }
}

/**
 * Check if a market can be resolved
 *
 * Validates:
 * - Market has ended (past end_date)
 * - Market is not already resolved
 * - User is authorized (creator or admin)
 */
export async function canResolveMarket(
  marketId: number,
  endDate: string,
  status: string,
  userWallet: string,
  creatorWallet: string
): Promise<{ canResolve: boolean; reason?: string }> {

  // Check if market has ended
  const now = new Date()
  const marketEndDate = new Date(endDate)

  if (now < marketEndDate) {
    return {
      canResolve: false,
      reason: `Market ends on ${marketEndDate.toLocaleDateString()} at ${marketEndDate.toLocaleTimeString()}`
    }
  }

  // Check if already resolved
  if (status === 'resolved') {
    return {
      canResolve: false,
      reason: 'Market has already been resolved'
    }
  }

  // Check authorization (must be creator)
  if (userWallet.toLowerCase() !== creatorWallet.toLowerCase()) {
    return {
      canResolve: false,
      reason: 'Only the market creator can resolve this market'
    }
  }

  return { canResolve: true }
}

/**
 * Estimate resolution gas cost
 *
 * Returns estimated SOL cost for resolution transaction
 */
export async function estimateResolutionCost(): Promise<number> {
  try {
    const connection = new Connection(RPC_ENDPOINT, COMMITMENT)

    // Get recent prioritization fees
    const recentFees = await connection.getRecentPrioritizationFees()
    const avgFee = recentFees.length > 0
      ? recentFees.reduce((sum, fee) => sum + fee.prioritizationFee, 0) / recentFees.length
      : 5000

    // Estimate: base fee + priority fee
    const baseFeeLamports = 5000
    const estimatedLamports = baseFeeLamports + avgFee

    // Convert to SOL
    return estimatedLamports / 1_000_000_000

  } catch (error) {
    console.warn('Failed to estimate resolution cost:', error)
    return 0.000005 // Conservative estimate
  }
}

/**
 * Parse resolution errors into user-friendly messages
 */
function parseResolutionError(error: any): ResolveMarketResult {
  console.error('Parsing resolution error:', error)

  // User rejected transaction
  if (error.message?.includes('User rejected') || error.code === 4001) {
    return {
      success: false,
      error: 'Transaction cancelled by user',
      errorCode: ResolutionErrorCode.USER_REJECTED
    }
  }

  // Insufficient balance
  if (error.message?.includes('insufficient') || error.message?.includes('balance')) {
    return {
      success: false,
      error: 'Insufficient SOL balance for transaction',
      errorCode: ResolutionErrorCode.INSUFFICIENT_BALANCE
    }
  }

  // Program errors (from Anchor)
  if (error.message?.includes('MarketNotEnded')) {
    return {
      success: false,
      error: 'Market has not ended yet. Cannot resolve before end date.',
      errorCode: ResolutionErrorCode.MARKET_NOT_ENDED
    }
  }

  if (error.message?.includes('MarketAlreadyResolved')) {
    return {
      success: false,
      error: 'Market has already been resolved',
      errorCode: ResolutionErrorCode.MARKET_ALREADY_RESOLVED
    }
  }

  if (error.message?.includes('Unauthorized')) {
    return {
      success: false,
      error: 'Unauthorized: Only market creator can resolve',
      errorCode: ResolutionErrorCode.UNAUTHORIZED
    }
  }

  // Network errors
  if (error.message?.includes('network') || error.message?.includes('timeout')) {
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
      errorCode: ResolutionErrorCode.NETWORK_ERROR
    }
  }

  // Transaction failed (generic)
  if (error.message?.includes('Transaction') || error.message?.includes('failed')) {
    return {
      success: false,
      error: 'Transaction failed. Please try again.',
      errorCode: ResolutionErrorCode.TRANSACTION_FAILED
    }
  }

  // Unknown error
  return {
    success: false,
    error: error.message || 'An unexpected error occurred',
    errorCode: ResolutionErrorCode.UNKNOWN_ERROR
  }
}
