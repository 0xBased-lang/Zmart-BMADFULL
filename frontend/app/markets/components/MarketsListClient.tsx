'use client'

import { useState, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/navigation'
import { useHydrated } from '@/lib/hooks/useHydrated'
import type { Market } from '@/lib/types/database'
import { MarketCard } from '../../components/MarketCard'
import { SearchBar } from '../../components/SearchBar'
import { CategoryFilter } from '../../components/CategoryFilter'
import { SortDropdown, type SortOption } from '../../components/SortDropdown'

interface MarketsListClientProps {
  initialMarkets: Market[]
}

export function MarketsListClient({ initialMarkets }: MarketsListClientProps) {
  const { connected } = useWallet()
  const router = useRouter()
  const hydrated = useHydrated()
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('trending')

  // Filter and sort markets
  const filteredMarkets = useMemo(() => {
    let filtered = [...initialMarkets]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((market) =>
        (market.question || market.title || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (category !== 'all') {
      filtered = filtered.filter(
        (market) =>
          market.category?.toLowerCase() === category.toLowerCase()
      )
    }

    // Sort
    switch (sortBy) {
      case 'trending':
        filtered.sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0))
        break
      case 'ending-soon':
        filtered.sort(
          (a, b) =>
            new Date(a.end_date || a.end_time || 0).getTime() - new Date(b.end_date || b.end_time || 0).getTime()
        )
        break
      case 'recent':
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        break
    }

    return filtered
  }, [initialMarkets, searchQuery, category, sortBy])

  // Calculate stats
  const totalVolume = initialMarkets.reduce((sum, market) => sum + (market.total_volume || 0), 0)
  const activeMarkets = initialMarkets.filter(m => m.status === 'active').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900" data-hydrated={hydrated}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            All Markets
          </h1>
          <p className="text-gray-400 text-lg">
            Browse all prediction markets and place your bets
          </p>
        </div>

        {/* Stats Dashboard */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                  {initialMarkets.length}
                </div>
                <div className="text-gray-400 text-sm uppercase tracking-wide">Total Markets</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2">
                  {activeMarkets}
                </div>
                <div className="text-gray-400 text-sm uppercase tracking-wide">Active Now</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
                  {(totalVolume / 1e9).toFixed(1)} SOL
                </div>
                <div className="text-gray-400 text-sm uppercase tracking-wide">Total Volume</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1">
            <SearchBar onSearch={setSearchQuery} />
          </div>
          <CategoryFilter value={category} onChange={setCategory} />
          <SortDropdown value={sortBy} onChange={setSortBy} />
        </div>

        {/* Empty State */}
        {filteredMarkets.length === 0 && (
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-16 text-center border border-white/10">
            <svg className="w-24 h-24 mx-auto mb-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-400 text-xl mb-4">
              {searchQuery || category !== 'all'
                ? 'No markets match your filters'
                : 'No active markets yet'}
            </p>
            <p className="text-gray-500 mb-6">
              {searchQuery || category !== 'all'
                ? 'Try adjusting your search or category'
                : 'Be the first to create a prediction market!'}
            </p>
            <button
              onClick={() => router.push(connected ? '/propose' : '/')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold text-lg shadow-2xl shadow-purple-500/50 transition-all transform hover:scale-105"
            >
              Create First Market
            </button>
          </div>
        )}

        {/* Markets Grid */}
        {filteredMarkets.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-400">
                Showing {filteredMarkets.length} {filteredMarkets.length === 1 ? 'market' : 'markets'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredMarkets.map((market, index) => (
                <div
                  key={market.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <MarketCard market={market} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
