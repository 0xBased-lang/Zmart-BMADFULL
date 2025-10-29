'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/navigation'
import { useHydrated } from '@/lib/hooks/useHydrated'
import { PortfolioHeader } from './components/PortfolioHeader'
import { ActiveBets } from './components/ActiveBets'
import { PendingResolutions } from './components/PendingResolutions'
import { ClaimablePayouts } from './components/ClaimablePayouts'
import { WinLossStats } from './components/WinLossStats'
import { useUserBets } from '@/lib/hooks/useUserBets'
import { usePortfolioMetrics } from '@/lib/hooks/usePortfolioMetrics'
import { useClaimPayouts } from '@/lib/hooks/useClaimPayouts'

type SortBy = 'recent' | 'ending' | 'pnl' | 'amount'
type TabView = 'overview' | 'active' | 'pending' | 'claimable' | 'history'

export function DashboardClient() {
  const { publicKey, connected, connecting } = useWallet()
  const router = useRouter()
  const hydrated = useHydrated()

  // UI state
  const [currentTab, setCurrentTab] = useState<TabView>('overview')
  const [sortBy, setSortBy] = useState<SortBy>('recent')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Fetch user bets using custom hook
  const {
    activeBets,
    pendingBets,
    claimablePayouts,
    betHistory,
    isLoading,
    error,
    refetch
  } = useUserBets(publicKey?.toBase58() || null)

  // Calculate portfolio metrics
  const portfolioMetrics = usePortfolioMetrics({
    activeBets,
    claimablePayouts,
    betHistory
  })

  // Claim payouts functionality
  const { claimPayout, isClaiming } = useClaimPayouts()

  // Redirect if not connected (with grace period for connecting)
  useEffect(() => {
    const checkAuthTimeout = setTimeout(() => {
      if (!connected && !connecting) {
        router.push('/')
      }
    }, 2000) // 2 second grace period

    return () => clearTimeout(checkAuthTimeout)
  }, [connected, connecting, router])

  // Network status monitoring with offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      refetch() // Refresh data when back online
    }

    const handleOffline = () => {
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial online status
    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [refetch])

  // Error recovery with exponential backoff
  useEffect(() => {
    if (error && retryCount < 3) {
      const retryDelay = Math.pow(2, retryCount) * 1000
      const timeout = setTimeout(() => {
        setRetryCount(prev => prev + 1)
        refetch()
      }, retryDelay)

      return () => clearTimeout(timeout)
    }
  }, [error, retryCount, refetch])

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    setRetryCount(0) // Reset retry count
    await refetch()
    setIsRefreshing(false)
  }, [refetch])

  // Handle claim payout
  const handleClaim = useCallback(async (marketId: number) => {
    try {
      await claimPayout(marketId)
      // Refetch data after successful claim
      await refetch()
    } catch (err) {
      console.error('Claim failed:', err)
      // Error is handled by useClaimPayouts hook
    }
  }, [claimPayout, refetch])

  // Sort active bets
  const sortedActiveBets = useMemo(() => {
    const sorted = [...activeBets]

    switch (sortBy) {
      case 'recent':
        sorted.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        break
      case 'ending':
        sorted.sort((a, b) =>
          new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
        )
        break
      case 'pnl':
        sorted.sort((a, b) => (b.unrealized_pnl || 0) - (a.unrealized_pnl || 0))
        break
      case 'amount':
        sorted.sort((a, b) => b.amount - a.amount)
        break
    }

    return sorted
  }, [activeBets, sortBy])

  // Loading state with skeleton
  if (isLoading && !isRefreshing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            {/* Header skeleton */}
            <div className="space-y-2">
              <div className="h-8 bg-white/10 rounded w-48" />
              <div className="h-4 bg-white/10 rounded w-64" />
            </div>

            {/* Portfolio header skeleton */}
            <div className="h-32 bg-white/10 rounded-xl" />

            {/* Content skeleton */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="h-64 bg-white/10 rounded-xl" />
              <div className="h-64 bg-white/10 rounded-xl" />
              <div className="h-64 bg-white/10 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not connected state (shouldn't reach here due to redirect, but defensive)
  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-4">Wallet Not Connected</h2>
          <p className="text-gray-300 mb-6">Please connect your wallet to view your dashboard</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  // Error state after exhausted retries
  if (error && retryCount >= 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-500 rounded-xl p-8 max-w-md w-full">
          <div className="text-5xl mb-4 text-center">⚠️</div>
          <h2 className="text-2xl font-bold text-red-400 mb-4 text-center">Error Loading Dashboard</h2>
          <p className="text-gray-300 mb-6 text-center">
            {isOffline
              ? 'You appear to be offline. Please check your internet connection.'
              : `Failed to load your dashboard data: ${error.message}`}
          </p>
          <button
            onClick={() => {
              setRetryCount(0)
              refetch()
            }}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" data-hydrated={hydrated}>
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-yellow-600 text-white text-center py-2 px-4">
          <p className="text-sm font-medium">
            ⚠️ You're offline. Data may be out of date.
          </p>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 data-testid="dashboard-heading" className="text-3xl font-bold text-white mb-2">My Dashboard</h1>
          <p className="text-gray-400">
            Wallet: {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
          </p>
        </div>

        {/* Portfolio Overview */}
        <PortfolioHeader
          metrics={portfolioMetrics}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
        />

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
          {[
            { id: 'overview', label: 'Overview', count: null },
            { id: 'active', label: 'Active Bets', count: activeBets.length },
            { id: 'pending', label: 'Pending', count: pendingBets.length },
            { id: 'claimable', label: 'Claimable', count: claimablePayouts.length },
            { id: 'history', label: 'History', count: betHistory.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as TabView)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                currentTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {currentTab === 'overview' && (
            <>
              {/* Active Bets Preview */}
              {activeBets.length > 0 && (
                <div data-testid="active-bets-section">
                  <div className="flex items-center justify-between mb-4">
                    <h2 data-testid="active-bets-heading" className="text-xl font-semibold text-white">Active Bets</h2>
                    <button
                      onClick={() => setCurrentTab('active')}
                      className="text-sm text-purple-400 hover:text-purple-300"
                    >
                      View All →
                    </button>
                  </div>
                  <ActiveBets
                    bets={sortedActiveBets.slice(0, 3)}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                  />
                </div>
              )}

              {/* Claimable Payouts */}
              {claimablePayouts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Claimable Payouts</h2>
                    <button
                      onClick={() => setCurrentTab('claimable')}
                      className="text-sm text-purple-400 hover:text-purple-300"
                    >
                      View All →
                    </button>
                  </div>
                  <ClaimablePayouts
                    payouts={claimablePayouts.slice(0, 3)}
                    onClaim={handleClaim}
                    isClaiming={isClaiming}
                  />
                </div>
              )}

              {/* Win/Loss Statistics */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Performance</h2>
                <WinLossStats history={betHistory} />
              </div>

              {/* Empty state if no bets */}
              {activeBets.length === 0 && claimablePayouts.length === 0 && betHistory.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <div className="text-6xl mb-4">🎲</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Bets Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Start placing bets on markets to see your portfolio here
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Browse Markets
                  </button>
                </div>
              )}
            </>
          )}

          {currentTab === 'active' && (
            <ActiveBets
              bets={sortedActiveBets}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          )}

          {currentTab === 'pending' && (
            <PendingResolutions bets={pendingBets} />
          )}

          {currentTab === 'claimable' && (
            <ClaimablePayouts
              payouts={claimablePayouts}
              onClaim={handleClaim}
              isClaiming={isClaiming}
            />
          )}

          {currentTab === 'history' && (
            <WinLossStats history={betHistory} />
          )}
        </div>
      </div>
    </div>
  )
}
