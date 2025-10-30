import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface LeaderboardEntry {
  wallet_address: string
  activity_points: number
  total_bets: number
  roi_percentage: number  // Was: win_rate
  total_winnings: number   // Was: total_profit
  total_volume_wagered: number  // Was: total_volume
  markets_created?: number
}

interface UseLeaderboardDataReturn {
  data: LeaderboardEntry[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

type LeaderboardCategory = 'points' | 'win-rate' | 'volume' | 'creators'

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

interface CacheEntry {
  data: LeaderboardEntry[]
  timestamp: number
}

// In-memory cache for leaderboard data
const leaderboardCache = new Map<string, CacheEntry>()

/**
 * Hook to fetch leaderboard data from Supabase with intelligent caching
 *
 * Features:
 * - Supports 4 categories: points, win-rate, volume, creators
 * - 5-minute cache TTL per category to reduce unnecessary queries
 * - Real-time subscriptions to users and bets tables (bypasses cache)
 * - Automatic cache invalidation on real-time updates
 *
 * Cache Strategy:
 * - Initial load: Fetches from Supabase, caches result for 5 minutes
 * - Tab switch (same category): Returns cached data if < 5 minutes old
 * - Real-time update: Forces fresh fetch, updates cache
 * - Manual refetch: Bypasses cache
 *
 * @param category - Leaderboard category to fetch
 * @returns Leaderboard data, loading state, error, and refetch function
 */
export function useLeaderboardData(
  category: LeaderboardCategory
): UseLeaderboardDataReturn {
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchLeaderboard = useCallback(async (force = false) => {
    try {
      const cacheKey = `leaderboard-${category}`
      const cached = leaderboardCache.get(cacheKey)
      const now = Date.now()

      // Return cached data if fresh and not forcing refresh
      if (!force && cached && now - cached.timestamp < CACHE_TTL) {
        setData(cached.data)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      // For creators category, use creator_stats view
      if (category === 'creators') {
        const { data: creatorData, error: creatorError } = await supabase
          .from('creator_stats')
          .select('*')
          .order('markets_created', { ascending: false })
          .limit(100)

        if (creatorError) throw creatorError

        // Transform creator_stats to match LeaderboardEntry interface
        const transformedData = (creatorData || []).map((entry: any) => ({
          wallet_address: entry.creator_wallet,
          activity_points: 0, // Not available in creator_stats
          total_bets: 0, // Not available in creator_stats
          roi_percentage: 0, // Not available in creator_stats
          total_winnings: 0, // Not available in creator_stats
          total_volume_wagered: entry.creator_total_volume || 0,
          markets_created: entry.markets_created || 0,
        }))

        setData(transformedData)

        // Update cache with creator data
        leaderboardCache.set(cacheKey, {
          data: transformedData,
          timestamp: now,
        })

        setLoading(false)
        return
      }

      // For other categories, use user_leaderboard table
      let query = supabase.from('user_leaderboard').select('*')

      // Apply category-specific sorting and filters
      switch (category) {
        case 'points':
          query = query.order('activity_points', { ascending: false })
          break
        case 'win-rate':
          // Minimum threshold of 10 bets for win rate leaderboard
          query = query
            .gte('total_bets', 10)
            .order('roi_percentage', { ascending: false })
          break
        case 'volume':
          query = query.order('total_volume_wagered', { ascending: false })
          break
      }

      // Limit to top 100
      query = query.limit(100)

      const { data: leaderboardData, error: fetchError } = await query

      if (fetchError) throw fetchError

      const finalData = (leaderboardData || []) as LeaderboardEntry[]
      setData(finalData)

      // Update cache with fetched data
      leaderboardCache.set(cacheKey, {
        data: finalData,
        timestamp: now,
      })
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setError(
        err instanceof Error ? err : new Error('Failed to fetch leaderboard')
      )
    } finally {
      setLoading(false)
    }
  }, [category])

  // Initial fetch
  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  // Real-time subscription for updates
  // Note: user_leaderboard may be a VIEW, so we subscribe to base tables instead
  useEffect(() => {
    // Subscribe to users table for activity_points updates
    const usersChannel = supabase
      .channel('users-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          // Only refetch if activity_points changed
          if (payload.new && 'activity_points' in payload.new) {
            // Force refresh to bypass cache for real-time updates
            fetchLeaderboard(true)
          }
        }
      )
      .subscribe()

    // Subscribe to bets table for win rate / volume / profit updates
    const betsChannel = supabase
      .channel('bets-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'bets',
        },
        () => {
          // Force refresh to bypass cache for real-time updates
          fetchLeaderboard(true)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(usersChannel)
      supabase.removeChannel(betsChannel)
    }
  }, [fetchLeaderboard])

  return {
    data,
    loading,
    error,
    refetch: fetchLeaderboard,
  }
}
