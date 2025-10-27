'use client'

import { useCallback, useMemo } from 'react'
import Link from 'next/link'
import type { UserBet } from '@/lib/types/dashboard'

interface ActiveBetsProps {
  bets: UserBet[]
  sortBy: 'recent' | 'ending' | 'pnl' | 'amount'
  onSortChange: (sort: 'recent' | 'ending' | 'pnl' | 'amount') => void
  compact?: boolean
}

export function ActiveBets({ bets, sortBy, onSortChange, compact = false }: ActiveBetsProps) {
  // Format currency
  const formatCurrency = useCallback((amount: number): string => {
    return amount.toFixed(4)
  }, [])

  // Format P/L with color
  const formatPnL = useCallback((pnl: number, amount: number) => {
    const percent = amount > 0 ? (pnl / amount) * 100 : 0
    const sign = pnl >= 0 ? '+' : ''
    const color = pnl >= 0 ? 'text-green-400' : 'text-red-400'

    return (
      <div className={color}>
        <span className="font-semibold">{sign}{formatCurrency(pnl)} SOL</span>
        <span className="text-sm opacity-80 ml-1">({sign}{percent.toFixed(1)}%)</span>
      </div>
    )
  }, [formatCurrency])

  // Format time remaining
  const formatTimeRemaining = useCallback((endTime: string): string => {
    const now = Date.now()
    const end = new Date(endTime).getTime()
    const diff = end - now

    if (diff <= 0) return 'Ended'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h remaining`

    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${minutes}m remaining`
  }, [])

  // Calculate total metrics
  const totals = useMemo(() => {
    return {
      invested: bets.reduce((sum, bet) => sum + bet.amount, 0),
      currentValue: bets.reduce((sum, bet) => sum + bet.current_value, 0),
      unrealizedPnL: bets.reduce((sum, bet) => sum + (bet.unrealized_pnl || 0), 0),
    }
  }, [bets])

  // Empty state
  if (bets.length === 0) {
    return (
      <div className="bg-white/5 rounded-xl p-8 backdrop-blur-sm">
        <h3 className="text-xl font-bold text-white mb-4">Active Bets</h3>
        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <p className="text-gray-400 mb-4">No active bets yet</p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Explore Markets
          </Link>
        </div>
      </div>
    )
  }

  const displayBets = compact ? bets : bets

  return (
    <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">
          Active Bets {!compact && `(${bets.length})`}
        </h3>

        {!compact && (
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500"
          >
            <option value="recent">Most Recent</option>
            <option value="ending">Ending Soon</option>
            <option value="pnl">P/L (High to Low)</option>
            <option value="amount">Amount (High to Low)</option>
          </select>
        )}
      </div>

      {/* Summary Stats (Desktop only) */}
      {!compact && bets.length > 0 && (
        <div className="hidden md:grid md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-white/10">
          <div>
            <p className="text-gray-500 text-xs">Total Invested</p>
            <p className="text-white font-semibold">{formatCurrency(totals.invested)} SOL</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Potential Payout</p>
            <p className="text-white font-semibold">{formatCurrency(totals.currentValue)} SOL</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Unrealized P/L</p>
            <div className={totals.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
              <span className="font-semibold">
                {totals.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(totals.unrealizedPnL)} SOL
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bets List */}
      <div className="space-y-3">
        {displayBets.map(bet => (
          <div
            key={bet.id}
            className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
          >
            {/* Market Title & Link */}
            <Link
              href={`/markets/${bet.market_id}`}
              className="block mb-3 group"
            >
              <h4 className="font-medium text-gray-100 group-hover:text-purple-400 transition-colors line-clamp-2">
                {bet.market_title}
              </h4>
            </Link>

            {/* Bet Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {/* Position */}
              <div>
                <p className="text-gray-500 text-xs mb-1">Position</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    bet.outcome === 'YES'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {bet.outcome}
                  </span>
                  <span className="text-gray-300">
                    {bet.current_odds.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div>
                <p className="text-gray-500 text-xs mb-1">Amount</p>
                <p className="text-white font-medium">{formatCurrency(bet.amount)} SOL</p>
              </div>

              {/* P/L */}
              <div>
                <p className="text-gray-500 text-xs mb-1">Unrealized P/L</p>
                {formatPnL(bet.unrealized_pnl || 0, bet.amount)}
              </div>

              {/* Time Remaining */}
              <div>
                <p className="text-gray-500 text-xs mb-1">Ends In</p>
                <p className={`font-medium ${
                  formatTimeRemaining(bet.end_date).includes('h') ||
                  formatTimeRemaining(bet.end_date).includes('m')
                    ? 'text-orange-400'
                    : 'text-gray-300'
                }`}>
                  {formatTimeRemaining(bet.end_date)}
                </p>
              </div>
            </div>

            {/* Mobile Summary Row */}
            <div className="mt-3 pt-3 border-t border-white/10 md:hidden">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Potential Payout</span>
                <span className="text-white font-medium">
                  {formatCurrency(bet.current_value)} SOL
                </span>
              </div>
            </div>

            {/* Desktop Additional Info */}
            {!compact && (
              <div className="hidden md:flex justify-between items-center mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Shares:</span>
                    <span className="text-gray-300 ml-1">{bet.shares}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Potential:</span>
                    <span className="text-purple-400 font-medium ml-1">
                      {formatCurrency(bet.current_value)} SOL
                    </span>
                  </div>
                </div>

                <Link
                  href={`/markets/${bet.market_id}`}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  View Market →
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* View All Link (Compact Mode) */}
      {compact && bets.length > 3 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => {/* Navigate to active bets tab */}}
            className="text-purple-400 hover:text-purple-300 text-sm font-medium"
          >
            View all {bets.length} active bets →
          </button>
        </div>
      )}
    </div>
  )
}