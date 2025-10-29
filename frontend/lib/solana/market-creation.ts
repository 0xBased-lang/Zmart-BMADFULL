/**
 * Direct Market Creation (Admin/Testing)
 * Bypass proposal/voting flow - create markets instantly on-chain
 */

import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor'
import { getWallet } from '@/lib/solana/wallet'
import idl from '@/lib/solana/idl/core_markets.json'

// Program IDs from environment
const CORE_MARKETS_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_CORE_MARKETS_ID || '6BBZWsJZq23k2NX3YnENgXTEPhbVEHXYmPxmamN83eEV'
)
const PARAMETER_STORAGE_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PARAMETER_STORAGE_ID || 'J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD'
)
const BOND_MANAGER_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_BOND_MANAGER_ID || '8XvCToLC42ZV4hw6PW5SEhqDpX3NfqvbAS2tNseG52Fx'
)

export interface CreateMarketParams {
  question: string
  description: string
  category: string
  endTimestamp: number
  bondAmount: number // in SOL
  creator: PublicKey
}

export interface CreateMarketResult {
  success: boolean
  marketId?: number
  txHash?: string
  error?: string
}

/**
 * Create a new prediction market on-chain
 * Calls core_markets.create_market()
 */
export async function createMarket(
  params: CreateMarketParams
): Promise<CreateMarketResult> {
  try {
    const { question, endTimestamp, bondAmount, creator } = params

    // Get connection
    const connection = new Connection(
      process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com',
      'confirmed'
    )

    // Get wallet
    const wallet = getWallet()
    if (!wallet) {
      return { success: false, error: 'Wallet not connected' }
    }

    // Create provider
    const provider = new AnchorProvider(
      connection,
      wallet as any,
      { commitment: 'confirmed' }
    )

    // Initialize program
    const program = new Program(idl as any, provider)

    // Generate market ID (use timestamp for uniqueness)
    const marketId = Date.now()
    const marketIdBN = new BN(marketId)

    // Derive PDAs
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

    const [bondEscrowPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('bond-escrow'),
        marketIdBN.toArrayLike(Buffer, 'le', 8)
      ],
      BOND_MANAGER_PROGRAM_ID
    )

    const [marketVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('market_vault'), marketPda.toBuffer()],
      CORE_MARKETS_PROGRAM_ID
    )

    // Convert parameters
    const bondAmountLamports = new BN(bondAmount * 1_000_000_000) // SOL to lamports
    const endTimestampBN = new BN(endTimestamp)

    // Build transaction
    // Per IDL: create_market(market_id, question, end_timestamp)
    const tx = await (program as any).methods
      .createMarket(
        marketIdBN,
        question,
        endTimestampBN
      )
      .accounts({
        market: marketPda,
        marketVault: marketVaultPda,
        bondEscrow: bondEscrowPda,
        globalParameters: globalParametersPda,
        creator: creator,
        systemProgram: SystemProgram.programId,
        parameterStorageProgram: PARAMETER_STORAGE_PROGRAM_ID,
        bondManagerProgram: BOND_MANAGER_PROGRAM_ID
      })
      .transaction()

    // Sign and send
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
    tx.recentBlockhash = blockhash
    tx.feePayer = creator

    const signedTx = await wallet.signTransaction!(tx)
    const txHash = await connection.sendRawTransaction(signedTx.serialize())

    // Confirm transaction
    const confirmation = await connection.confirmTransaction({
      signature: txHash,
      blockhash,
      lastValidBlockHeight
    }, 'confirmed')

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`)
    }

    // TODO: Save to Supabase database
    // This would normally be done by the event listener service
    // For now, just return success

    return {
      success: true,
      marketId,
      txHash
    }

  } catch (error: any) {
    console.error('Create market error:', error)

    // Parse error messages
    let errorMessage = 'Failed to create market'

    if (error.message?.includes('insufficient')) {
      errorMessage = 'Insufficient SOL balance'
    } else if (error.message?.includes('User rejected')) {
      errorMessage = 'Transaction rejected by wallet'
    } else if (error.logs) {
      const programError = error.logs.find((log: string) =>
        log.includes('Error') || log.includes('failed')
      )
      if (programError) {
        errorMessage = programError
      }
    }

    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Get next available market ID from database
 * Fallback to timestamp if database unavailable
 */
export async function getNextMarketId(): Promise<number> {
  try {
    const response = await fetch('/api/markets/next-id')
    if (response.ok) {
      const { nextId } = await response.json()
      return nextId
    }
  } catch (error) {
    console.error('Failed to get next market ID from database:', error)
  }

  // Fallback to timestamp
  return Date.now()
}
