'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Market } from './useMarkets'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface UseMarketUpdatesReturn {
  markets: Market[]
  loading: boolean
  error: Error | null
}

/**
 * Hook to subscribe to real-time market updates via Supabase
 *
 * Automatically fetches initial data and subscribes to INSERT, UPDATE, DELETE events
 * on the markets table. Updates are reflected immediately in the UI.
 *
 * @returns {UseMarketUpdatesReturn} Markets with real-time updates, loading state, error state
 *
 * @example
 * ```tsx
 * function LiveMarketList() {
 *   const { markets, loading, error } = useMarketUpdates()
 *
 *   if (loading) return <div>Loading live markets...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *
 *   return (
 *     <div>
 *       <p>{markets.length} markets (live updates enabled)</p>
 *       <ul>
 *         {markets.map(market => (
 *           <li key={market.id}>
 *             {market.question} - {market.status}
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 */
export function useMarketUpdates(): UseMarketUpdatesReturn {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Initial fetch
    const fetchMarkets = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('markets')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        setMarkets(data as Market[] || [])
        setLoading(false)
      } catch (e) {
        console.error('Failed to fetch markets:', e)
        setError(e as Error)
        setLoading(false)
      }
    }

    fetchMarkets()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('market-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'markets',
        },
        (payload: RealtimePostgresChangesPayload<Market>) => {
          console.log('Market change detected:', payload.eventType, payload)

          if (payload.eventType === 'INSERT' && payload.new) {
            // Add new market to list if active
            const newMarket = payload.new as Market
            if (newMarket.status === 'active') {
              setMarkets((current) => [newMarket, ...current])
            }
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            // Update existing market
            const updatedMarket = payload.new as Market
            setMarkets((current) =>
              current.map((market) =>
                market.id === updatedMarket.id ? updatedMarket : market
              )
            )
          } else if (payload.eventType === 'DELETE' && payload.old) {
            // Remove deleted market
            const deletedMarket = payload.old as Market
            setMarkets((current) =>
              current.filter((market) => market.id !== deletedMarket.id)
            )
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { markets, loading, error }
}

/**
 * Hook to subscribe to real-time odds updates for a specific market
 *
 * @param marketId - The market ID to subscribe to
 * @returns Market data with live odds updates
 */
export function useLiveOdds(marketId: string | null) {
  const [market, setMarket] = useState<Market | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!marketId) {
      setLoading(false)
      return
    }

    // Initial fetch
    const fetchMarket = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('markets')
          .select('*')
          .eq('id', marketId)
          .single()

        if (fetchError) throw fetchError

        setMarket(data as Market)
        setLoading(false)
      } catch (e) {
        console.error('Failed to fetch market:', e)
        setError(e as Error)
        setLoading(false)
      }
    }

    fetchMarket()

    // Subscribe to real-time updates for this specific market
    const channel = supabase
      .channel(`market-${marketId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'markets',
          filter: `id=eq.${marketId}`,
        },
        (payload: RealtimePostgresChangesPayload<Market>) => {
          console.log('Market odds updated:', payload)
          if (payload.new) {
            setMarket(payload.new as Market)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [marketId])

  return { market, loading, error }
}

/**
 * Hook to subscribe to real-time vote count updates for a market
 *
 * @param marketId - The market ID to track votes for
 * @returns Vote count and real-time updates
 */
export function useVoteCounts(marketId: string | null) {
  const [voteCount, setVoteCount] = useState<{
    yes: number
    no: number
    invalid: number
    total: number
  }>({
    yes: 0,
    no: 0,
    invalid: 0,
    total: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!marketId) {
      setLoading(false)
      return
    }

    // Initial fetch
    const fetchVoteCounts = async () => {
      try {
        const { data, error } = await supabase
          .from('resolution_votes')
          .select('vote')
          .eq('market_id', marketId)

        if (error) throw error

        const counts = (data || []).reduce(
          (acc, vote) => {
            acc[vote.vote as 'yes' | 'no' | 'invalid']++
            acc.total++
            return acc
          },
          { yes: 0, no: 0, invalid: 0, total: 0 }
        )

        setVoteCount(counts)
        setLoading(false)
      } catch (e) {
        console.error('Failed to fetch vote counts:', e)
        setLoading(false)
      }
    }

    fetchVoteCounts()

    // Subscribe to real-time vote changes
    const channel = supabase
      .channel(`votes-${marketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'resolution_votes',
          filter: `market_id=eq.${marketId}`,
        },
        (payload) => {
          console.log('New vote received:', payload)
          // Re-fetch counts when new vote comes in
          fetchVoteCounts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [marketId])

  return { voteCount, loading }
}
