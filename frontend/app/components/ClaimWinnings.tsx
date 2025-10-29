/**
 * Claim Winnings Component
 *
 * Shows user's winning bets from resolved markets and allows claiming payouts.
 *
 * Features:
 * - List all claimable bets
 * - Show expected payout for each bet
 * - One-click claim functionality
 * - Real-time updates after claiming
 * - Transaction status and history
 *
 * Following Web3 dApp UX best practices:
 * - Clear payout calculations
 * - Transaction status feedback
 * - Error handling with recovery suggestions
 * - Optimistic UI updates
 */

'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { createClient } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { claimPayout, calculateExpectedPayout, canClaimPayout, type UserBetData } from '@/lib/solana/claim-payout'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ClaimableBet {
  id: string
  market_id: number
  market_title: string
  bet_side: 'yes' | 'no'
  amount: number // Original bet in lamports
  amount_to_pool: number // After fees in lamports
  claimed: boolean
  yes_pool: number
  no_pool: number
  resolved_outcome: 'yes' | 'no' | null
  market_status: string
  created_at: string
}

export function ClaimWinnings() {
  const { publicKey } = useWallet()
  const [bets, setBets] = useState<ClaimableBet[]>([])
  const [loading, setLoading] = useState(true)
  const [claimingBetId, setClaimingBetId] = useState<string | null>(null)

  useEffect(() => {
    if (publicKey) {
      fetchClaimableBets()

      // Real-time subscription for market updates
      const subscription = supabase
        .channel('markets_changes')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'markets',
        }, () => {
          fetchClaimableBets()
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [publicKey])

  async function fetchClaimableBets() {
    if (!publicKey) return

    setLoading(true)
    try {
      // Fetch user's bets from resolved markets
      const { data, error } = await supabase
        .from('user_bets')
        .select(`
          *,
          markets (
            market_id,
            question,
            yes_pool,
            no_pool,
            resolved_outcome,
            status
          )
        `)
        .eq('user_wallet', publicKey.toString())
        .eq('markets.status', 'resolved')
        .eq('claimed', false)

      if (error) throw error

      // Filter for winning bets only
      const winningBets = (data || []).filter((bet: any) =>
        bet.markets &&
        bet.markets.resolved_outcome &&
        bet.outcome.toLowerCase() === bet.markets.resolved_outcome.toLowerCase()
      ).map((bet: any) => ({
        id: bet.id,
        market_id: bet.markets.market_id,
        market_title: bet.markets.question,
        bet_side: bet.outcome.toLowerCase(),
        amount: bet.amount,
        amount_to_pool: bet.shares, // Using shares as amount_to_pool
        claimed: bet.claimed,
        yes_pool: bet.markets.yes_pool || 0,
        no_pool: bet.markets.no_pool || 0,
        resolved_outcome: bet.markets.resolved_outcome,
        market_status: bet.markets.status,
        created_at: bet.created_at
      }))

      setBets(winningBets)

    } catch (error: any) {
      console.error('Failed to fetch claimable bets:', error)
      toast.error('Failed to load claimable bets')
    } finally {
      setLoading(false)
    }
  }

  async function handleClaim(bet: ClaimableBet) {
    if (!publicKey) {
      toast.error('Please connect your wallet')
      return
    }

    setClaimingBetId(bet.id)

    try {
      toast.loading('Claiming your winnings...', { id: 'claim-payout' })

      // Call claim payout service
      const result = await claimPayout({
        marketId: bet.market_id,
        betId: bet.id,
        userWallet: publicKey.toString()
      })

      if (!result.success) {
        toast.error(result.error || 'Failed to claim payout', { id: 'claim-payout' })
        return
      }

      // Update database to mark as claimed
      const { error } = await supabase
        .from('user_bets')
        .update({ claimed: true })
        .eq('id', bet.id)

      if (error) {
        console.error('Failed to update claimed status:', error)
        // Non-critical: on-chain claim succeeded
      }

      toast.success(
        `🎉 Claimed ${result.payoutAmount?.toFixed(4) || '?'} SOL!`,
        { id: 'claim-payout', duration: 7000 }
      )

      console.log('✅ Claim Tx:', result.txHash)

      // Refresh bets
      await fetchClaimableBets()

    } catch (error: any) {
      console.error('Claim error:', error)
      toast.error('Failed to claim payout', { id: 'claim-payout' })
    } finally {
      setClaimingBetId(null)
    }
  }

  function getExpectedPayout(bet: ClaimableBet): number {
    const betData: UserBetData = {
      betId: bet.id,
      marketId: bet.market_id,
      betSide: bet.bet_side,
      amount: bet.amount,
      amountToPool: bet.amount_to_pool,
      claimed: bet.claimed
    }

    return calculateExpectedPayout(
      betData,
      bet.yes_pool,
      bet.no_pool,
      bet.resolved_outcome
    )
  }

  if (!publicKey) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400 mb-4">Connect your wallet to view claimable winnings</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Claim Winnings</h2>
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading your winnings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Claim Winnings</h2>
          <p className="text-sm text-gray-400 mt-1">
            You have {bets.length} unclaimed winning bet{bets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={fetchClaimableBets}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {bets.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No winnings to claim</p>
          <p className="text-sm">Winning bets from resolved markets will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bets.map((bet) => {
            const expectedPayout = getExpectedPayout(bet)
            const isClaiming = claimingBetId === bet.id

            return (
              <div
                key={bet.id}
                className="bg-gray-700 rounded-lg p-4 border border-green-500/30"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {bet.market_title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      You bet {bet.bet_side.toUpperCase()} and won! 🎉
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                    ✓ Winner
                  </span>
                </div>

                {/* Payout Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-800 rounded p-3">
                    <p className="text-xs text-gray-400">Your Bet</p>
                    <p className="text-lg font-bold text-white">
                      {(bet.amount / 1_000_000_000).toFixed(4)} SOL
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <p className="text-xs text-gray-400">Expected Payout</p>
                    <p className="text-lg font-bold text-green-400">
                      {expectedPayout.toFixed(4)} SOL
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <p className="text-xs text-gray-400">Profit</p>
                    <p className="text-lg font-bold text-yellow-400">
                      +{(expectedPayout - bet.amount / 1_000_000_000).toFixed(4)} SOL
                    </p>
                  </div>
                </div>

                {/* Pool Info */}
                <div className="bg-gray-800 rounded p-3 mb-4">
                  <p className="text-xs text-gray-400 mb-2">Pool Distribution</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">
                      YES Pool: {(bet.yes_pool / 1_000_000_000).toFixed(2)} SOL
                    </span>
                    <span className="text-gray-300">
                      NO Pool: {(bet.no_pool / 1_000_000_000).toFixed(2)} SOL
                    </span>
                  </div>
                </div>

                {/* Claim Button */}
                <button
                  onClick={() => handleClaim(bet)}
                  disabled={isClaiming}
                  className="w-full py-3 px-4 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {isClaiming ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Claiming...
                    </span>
                  ) : (
                    `💰 Claim ${expectedPayout.toFixed(4)} SOL`
                  )}
                </button>

                {/* Meta Info */}
                <div className="mt-3 text-xs text-gray-400 text-center">
                  Bet placed on {new Date(bet.created_at).toLocaleDateString()}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Total Claimable */}
      {bets.length > 0 && (
        <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-white font-medium">Total Claimable:</span>
            <span className="text-2xl font-bold text-green-400">
              {bets.reduce((sum, bet) => sum + getExpectedPayout(bet), 0).toFixed(4)} SOL
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
