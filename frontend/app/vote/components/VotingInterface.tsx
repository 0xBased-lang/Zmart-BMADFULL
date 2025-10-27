'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Market } from '@/lib/types/database'
import { VotingMarketCard } from './VotingMarketCard'

export function VotingInterface() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchVotingMarkets() {
      try {
        setLoading(true)
        setError(null)

        // Query markets with status='locked' (voting period)
        // Note: Based on architecture, markets in voting period have status='locked'
        const { data, error: fetchError } = await supabase
          .from('markets')
          .select('*')
          .eq('status', 'locked')
          .order('end_time', { ascending: true })

        if (fetchError) {
          throw fetchError
        }

        setMarkets(data || [])
      } catch (err) {
        console.error('Error fetching voting markets:', err)
        setError(err instanceof Error ? err.message : 'Failed to load voting markets')
      } finally {
        setLoading(false)
      }
    }

    fetchVotingMarkets()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Vote on Market Resolutions</h1>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading markets...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Vote on Market Resolutions</h1>
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
          <p className="text-red-400 mb-2">Failed to load voting markets</p>
          <p className="text-sm text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (markets.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Vote on Market Resolutions</h1>
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-12 text-center">
          <p className="text-xl text-gray-300 mb-2">No markets currently in voting period</p>
          <p className="text-gray-500 mb-6">
            Markets enter the voting period after their end time. Check back later to vote on outcomes.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            Browse Active Markets
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Vote on Market Resolutions</h1>
        <p className="text-gray-400">
          Help determine market outcomes with your wallet signature. Zero gas fees.
        </p>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span className="text-gray-300">
            <span className="text-green-400 font-semibold">{markets.length}</span> market{markets.length !== 1 ? 's' : ''} awaiting resolution
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {markets.map((market) => (
          <VotingMarketCard key={market.id} market={market} />
        ))}
      </div>
    </div>
  )
}
