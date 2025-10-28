import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserBet, PendingBet, ClaimablePayout, BetHistoryItem } from '@/lib/types/dashboard'

interface UseUserBetsReturn {
  activeBets: UserBet[]
  pendingBets: PendingBet[]
  claimablePayouts: ClaimablePayout[]
  betHistory: BetHistoryItem[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useUserBets(walletAddress: string | null): UseUserBetsReturn {
  const [activeBets, setActiveBets] = useState<UserBet[]>([])
  const [pendingBets, setPendingBets] = useState<PendingBet[]>([])
  const [claimablePayouts, setClaimablePayouts] = useState<ClaimablePayout[]>([])
  const [betHistory, setBetHistory] = useState<BetHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch user bets
  const fetchUserBets = useCallback(async () => {
    if (!walletAddress) {
      setActiveBets([])
      setPendingBets([])
      setClaimablePayouts([])
      setBetHistory([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Fetch bets with market data
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select(`
          *,
          markets (
            id,
            market_id,
            question,
            status,
            outcome,
            yes_pool,
            no_pool,
            total_volume,
            end_date,
            resolved_at
          )
        `)
        .eq('user_wallet', walletAddress)
        .order('created_at', { ascending: false })

      if (betsError) throw betsError

      // Process bets into different categories
      const active: UserBet[] = []
      const pending: PendingBet[] = []
      const claimable: ClaimablePayout[] = []
      const history: BetHistoryItem[] = []

      for (const bet of betsData || []) {
        const market = bet.markets

        if (!market) continue

        // Calculate current value and P&L
        const yesPool = market.yes_pool || 0
        const noPool = market.no_pool || 0
        const totalPool = yesPool + noPool

        const currentOdds = bet.outcome === 'YES'
          ? yesPool > 0 ? (noPool / totalPool) * 100 : 50
          : noPool > 0 ? (yesPool / totalPool) * 100 : 50

        const currentValue = bet.shares * (bet.outcome === 'YES'
          ? (noPool > 0 ? totalPool / yesPool : 1)
          : (yesPool > 0 ? totalPool / noPool : 1))

        const unrealizedPnL = currentValue - bet.amount
        const pnlPercentage = (unrealizedPnL / bet.amount) * 100

        // Categorize bet based on market status
        if (market.status === 'ACTIVE') {
          // Active bet
          active.push({
            id: bet.id,
            market_id: market.market_id,
            market_title: market.question,
            user_wallet: bet.user_wallet,
            outcome: bet.outcome as 'YES' | 'NO',
            amount: bet.amount,
            shares: bet.shares,
            current_odds: currentOdds,
            current_value: currentValue,
            unrealized_pnl: unrealizedPnL,
            pnl_percentage: pnlPercentage,
            created_at: bet.created_at,
            end_date: market.end_date,
            status: 'ACTIVE'
          })
        } else if (market.status === 'PENDING_RESOLUTION') {
          // Pending resolution
          pending.push({
            id: bet.id,
            market_id: market.market_id,
            market_title: market.question,
            user_wallet: bet.user_wallet,
            outcome: bet.outcome as 'YES' | 'NO',
            amount: bet.amount,
            shares: bet.shares,
            potential_payout: currentValue,
            created_at: bet.created_at,
            end_date: market.end_date,
            status: 'PENDING_RESOLUTION'
          })
        } else if (market.status === 'RESOLVED') {
          // Check if user won
          const userWon = market.outcome === bet.outcome
          const payout = userWon ? currentValue : 0
          const actualPnL = payout - bet.amount

          // Add to history
          history.push({
            id: bet.id,
            market_id: market.market_id,
            market_title: market.question,
            user_wallet: bet.user_wallet,
            outcome: userWon ? 'WIN' : 'LOSS',
            bet_outcome: bet.outcome as 'YES' | 'NO',
            amount: bet.amount,
            payout: payout,
            pnl: actualPnL,
            roi_percentage: (actualPnL / bet.amount) * 100,
            created_at: bet.created_at,
            resolved_at: market.resolved_at || new Date().toISOString(),
            winning_outcome: market.outcome as 'YES' | 'NO' | null,
            claimed: bet.claimed || false
          })

          // Check if claimable
          if (userWon && !bet.claimed && payout > 0) {
            claimable.push({
              market_id: market.market_id,
              market_title: market.question,
              amount: payout,
              winning_outcome: market.outcome as 'YES' | 'NO',
              resolved_at: market.resolved_at || new Date().toISOString()
            })
          }
        } else if (market.status === 'CANCELLED') {
          // Cancelled market - refund available
          history.push({
            id: bet.id,
            market_id: market.market_id,
            market_title: market.question,
            user_wallet: bet.user_wallet,
            outcome: 'CANCELLED',
            bet_outcome: bet.outcome as 'YES' | 'NO',
            amount: bet.amount,
            payout: bet.amount, // Full refund
            pnl: 0,
            roi_percentage: 0,
            created_at: bet.created_at,
            resolved_at: market.resolved_at || new Date().toISOString(),
            winning_outcome: null,
            claimed: bet.claimed || false
          })

          // Add to claimable if not claimed
          if (!bet.claimed) {
            claimable.push({
              market_id: market.market_id,
              market_title: market.question,
              amount: bet.amount,
              winning_outcome: null,
              resolved_at: market.resolved_at || new Date().toISOString()
            })
          }
        }
      }

      setActiveBets(active)
      setPendingBets(pending)
      setClaimablePayouts(claimable)
      setBetHistory(history)
    } catch (err) {
      console.error('Error fetching user bets:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch user bets'))
    } finally {
      setIsLoading(false)
    }
  }, [walletAddress])

  // Initial fetch
  useEffect(() => {
    fetchUserBets()
  }, [fetchUserBets])

  // Set up real-time subscription for bet updates
  useEffect(() => {
    if (!walletAddress) return

    const channel = supabase
      .channel('user_bets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bets',
          filter: `user_wallet=eq.${walletAddress}`
        },
        () => {
          // Refetch when bets change
          fetchUserBets()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [walletAddress, fetchUserBets])

  return {
    activeBets,
    pendingBets,
    claimablePayouts,
    betHistory,
    isLoading,
    error,
    refetch: fetchUserBets
  }
}
