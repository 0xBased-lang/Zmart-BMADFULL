'use client'

import { useState, useMemo } from 'react'
import { useMarkets } from '@/lib/hooks/useMarkets'
import { MarketCard } from './components/MarketCard'
import { SearchBar } from './components/SearchBar'
import { CategoryFilter } from './components/CategoryFilter'
import { SortDropdown, type SortOption } from './components/SortDropdown'
import { StatsHeader } from './components/StatsHeader'

export default function Home() {
  const { markets, loading, error } = useMarkets()
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('trending')

  // Filter and sort markets
  const filteredMarkets = useMemo(() => {
    let filtered = [...markets]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((market) =>
        market.question.toLowerCase().includes(searchQuery.toLowerCase())
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
            new Date(a.end_time).getTime() - new Date(b.end_time).getTime()
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
  }, [markets, searchQuery, category, sortBy])

  // Calculate stats
  const totalVolume = markets.reduce((sum, market) => sum + (market.total_volume || 0), 0)

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">
          BMAD-Zmart Prediction Markets
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover and bet on community-driven predictions
        </p>
      </div>

      {/* Stats Header */}
      <StatsHeader totalMarkets={markets.length} totalVolume={totalVolume} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchBar onSearch={setSearchQuery} />
        <CategoryFilter value={category} onChange={setCategory} />
        <SortDropdown value={sortBy} onChange={setSortBy} />
      </div>

      {/* Markets Grid */}
      {loading && (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500">Loading markets...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-2">
            Error loading markets
          </p>
          <p className="text-red-500 dark:text-red-500 text-sm">
            {error.message}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Make sure Supabase is running and environment variables are configured.
          </p>
        </div>
      )}

      {!loading && !error && filteredMarkets.length === 0 && (
        <div className="p-12 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {searchQuery || category !== 'all'
              ? 'No markets match your filters. Try adjusting your search or category.'
              : 'No active markets found. Be the first to create one!'}
          </p>
        </div>
      )}

      {!loading && !error && filteredMarkets.length > 0 && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredMarkets.length} market{filteredMarkets.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
