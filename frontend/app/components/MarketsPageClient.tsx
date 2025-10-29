'use client'

import { useState, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/navigation'
import type { Market } from '@/lib/types/database'
import { MarketCard } from './MarketCard'
import { SearchBar } from './SearchBar'
import { CategoryFilter } from './CategoryFilter'
import { SortDropdown, type SortOption } from './SortDropdown'

interface MarketsPageClientProps {
  initialMarkets: Market[]
}

export function MarketsPageClient({ initialMarkets }: MarketsPageClientProps) {
  const { connected } = useWallet()
  const router = useRouter()
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          {/* Hero Content */}
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 animate-gradient">
              BMAD-Zmart Markets
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Decentralized prediction markets on Solana. Bet on the future, earn from being right.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <button
                onClick={() => router.push(connected ? '/propose' : '/')}
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold text-lg shadow-2xl shadow-purple-500/50 transition-all transform hover:scale-105 hover:shadow-purple-500/75"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Market
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
              </button>

              <button
                onClick={() => window.scrollTo({ top: document.getElementById('markets')?.offsetTop || 0, behavior: 'smooth' })}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-lg text-white rounded-xl font-bold text-lg border border-white/20 transition-all transform hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Explore Markets
                </span>
              </button>

              {connected && (
                <button
                  onClick={() => router.push('/my-bets')}
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold text-lg shadow-2xl shadow-green-500/50 transition-all transform hover:scale-105"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    My Bets
                  </span>
                </button>
              )}
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {[
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  title: 'Lightning Fast',
                  description: 'Powered by Solana for instant transactions',
                  gradient: 'from-yellow-500 to-orange-500'
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  title: 'Secure & Fair',
                  description: 'Decentralized with transparent outcomes',
                  gradient: 'from-green-500 to-emerald-500'
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ),
                  title: 'Community Driven',
                  description: 'Vote on proposals, shape the platform',
                  gradient: 'from-purple-500 to-pink-500'
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: 'Earn Rewards',
                  description: 'Profit from accurate predictions',
                  gradient: 'from-blue-500 to-cyan-500'
                }
              ].map((feature, i) => (
                <div
                  key={i}
                  className="relative group"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="relative bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all transform hover:scale-105 hover:-translate-y-2">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} text-white mb-4 shadow-lg`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="relative">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center transform hover:scale-105 transition-transform">
                  <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                    {initialMarkets.length}
                  </div>
                  <div className="text-gray-400 text-sm uppercase tracking-wide">Total Markets</div>
                </div>
                <div className="text-center transform hover:scale-105 transition-transform">
                  <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2">
                    {activeMarkets}
                  </div>
                  <div className="text-gray-400 text-sm uppercase tracking-wide">Active Now</div>
                </div>
                <div className="text-center transform hover:scale-105 transition-transform">
                  <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
                    {(totalVolume / 1e9).toFixed(1)} SOL
                  </div>
                  <div className="text-gray-400 text-sm uppercase tracking-wide">Total Volume</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Markets Section */}
      <div id="markets" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Active Markets
          </h2>
          <p className="text-gray-400 text-lg">
            Browse markets and place your predictions
          </p>
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
                Showing <span className="text-white font-bold">{filteredMarkets.length}</span> market{filteredMarkets.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredMarkets.map((market, i) => (
                <div
                  key={market.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <MarketCard market={market} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Floating Action Button (Mobile) */}
      {connected && (
        <button
          onClick={() => router.push('/propose')}
          className="fixed bottom-6 right-6 md:hidden w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full shadow-2xl shadow-purple-500/50 flex items-center justify-center z-50 transition-all transform hover:scale-110 active:scale-95"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  )
}
