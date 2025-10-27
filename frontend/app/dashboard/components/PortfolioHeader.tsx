'use client'

import { useCallback } from 'react'
import type { PortfolioMetrics } from '@/lib/types/dashboard'

interface PortfolioHeaderProps {
  metrics: PortfolioMetrics
  isRefreshing: boolean
  onRefresh: () => void
}

export function PortfolioHeader({ metrics, isRefreshing, onRefresh }: PortfolioHeaderProps) {
  // Format currency with proper handling
  const formatCurrency = useCallback((amount: number): string => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)}K`
    }
    return amount.toFixed(4)
  }, [])

  // Format P/L with color coding
  const formatPnL = useCallback((amount: number, percent: number) => {
    const sign = amount >= 0 ? '+' : ''
    const color = amount >= 0 ? 'text-green-400' : 'text-red-400'

    return (
      <span className={color}>
        {sign}{formatCurrency(amount)} SOL ({sign}{percent.toFixed(2)}%)
      </span>
    )
  }, [formatCurrency])

  // Calculate risk indicator based on ROI
  const getRiskIndicator = () => {
    const roiPercent = Math.abs(metrics.roiPercentage)

    if (roiPercent > 50 || metrics.activeBetsCount > 10) {
      return { text: 'High Activity', color: 'text-orange-400', bg: 'bg-orange-500/20' }
    } else if (roiPercent > 20 || metrics.activeBetsCount > 5) {
      return { text: 'Medium Activity', color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
    } else {
      return { text: 'Low Activity', color: 'text-green-400', bg: 'bg-green-500/20' }
    }
  }

  const riskIndicator = getRiskIndicator()

  return (
    <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm mb-8">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Portfolio Overview</h2>
          <p className="text-gray-400 text-sm">
            Track your positions and performance in real-time
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`px-4 py-2 rounded-lg transition-all ${
            isRefreshing
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {isRefreshing ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Refreshing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </span>
          )}
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Portfolio Value */}
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 rounded-lg p-4 border border-purple-500/20">
          <div className="flex items-start justify-between mb-2">
            <p className="text-gray-400 text-sm">Total Value</p>
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {formatCurrency(metrics.totalValue)} SOL
          </p>
          <p className="text-xs text-gray-400">
            Active + Claimable
          </p>
        </div>

        {/* Active Bets Value */}
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-lg p-4 border border-blue-500/20">
          <div className="flex items-start justify-between mb-2">
            <p className="text-gray-400 text-sm">Active Bets</p>
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {formatCurrency(metrics.activeBetsValue)} SOL
          </p>
          <p className="text-xs text-gray-400">
            Currently at risk
          </p>
        </div>

        {/* Unrealized P/L */}
        <div className={`bg-gradient-to-br ${
          metrics.unrealizedPnL >= 0
            ? 'from-green-600/20 to-green-700/20 border-green-500/20'
            : 'from-red-600/20 to-red-700/20 border-red-500/20'
        } rounded-lg p-4 border`}>
          <div className="flex items-start justify-between mb-2">
            <p className="text-gray-400 text-sm">Unrealized P/L</p>
            <svg className={`w-5 h-5 ${metrics.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={metrics.unrealizedPnL >= 0
                  ? "M7 11l5-5m0 0l5 5m-5-5v12"
                  : "M17 13l-5 5m0 0l-5-5m5 5V6"
                }
              />
            </svg>
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {formatPnL(metrics.unrealizedPnL, metrics.unrealizedPnLPercent)}
          </p>
          <p className="text-xs text-gray-400">
            On active positions
          </p>
        </div>

        {/* Claimable Winnings */}
        <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 rounded-lg p-4 border border-yellow-500/20">
          <div className="flex items-start justify-between mb-2">
            <p className="text-gray-400 text-sm">Claimable</p>
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
              />
            </svg>
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {formatCurrency(metrics.claimableValue)} SOL
          </p>
          {metrics.claimableValue > 0 ? (
            <p className="text-xs text-yellow-400 font-medium animate-pulse">
              Ready to claim!
            </p>
          ) : (
            <p className="text-xs text-gray-400">
              No winnings yet
            </p>
          )}
        </div>
      </div>

      {/* Risk Indicator Bar */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-400">Portfolio Risk Assessment</p>
          <span className={`text-sm font-medium px-2 py-1 rounded ${riskIndicator.bg} ${riskIndicator.color}`}>
            {riskIndicator.text}
          </span>
        </div>

        {/* Visual Risk Bar */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              Math.abs(metrics.unrealizedPnLPercent) > 50
                ? 'bg-gradient-to-r from-red-500 to-red-600'
                : Math.abs(metrics.unrealizedPnLPercent) > 25
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                  : 'bg-gradient-to-r from-green-500 to-green-600'
            }`}
            style={{
              width: `${Math.min(100, Math.abs(metrics.unrealizedPnLPercent))}%`
            }}
          />
        </div>
      </div>

      {/* Quick Actions (Mobile) */}
      <div className="mt-4 flex gap-2 md:hidden">
        <button className="flex-1 px-3 py-2 bg-purple-600/20 text-purple-400 rounded-lg text-sm font-medium">
          View Active
        </button>
        {metrics.claimableValue > 0 && (
          <button className="flex-1 px-3 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg text-sm font-medium animate-pulse">
            Claim All
          </button>
        )}
      </div>
    </div>
  )
}