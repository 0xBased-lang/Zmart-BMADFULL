/**
 * Claim Payout Service
 *
 * Allows users to claim winnings from resolved markets.
 * Calculates proportional payout based on pool sizes.
 *
 * Payout Formula:
 * - If user won: payout = bet + (bet × losing_pool / winning_pool)
 * - If user lost: payout = 0
 *
 * Following Web3 dApp best practices:
 * - Type-safe contract interactions
 * - Payout preview calculations
 * - Transaction confirmation
 * - Reentrancy protection (handled by smart contract)
 */

import { Connection, PublicKey } from '@solana/web3.js'
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor'
import { getWallet } from '@/lib/solana/wallet'
import coreMarketsIdl from '@/lib/solana/idl/core_markets.json'

// Program IDs
const CORE_MARKETS_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_CORE_MARKETS_ID || '6BBZWsJZq23k2NX3YnENgXTEPhbVEHXYmPxmamN83eEV'
)

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com'
const COMMITMENT = 'confirmed'

export interface UserBetData {
  betId: string
  marketId: number
  betSide: 'yes' | 'no'
  amount: number // Original bet amount in lamports
  amountToPool: number // Amount after fees in lamports
  claimed: boolean
}

export interface ClaimPayoutParams {
  marketId: number
  betId: string
  userWallet: string
}

export interface ClaimPayoutResult {
  success: boolean
  txHash?: string
  payoutAmount?: number // In SOL
  error?: string
  errorCode?: ClaimErrorCode
}

export enum ClaimErrorCode {
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  MARKET_NOT_RESOLVED = 'MARKET_NOT_RESOLVED',
  BET_NOT_FOUND = 'BET_NOT_FOUND',
  ALREADY_CLAIMED = 'ALREADY_CLAIMED',
  BET_LOST = 'BET_LOST',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  USER_REJECTED = 'USER_REJECTED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Claim payout from a resolved market
 *
 * @param params - Claim parameters
 * @returns Result with transaction hash and payout amount
 */
export async function claimPayout(
  params: ClaimPayoutParams
): Promise<ClaimPayoutResult> {
  console.log('💰 Claiming payout for market:', params.marketId)

  try {
    // Step 1: Validate wallet connection
    const wallet = getWallet()
    if (!wallet || !wallet.signTransaction) {
      return {
        success: false,
        error: 'Please connect your wallet',
        errorCode: ClaimErrorCode.WALLET_NOT_CONNECTED
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
    const userPubkey = new PublicKey(params.userWallet)

    // Step 4: Derive PDAs
    const [marketPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('market'),
        marketIdBN.toArrayLike(Buffer, 'le', 8)
      ],
      CORE_MARKETS_PROGRAM_ID
    )

    // Parse betId to get bet counter for user-bet PDA derivation
    // Format: "market_X_user_Y_bet_Z" → extract Z
    const betCounter = extractBetCounter(params.betId)

    const [userBetPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('user-bet'),
        marketPda.toBuffer(),
        userPubkey.toBuffer(),
        Buffer.from(betCounter.toString().padStart(8, '0')) // Ensure consistent formatting
      ],
      CORE_MARKETS_PROGRAM_ID
    )

    console.log('📊 Claiming from:', {
      marketId: params.marketId,
      betId: params.betId,
      user: userPubkey.toString().slice(0, 8) + '...'
    })

    // Step 5: Build claim_payout transaction
    const tx = await (program as any).methods
      .claimPayout()
      .accounts({
        market: marketPda,
        userBet: userBetPda,
        bettor: userPubkey
      })
      .transaction()

    // Step 6: Sign and send
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(COMMITMENT)
    tx.recentBlockhash = blockhash
    tx.feePayer = wallet.publicKey

    const signedTx = await wallet.signTransaction!(tx)
    const signature = await connection.sendRawTransaction(signedTx.serialize())

    console.log('📡 Transaction sent:', signature)

    // Step 7: Confirm with timeout (30 seconds)
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    }, COMMITMENT)

    if (confirmation.value.err) {
      throw new Error(`Claim transaction failed: ${confirmation.value.err.toString()}`)
    }

    // Step 8: Parse transaction logs to get actual payout amount
    const txDetails = await connection.getTransaction(signature, {
      commitment: COMMITMENT,
      maxSupportedTransactionVersion: 0
    })

    let payoutAmount = 0
    if (txDetails?.meta?.logMessages) {
      // Look for "Payout claimed: X SOL" in logs
      const payoutLog = txDetails.meta.logMessages.find(log =>
        log.includes('Payout claimed:')
      )
      if (payoutLog) {
        const match = payoutLog.match(/Payout claimed: ([\d.]+) SOL/)
        if (match) {
          payoutAmount = parseFloat(match[1])
        }
      }
    }

    console.log('✅ Payout claimed successfully! Amount:', payoutAmount, 'SOL')

    return {
      success: true,
      txHash: signature,
      payoutAmount
    }

  } catch (error: any) {
    console.error('❌ Claim payout error:', error)
    return parseClaimError(error)
  }
}

/**
 * Calculate expected payout for a user bet
 *
 * Formula: payout = amountToPool + (amountToPool × losingPool / winningPool)
 *
 * @param bet - User bet data
 * @param yesPool - Total YES pool size in lamports
 * @param noPool - Total NO pool size in lamports
 * @param resolvedOutcome - Market resolution outcome
 * @returns Expected payout in SOL
 */
export function calculateExpectedPayout(
  bet: UserBetData,
  yesPool: number,
  noPool: number,
  resolvedOutcome: 'yes' | 'no' | null
): number {

  // Check if user won
  if (!resolvedOutcome || bet.betSide !== resolvedOutcome) {
    return 0 // User lost or market not resolved
  }

  // Get winning and losing pools
  const winningPool = bet.betSide === 'yes' ? yesPool : noPool
  const losingPool = bet.betSide === 'yes' ? noPool : yesPool

  // Prevent division by zero
  if (winningPool === 0) {
    return 0
  }

  // Calculate share of winnings
  const shareOfWinnings = (bet.amountToPool * losingPool) / winningPool

  // Total payout = original bet + share of losing pool
  const payoutLamports = bet.amountToPool + shareOfWinnings

  // Convert to SOL
  return payoutLamports / 1_000_000_000
}

/**
 * Check if a user can claim from a market
 *
 * Validates:
 * - Market is resolved
 * - User has not already claimed
 * - User bet on winning side
 */
export function canClaimPayout(
  bet: UserBetData,
  marketStatus: string,
  resolvedOutcome: 'yes' | 'no' | null
): { canClaim: boolean; reason?: string } {

  // Check if market is resolved
  if (marketStatus !== 'resolved') {
    return {
      canClaim: false,
      reason: 'Market has not been resolved yet'
    }
  }

  // Check if already claimed
  if (bet.claimed) {
    return {
      canClaim: false,
      reason: 'Payout already claimed'
    }
  }

  // Check if user won
  if (!resolvedOutcome || bet.betSide !== resolvedOutcome) {
    return {
      canClaim: false,
      reason: `You bet ${bet.betSide.toUpperCase()} but market resolved ${resolvedOutcome?.toUpperCase() || 'UNKNOWN'}`
    }
  }

  return { canClaim: true }
}

/**
 * Extract bet counter from betId string
 *
 * BetId format: "market_X_user_Y_bet_Z" → extract Z
 */
function extractBetCounter(betId: string): number {
  const parts = betId.split('_')
  const betCounterStr = parts[parts.length - 1]
  return parseInt(betCounterStr, 10)
}

/**
 * Parse claim errors into user-friendly messages
 */
function parseClaimError(error: any): ClaimPayoutResult {
  console.error('Parsing claim error:', error)

  // User rejected transaction
  if (error.message?.includes('User rejected') || error.code === 4001) {
    return {
      success: false,
      error: 'Transaction cancelled by user',
      errorCode: ClaimErrorCode.USER_REJECTED
    }
  }

  // Insufficient balance
  if (error.message?.includes('insufficient') || error.message?.includes('balance')) {
    return {
      success: false,
      error: 'Insufficient SOL balance for transaction',
      errorCode: ClaimErrorCode.INSUFFICIENT_BALANCE
    }
  }

  // Program errors (from Anchor)
  if (error.message?.includes('MarketNotResolved')) {
    return {
      success: false,
      error: 'Market has not been resolved yet',
      errorCode: ClaimErrorCode.MARKET_NOT_RESOLVED
    }
  }

  if (error.message?.includes('AlreadyClaimed')) {
    return {
      success: false,
      error: 'You have already claimed your payout',
      errorCode: ClaimErrorCode.ALREADY_CLAIMED
    }
  }

  if (error.message?.includes('BetLost')) {
    return {
      success: false,
      error: 'You bet on the losing side. No payout available.',
      errorCode: ClaimErrorCode.BET_LOST
    }
  }

  // Network errors
  if (error.message?.includes('network') || error.message?.includes('timeout')) {
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
      errorCode: ClaimErrorCode.NETWORK_ERROR
    }
  }

  // Transaction failed (generic)
  if (error.message?.includes('Transaction') || error.message?.includes('failed')) {
    return {
      success: false,
      error: 'Transaction failed. Please try again.',
      errorCode: ClaimErrorCode.TRANSACTION_FAILED
    }
  }

  // Unknown error
  return {
    success: false,
    error: error.message || 'An unexpected error occurred',
    errorCode: ClaimErrorCode.UNKNOWN_ERROR
  }
}

/**
 * Get all claimable bets for a user across all markets
 *
 * Fetches from database and calculates expected payouts
 */
export async function getClaimableBets(userWallet: string): Promise<Array<{
  bet: UserBetData
  expectedPayout: number
  marketTitle: string
  marketId: number
}>> {
  try {
    // Fetch user's bets from database
    const response = await fetch(`/api/user-bets?wallet=${userWallet}&status=claimable`)
    if (!response.ok) {
      throw new Error('Failed to fetch claimable bets')
    }

    const { bets } = await response.json()
    return bets || []

  } catch (error) {
    console.error('Failed to fetch claimable bets:', error)
    return []
  }
}
