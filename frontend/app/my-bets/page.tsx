'use client'

/**
 * My Bets Page
 * Shows user's betting history and claimable payouts
 */

import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useClaimPayouts } from '@/lib/hooks/useClaimPayouts'
import toast from 'react-hot-toast'

interface Bet {
  bet_id: number
  market_id: number
  user_wallet: string
  prediction: 'yes' | 'no'
  amount: number
  claimed: boolean
  created_at: string
  market: {
    title: string
    status: string
    resolution: string | null
    resolved_at: string | null
    yes_amount: number
    no_amount: number
    total_amount: number
  }
}

export default function MyBetsPage() {
  const { publicKey, connected } = useWallet()
  const router = useRouter()
  const { claimPayout, isClaiming } = useClaimPayouts()
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [claimingMarketId, setClaimingMarketId] = useState<number | null>(null)

  useEffect(() => {
    if (!connected) {
      router.push('/')
      return
    }

    if (publicKey) {
      loadBets()
    }
  }, [publicKey, connected, router])

  const loadBets = async () => {
    if (!publicKey) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          market:markets!inner(
            title,
            status,
            resolution,
            resolved_at,
            yes_amount,
            no_amount,
            total_amount
          )
        `)
        .eq('user_wallet', publicKey.toBase58())
        .order('created_at', { ascending: false })

      if (error) throw error

      setBets(data || [])
    } catch (err) {
      console.error('Failed to load bets:', err)
      toast.error('Failed to load betting history')
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async (marketId: number) => {
    setClaimingMarketId(marketId)

    try {
      await claimPayout(marketId)
      toast.success('Payout claimed successfully! 🎉')
      await loadBets() // Reload to update claimed status
    } catch (err: any) {
      console.error('Claim error:', err)
      toast.error(err.message || 'Failed to claim payout')
    } finally {
      setClaimingMarketId(null)
    }
  }

  const calculatePayout = (bet: Bet): number => {
    const market = bet.market
    if (!market || market.status !== 'resolved' || !market.resolution) {
      return 0
    }

    // Check if user won
    const won = market.resolution === bet.prediction

    if (!won) return 0

    // Calculate payout
    const winningPool = market.resolution === 'yes' ? market.yes_amount : market.no_amount
    const losingPool = market.resolution === 'yes' ? market.no_amount : market.yes_amount

    if (winningPool === 0) return 0

    // User gets back their bet + proportional share of losing pool
    const shareOfWinningPool = bet.amount / winningPool
    const profitFromLosingPool = losingPool * shareOfWinningPool

    return bet.amount + profitFromLosingPool
  }

  const isClaimable = (bet: Bet): boolean => {
    return (
      bet.market.status === 'resolved' &&
      bet.market.resolution === bet.prediction &&
      !bet.claimed
    )
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Connect your wallet to view your bets</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-xl">Loading your bets...</p>
        </div>
      </div>
    )
  }

  const activeBets = bets.filter(b => b.market.status === 'active')
  const resolvedBets = bets.filter(b => b.market.status === 'resolved')
  const claimableBets = resolvedBets.filter(isClaimable)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Bets</h1>
          <p className="text-gray-400">View your betting history and claim payouts</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Total Bets</p>
            <p className="text-3xl font-bold text-white">{bets.length}</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Active</p>
            <p className="text-3xl font-bold text-yellow-400">{activeBets.length}</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Resolved</p>
            <p className="text-3xl font-bold text-blue-400">{resolvedBets.length}</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Claimable</p>
            <p className="text-3xl font-bold text-green-400">{claimableBets.length}</p>
          </div>
        </div>

        {/* Claimable Payouts Section */}
        {claimableBets.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">🎉 Claimable Payouts</h2>
            <div className="space-y-4">
              {claimableBets.map((bet) => {
                const payout = calculatePayout(bet)

                return (
                  <div
                    key={bet.bet_id}
                    className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 backdrop-blur rounded-lg p-6 border border-green-700"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{bet.market.title}</h3>
                        <div className="flex gap-4 text-sm text-gray-400">
                          <span>Bet: {bet.amount.toFixed(2)} SOL on {bet.prediction.toUpperCase()}</span>
                          <span>•</span>
                          <span>Payout: {payout.toFixed(2)} SOL</span>
                          <span>•</span>
                          <span className="text-green-400 font-bold">Profit: +{(payout - bet.amount).toFixed(2)} SOL</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleClaim(bet.market_id)}
                        disabled={isClaiming || claimingMarketId === bet.market_id}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-bold transition-colors shadow-lg"
                      >
                        {claimingMarketId === bet.market_id ? 'Claiming...' : '💰 Claim Payout'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Active Bets */}
        {activeBets.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">⏳ Active Bets</h2>
            <div className="space-y-4">
              {activeBets.map((bet) => (
                <div
                  key={bet.bet_id}
                  className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{bet.market.title}</h3>
                      <div className="flex gap-4 text-sm text-gray-400">
                        <span>Amount: {bet.amount.toFixed(2)} SOL</span>
                        <span>•</span>
                        <span className={bet.prediction === 'yes' ? 'text-green-400' : 'text-red-400'}>
                          Prediction: {bet.prediction.toUpperCase()}
                        </span>
                        <span>•</span>
                        <span>{new Date(bet.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/markets/${bet.market_id}`)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      View Market
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolved Bets (Non-Claimable) */}
        {resolvedBets.filter(b => !isClaimable(b)).length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">📊 Resolved Bets</h2>
            <div className="space-y-4">
              {resolvedBets.filter(b => !isClaimable(b)).map((bet) => {
                const won = bet.market.resolution === bet.prediction
                const lost = bet.market.resolution && bet.market.resolution !== bet.prediction

                return (
                  <div
                    key={bet.bet_id}
                    className={`bg-gray-800/50 backdrop-blur rounded-lg p-6 border ${
                      won ? 'border-green-700' : lost ? 'border-red-700' : 'border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{bet.market.title}</h3>
                        <div className="flex gap-4 text-sm text-gray-400">
                          <span>Bet: {bet.amount.toFixed(2)} SOL on {bet.prediction.toUpperCase()}</span>
                          <span>•</span>
                          <span>Result: {bet.market.resolution?.toUpperCase()}</span>
                          <span>•</span>
                          <span className={won ? 'text-green-400 font-bold' : lost ? 'text-red-400' : 'text-gray-400'}>
                            {won && bet.claimed ? '✓ Claimed' : won ? '✓ Won' : lost ? '✗ Lost' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {bets.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-xl mb-4">You haven't placed any bets yet</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors"
            >
              Explore Markets
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
