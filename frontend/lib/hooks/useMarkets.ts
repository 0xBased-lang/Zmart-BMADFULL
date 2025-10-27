'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Market } from '@/lib/types/database'

// Re-export Market type from database for convenience
export type { Market } from '@/lib/types/database'

interface UseMarketsReturn {
  markets: Market[]
  loading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Hook to fetch all active markets from Supabase
 *
 * @returns {UseMarketsReturn} Markets data, loading state, error state, and refetch function
 *
 * @example
 * ```tsx
 * function MarketList() {
 *   const { markets, loading, error } = useMarkets()
 *
 *   if (loading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *
 *   return (
 *     <ul>
 *       {markets.map(market => (
 *         <li key={market.id}>{market.question}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useMarkets(): UseMarketsReturn {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchMarkets = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('markets')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // Map data to include market_id from program_market_id if needed
      const mappedData = (data || []).map((item: any) => ({
        ...item,
        market_id: item.market_id || parseInt(item.program_market_id || item.id || '0')
      }))

      setMarkets(mappedData as Market[])
    } catch (e) {
      console.error('Failed to fetch markets:', e)
      setError(e as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarkets()
  }, [])

  return {
    markets,
    loading,
    error,
    refetch: fetchMarkets,
  }
}

/**
 * Hook to fetch a single market by ID
 *
 * @param marketId - The market ID to fetch
 * @returns Market data, loading state, and error state
 */
export function useMarket(marketId: string | null) {
  const [market, setMarket] = useState<Market | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!marketId) {
      setLoading(false)
      return
    }

    async function fetchMarket() {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('markets')
          .select('*')
          .eq('id', marketId)
          .single()

        if (fetchError) throw fetchError

        // Map data to include market_id from program_market_id if needed
        const mappedData = data ? {
          ...data,
          market_id: data.market_id || parseInt(data.program_market_id || data.id || '0')
        } : null

        setMarket(mappedData as Market)
      } catch (e) {
        console.error('Failed to fetch market:', e)
        setError(e as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchMarket()
  }, [marketId])

  return { market, loading, error }
}
