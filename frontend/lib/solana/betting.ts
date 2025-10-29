import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction
} from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor'
import idl from '@/lib/solana/idl/core_markets.json'

// Program IDs (from environment variables - devnet/testnet/mainnet)
const CORE_MARKETS_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_CORE_MARKETS_ID || '6BBZWsJZq23k2NX3YnENgXTEPhbVEHXYmPxmamN83eEV'
)
const PARAMETER_STORAGE_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PARAMETER_STORAGE_ID || 'J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD'
)
const BOND_MANAGER_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_BOND_MANAGER_ID || '8XvCToLC42ZV4hw6PW5SEhqDpX3NfqvbAS2tNseG52Fx'
)

export interface PlaceBetParams {
  marketId: number
  amount: number // in SOL
  outcome: 'YES' | 'NO'
  publicKey: PublicKey
  connection: Connection
  signTransaction: (tx: Transaction) => Promise<Transaction>
}

export interface PlaceBetResult {
  success: boolean
  txHash?: string
  error?: string
}

/**
 * Place a bet on a prediction market
 *
 * @param params - Bet parameters
 * @returns Result with transaction hash or error
 */
export async function placeBet(params: PlaceBetParams): Promise<PlaceBetResult> {
  const { marketId, amount, outcome, publicKey, connection, signTransaction } = params

  try {
    // Validate inputs
    if (amount <= 0) {
      return { success: false, error: 'Invalid bet amount' }
    }

    if (amount < 0.01) {
      return { success: false, error: 'Minimum bet is 0.01 SOL' }
    }

    if (amount > 1000) {
      return { success: false, error: 'Maximum bet is 1000 SOL' }
    }

    // Create provider
    const provider = new AnchorProvider(
      connection,
      {
        publicKey,
        signTransaction,
        signAllTransactions: async (txs: Transaction[]) => {
          return Promise.all(txs.map(tx => signTransaction(tx)))
        }
      } as any,
      { commitment: 'confirmed' }
    )

    // Initialize program
    const program = new Program(idl as any, provider)

    // Derive PDAs
    const [marketPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('market'),
        new BN(marketId).toArrayLike(Buffer, 'le', 8)
      ],
      CORE_MARKETS_PROGRAM_ID
    )

    // Get market account to read total_bets for user bet PDA
    const marketAccount: any = await (program.account as any).market.fetch(marketPda)
    const totalBets = marketAccount.totalBets as number

    const [userBetPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('user-bet'),
        marketPda.toBuffer(),
        publicKey.toBuffer(),
        new BN(totalBets).toArrayLike(Buffer, 'le', 8)
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
        new BN(marketId).toArrayLike(Buffer, 'le', 8)
      ],
      BOND_MANAGER_PROGRAM_ID
    )

    // Convert SOL to lamports
    const amountLamports = new BN(amount * LAMPORTS_PER_SOL)

    // Convert outcome to enum
    const betSide = outcome === 'YES' ? { yes: {} } : { no: {} }

    // Build transaction
    const tx = await (program as any).methods
      .placeBet(betSide, amountLamports)
      .accounts({
        market: marketPda,
        userBet: userBetPda,
        globalParameters: globalParametersPda,
        bondEscrow: bondEscrowPda,
        bettor: publicKey,
        systemProgram: SystemProgram.programId,
        parameterStorageProgram: PARAMETER_STORAGE_PROGRAM_ID,
        bondManagerProgram: BOND_MANAGER_PROGRAM_ID
      })
      .transaction()

    // Set recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
    tx.recentBlockhash = blockhash
    tx.feePayer = publicKey

    // Sign transaction
    const signedTx = await signTransaction(tx)

    // Send and confirm transaction
    const txHash = await connection.sendRawTransaction(signedTx.serialize())

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction({
      signature: txHash,
      blockhash,
      lastValidBlockHeight
    }, 'confirmed')

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`)
    }

    return {
      success: true,
      txHash
    }

  } catch (error: any) {
    console.error('Place bet error:', error)

    // Parse error messages
    let errorMessage = 'Failed to place bet'

    if (error.message?.includes('insufficient')) {
      errorMessage = 'Insufficient SOL balance'
    } else if (error.message?.includes('User rejected')) {
      errorMessage = 'Transaction rejected by wallet'
    } else if (error.message?.includes('MarketNotActive')) {
      errorMessage = 'Market is not active'
    } else if (error.message?.includes('MarketEnded')) {
      errorMessage = 'Market has ended'
    } else if (error.message?.includes('BetTooSmall')) {
      errorMessage = 'Bet amount is too small'
    } else if (error.message?.includes('BetTooLarge')) {
      errorMessage = 'Bet amount is too large'
    } else if (error.logs) {
      // Check program logs for errors
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
 * Claim winnings from a resolved market
 *
 * @param marketId - Market ID
 * @param publicKey - User's public key
 * @param connection - Solana connection
 * @param signTransaction - Wallet sign function
 * @returns Result with transaction hash or error
 */
export async function claimWinnings(
  marketId: number,
  publicKey: PublicKey,
  connection: Connection,
  signTransaction: (tx: Transaction) => Promise<Transaction>
): Promise<PlaceBetResult> {
  try {
    // Create provider
    const provider = new AnchorProvider(
      connection,
      {
        publicKey,
        signTransaction,
        signAllTransactions: async (txs: Transaction[]) => {
          return Promise.all(txs.map(tx => signTransaction(tx)))
        }
      } as any,
      { commitment: 'confirmed' }
    )

    // Initialize program
    const program = new Program(idl as any, provider)

    // Derive PDAs
    const [marketPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('market'),
        new BN(marketId).toArrayLike(Buffer, 'le', 8)
      ],
      CORE_MARKETS_PROGRAM_ID
    )

    // Note: For claiming, we need to find ALL user bets for this market
    // This is complex and would require fetching all user bet accounts
    // For now, returning a placeholder

    return {
      success: false,
      error: 'Claiming not yet implemented in frontend'
    }

  } catch (error: any) {
    console.error('Claim winnings error:', error)
    return {
      success: false,
      error: 'Failed to claim winnings'
    }
  }
}

/**
 * Get user's bets for a specific market
 *
 * @param marketId - Market ID
 * @param userPublicKey - User's public key
 * @param connection - Solana connection
 * @returns Array of user bets
 */
export async function getUserBets(
  marketId: number,
  userPublicKey: PublicKey,
  connection: Connection
) {
  try {
    const provider = new AnchorProvider(
      connection,
      {} as any, // Read-only, no wallet needed
      { commitment: 'confirmed' }
    )

    const program = new Program(idl as any, provider)

    // Get all user bet accounts for this market and user
    // This requires a getProgramAccounts call with filters
    const accounts = await connection.getProgramAccounts(
      CORE_MARKETS_PROGRAM_ID,
      {
        filters: [
          // Filter for UserBet account type (would need discriminator)
          {
            memcmp: {
              offset: 8, // After discriminator
              bytes: new BN(marketId).toArrayLike(Buffer, 'le', 8).toString('base64')
            }
          },
          {
            memcmp: {
              offset: 16, // After market_id
              bytes: userPublicKey.toBuffer().toString('base64')
            }
          }
        ]
      }
    )

    // Parse and return user bets
    return accounts.map(account => {
      // Parse account data
      // This would need proper deserialization
      return {
        pubkey: account.pubkey.toBase58(),
        // Additional fields would be parsed here
      }
    })

  } catch (error) {
    console.error('Get user bets error:', error)
    return []
  }
}