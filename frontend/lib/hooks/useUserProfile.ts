import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface UserStats {
  wallet_address: string
  activity_points: number
  total_bets: number
  win_rate: number
  total_profit: number
  total_volume: number
  markets_created: number
}

export interface RecentBet {
  id: string
  market_id: number
  outcome: 'YES' | 'NO'
  amount: number
  profit_loss: number | null
  created_at: string
  market: {
    id: string
    title: string // Database uses 'title' not 'question'
    question?: string // Backwards compatibility alias
    status: string
    winning_outcome: string | null
  }
}

export interface CreatedMarket {
  id: string
  market_id: number
  title: string // Database uses 'title' not 'question'
  question?: string // Backwards compatibility alias
  status: string
  total_volume: number
  created_at: string
}

interface UseUserProfileReturn {
  stats: UserStats | null
  recentBets: RecentBet[]
  createdMarkets: CreatedMarket[]
  loading: boolean
  error: Error | null
}

/**
 * Hook to fetch comprehensive user profile data
 * Includes stats, recent bets, and created markets
 *
 * @param walletAddress - User's Solana wallet address
 * @returns User profile data with loading and error states
 */
export function useUserProfile(walletAddress: string): UseUserProfileReturn {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentBets, setRecentBets] = useState<RecentBet[]>([])
  const [createdMarkets, setCreatedMarkets] = useState<CreatedMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch user stats from user_stats view
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single()

      // Don't throw error if user not found, just use defaults
      if (statsError && statsError.code !== 'PGRST116') {
        throw statsError
      }

      // Fetch recent bets (last 10)
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select(`
          *,
          markets (
            id,
            question,
            status,
            winning_outcome
          )
        `)
        .eq('user_wallet', walletAddress)
        .order('created_at', { ascending: false })
        .limit(10)

      if (betsError) throw betsError

      // Fetch created markets
      const { data: marketsData, error: marketsError } = await supabase
        .from('markets')
        .select('*')
        .eq('creator_wallet', walletAddress)
        .order('created_at', { ascending: false })
        .limit(20)

      if (marketsError) throw marketsError

      // Get creator stats
      const { data: creatorStats, error: creatorError } = await supabase
        .from('creator_stats')
        .select('markets_created')
        .eq('creator_wallet', walletAddress)
        .single()

      // Combine stats with creator data
      const combinedStats: UserStats = {
        wallet_address: walletAddress,
        activity_points: statsData?.activity_points || 0,
        total_bets: statsData?.total_bets || 0,
        win_rate: statsData?.win_rate || 0,
        total_profit: statsData?.total_profit || 0,
        total_volume: statsData?.total_volume || 0,
        markets_created: creatorStats?.markets_created || 0,
      }

      setStats(combinedStats)
      setRecentBets((betsData || []) as RecentBet[])
      setCreatedMarkets((marketsData || []) as CreatedMarket[])
    } catch (err) {
      console.error('Error fetching user profile:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'))
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  useEffect(() => {
    fetchUserProfile()
  }, [fetchUserProfile])

  return {
    stats,
    recentBets,
    createdMarkets,
    loading,
    error,
  }
}
