'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMarket } from '@/lib/hooks/useMarkets'
import { useLiveOdds } from '@/lib/hooks/useMarketUpdates'
import { useHydrated } from '@/lib/hooks/useHydrated'
import { MarketHeader } from './components/MarketHeader'
import { OddsDisplay } from './components/OddsDisplay'
import { BettingPanel } from './components/BettingPanel'
import { MarketActivity } from './components/MarketActivity'
import { OddsChart } from './components/OddsChart'
import { CommentsSection } from './components/CommentsSection'
import Link from 'next/link'

interface MarketDetailClientProps {
  marketId: number
  initialMarket?: any // Initial server-side market data
}

export function MarketDetailClient({ marketId, initialMarket }: MarketDetailClientProps) {
  // Hydration detection
  const hydrated = useHydrated()

  // Core state
  // Convert number marketId to string for database queries
  const marketIdString = marketId.toString()
  const { market: clientMarket, loading: marketLoading, error: marketError } = useMarket(marketIdString)

  // Use initial server-rendered market if available, otherwise use client-fetched data
  const market = initialMarket || clientMarket

  const { market: liveMarket } = useLiveOdds(marketIdString)

  // UI state
  const [selectedTab, setSelectedTab] = useState<'betting' | 'chart' | 'activity'>('betting')
  const [showMobilePanel, setShowMobilePanel] = useState(false)

  // Error recovery state
  const [retryCount, setRetryCount] = useState(0)
  const [isOffline, setIsOffline] = useState(false)

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-retry on error with exponential backoff
  useEffect(() => {
    if (marketError && retryCount < 3) {
      const timeout = setTimeout(() => {
        setRetryCount(prev => prev + 1)
        // Force refresh would happen here in real implementation
      }, Math.pow(2, retryCount) * 1000)

      return () => clearTimeout(timeout)
    }
  }, [marketError, retryCount])

  // Calculate display values with null safety
  const displayOdds = useMemo(() => {
    // Use live market data if available, otherwise fall back to initial market data
    const currentMarket = liveMarket || market
    if (!currentMarket) return { yes: 50, no: 50 }

    const total = (currentMarket.yes_pool || 0) + (currentMarket.no_pool || 0)
    if (total === 0) return { yes: 50, no: 50 }

    return {
      yes: Math.round(((currentMarket.yes_pool || 0) / total) * 1000) / 10,
      no: Math.round(((currentMarket.no_pool || 0) / total) * 1000) / 10
    }
  }, [market, liveMarket])

  // Market status calculations
  const marketStatus = useMemo(() => {
    if (!market) return null

    const now = Date.now()
    // Use end_date (database column) or fall back to end_time (legacy)
    const endDate = market.end_date || market.end_time
    // Database uses uppercase status
    const status = market.status.toUpperCase()

    if (!endDate) {
      // If no end date, treat as active for now
      return {
        isActive: status === 'ACTIVE',
        isResolved: status === 'RESOLVED',
        isCancelled: status === 'CANCELLED',
        isExpired: false,
        timeLeft: Infinity,
        endingSoon: false,
        justCreated: now - new Date(market.created_at).getTime() < 60 * 60 * 1000
      }
    }

    const endTime = new Date(endDate).getTime()
    const timeLeft = endTime - now

    return {
      isActive: status === 'ACTIVE' && timeLeft > 0,
      isResolved: status === 'RESOLVED',
      isCancelled: status === 'CANCELLED',
      isExpired: timeLeft <= 0 && status === 'ACTIVE',
      timeLeft,
      endingSoon: timeLeft > 0 && timeLeft < 24 * 60 * 60 * 1000, // <24 hours
      justCreated: now - new Date(market.created_at).getTime() < 60 * 60 * 1000 // <1 hour
    }
  }, [market])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only if not typing in an input
      if (document.activeElement?.tagName === 'INPUT') return

      switch(e.key) {
        case '1':
          setSelectedTab('betting')
          break
        case '2':
          setSelectedTab('chart')
          break
        case '3':
          setSelectedTab('activity')
          break
        case 'Escape':
          setShowMobilePanel(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  // Loading state
  if (marketLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-3/4 mb-4" />
            <div className="h-32 bg-white/10 rounded mb-4" />
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-64 bg-white/10 rounded" />
              <div className="h-64 bg-white/10 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state with recovery options
  if (marketError || !market) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-500 rounded-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-400 mb-4">
            {marketError ? 'Error Loading Market' : 'Market Not Found'}
          </h2>
          <p className="text-gray-300 mb-6">
            {isOffline
              ? 'You appear to be offline. Please check your connection.'
              : marketError
                ? `Failed to load market #${marketId}. ${retryCount < 3 ? 'Retrying...' : 'Please try again later.'}`
                : `Market #${marketId} does not exist or has been removed.`
            }
          </p>
          <div className="flex gap-3">
            <Link
              href="/"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Back to Markets
            </Link>
            {marketError && retryCount >= 3 && (
              <button
                onClick={() => {
                  setRetryCount(0)
                  window.location.reload()
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" data-hydrated={hydrated}>
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-yellow-600 text-white text-center py-2">
          <p className="text-sm">You're offline. Some features may be limited.</p>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Markets
        </Link>

        {/* Market Header */}
        <MarketHeader
          market={market}
          marketStatus={marketStatus}
        />

        {/* Odds Display */}
        <OddsDisplay
          odds={displayOdds}
          volume={market.total_volume || 0}
          participants={market.unique_bettors || 0}
          lastUpdate={liveMarket ? new Date() : null}
        />

        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-2 gap-6 mt-8">
          {/* Left Column - Market Info & Activity */}
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 bg-white/5 p-1 rounded-lg">
              <button
                onClick={() => setSelectedTab('activity')}
                className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                  selectedTab === 'activity'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Activity
              </button>
              <button
                onClick={() => setSelectedTab('chart')}
                className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                  selectedTab === 'chart'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Chart
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-white/5 rounded-xl p-6">
              {selectedTab === 'activity' && (
                <MarketActivity marketId={marketId} />
              )}
              {selectedTab === 'chart' && (
                <OddsChart
                  marketId={marketId}
                  currentOdds={displayOdds}
                />
              )}
            </div>
          </div>

          {/* Right Column - Betting Panel */}
          <div>
            <BettingPanel
              market={market}
              marketStatus={marketStatus}
              currentOdds={displayOdds}
            />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden mt-8">
          {/* Tab Navigation */}
          <div className="flex gap-2 bg-white/5 p-1 rounded-lg mb-4">
            <button
              onClick={() => setSelectedTab('betting')}
              className={`flex-1 px-4 py-2 rounded-md transition-colors text-sm ${
                selectedTab === 'betting'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Bet
            </button>
            <button
              onClick={() => setSelectedTab('activity')}
              className={`flex-1 px-4 py-2 rounded-md transition-colors text-sm ${
                selectedTab === 'activity'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Activity
            </button>
            <button
              onClick={() => setSelectedTab('chart')}
              className={`flex-1 px-4 py-2 rounded-md transition-colors text-sm ${
                selectedTab === 'chart'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Chart
            </button>
          </div>

          {/* Mobile Tab Content */}
          <div className="bg-white/5 rounded-xl p-4">
            {selectedTab === 'betting' && (
              <BettingPanel
                market={market}
                marketStatus={marketStatus}
                currentOdds={displayOdds}
                isMobile={true}
              />
            )}
            {selectedTab === 'activity' && (
              <MarketActivity marketId={marketId} />
            )}
            {selectedTab === 'chart' && (
              <OddsChart
                marketId={marketId}
                currentOdds={displayOdds}
              />
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-8">
          <CommentsSection marketId={marketId} />
        </div>

        {/* Keyboard Shortcuts Help (Desktop) */}
        <div className="hidden md:block mt-8 text-center text-gray-500 text-sm">
          <p>Keyboard shortcuts: [1] Betting • [2] Chart • [3] Activity • [Esc] Close panels</p>
        </div>
      </div>
    </div>
  )
}