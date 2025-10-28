import { useState, useCallback } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import { Program, AnchorProvider } from '@project-serum/anchor'
import { supabase } from '@/lib/supabase'
import idl from '@/lib/solana/idl/core_markets.json'

// Only initialize these on the client side
const getProgramId = () => {
  if (typeof window === 'undefined') return null
  try {
    return new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || '')
  } catch {
    return null
  }
}

const getParameterStorageId = () => {
  if (typeof window === 'undefined') return null
  try {
    return new PublicKey(process.env.NEXT_PUBLIC_PARAMETER_STORAGE_ID || '')
  } catch {
    return null
  }
}

interface UseClaimPayoutsReturn {
  claimPayout: (marketId: number) => Promise<void>
  isClaiming: boolean
  claimError: Error | null
}

export function useClaimPayouts(): UseClaimPayoutsReturn {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimError, setClaimError] = useState<Error | null>(null)

  const claimPayout = useCallback(async (marketId: number) => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected')
    }

    const programId = getProgramId()
    const parameterStorageId = getParameterStorageId()

    if (!programId || !parameterStorageId) {
      throw new Error('Program IDs not configured')
    }

    try {
      setIsClaiming(true)
      setClaimError(null)

      // Create Anchor provider
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

      const program = new Program(idl as any, programId, provider)

      // Get market PDA
      const [marketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('market'),
          parameterStorageId.toBuffer(),
          Buffer.from(new Uint8Array(new BigUint64Array([BigInt(marketId)]).buffer))
        ],
        program.programId
      )

      // Get user bet PDA
      // Note: We need the bet index, which we should get from the database
      const { data: betData, error: betError } = await supabase
        .from('bets')
        .select('bet_index')
        .eq('user_wallet', publicKey.toBase58())
        .eq('market_id', marketId)
        .single()

      if (betError) throw new Error('Failed to fetch bet data')
      if (!betData) throw new Error('Bet not found')

      const betIndex = betData.bet_index

      const [userBetPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('user_bet'),
          marketPda.toBuffer(),
          publicKey.toBuffer(),
          Buffer.from(new Uint8Array(new BigUint64Array([BigInt(betIndex)]).buffer))
        ],
        program.programId
      )

      // Get market vault PDA
      const [marketVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('market_vault'), marketPda.toBuffer()],
        program.programId
      )

      // Call claim instruction
      const tx = await program.methods
        .claimPayout()
        .accounts({
          user: publicKey,
          market: marketPda,
          userBet: userBetPda,
          marketVault: marketVaultPda,
          systemProgram: SystemProgram.programId
        })
        .rpc()

      console.log('Claim transaction:', tx)

      // Wait for confirmation
      await connection.confirmTransaction(tx, 'confirmed')

      // Update database to mark bet as claimed
      const { error: updateError } = await supabase
        .from('bets')
        .update({ claimed: true })
        .eq('user_wallet', publicKey.toBase58())
        .eq('market_id', marketId)

      if (updateError) {
        console.error('Failed to update claimed status in database:', updateError)
        // Don't throw here - the claim was successful on-chain
      }

      console.log('Payout claimed successfully!')
    } catch (err) {
      console.error('Claim payout error:', err)
      const error = err instanceof Error ? err : new Error('Failed to claim payout')
      setClaimError(error)
      throw error
    } finally {
      setIsClaiming(false)
    }
  }, [publicKey, signTransaction, connection])

  return {
    claimPayout,
    isClaiming,
    claimError
  }
}
