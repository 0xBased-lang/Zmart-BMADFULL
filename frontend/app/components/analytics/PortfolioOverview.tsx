/**
 * Portfolio Overview Component
 *
 * Displays user's active betting positions with potential winnings.
 * Shows market details, staked amounts, and current value.
 *
 * Following Web3 dApp UX best practices:
 * - Clear value displays (staked, potential, profit)
 * - Status indicators (active, won, lost, claimable)
 * - Market navigation
 * - Real-time updates
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PortfolioPosition } from '@/lib/analytics/user-analytics'

interface PortfolioOverviewProps {
  positions: PortfolioPosition[]
  isLoading?: boolean
}

export function PortfolioOverview({ positions, isLoading }: PortfolioOverviewProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'claimable' | 'resolved'>('all')

  const filteredPositions = positions.filter(pos => {
    if (filter === 'all') return true
    if (filter === 'active') return pos.status === 'active'
    if (filter === 'claimable') return pos.status === 'claimable'
    if (filter === 'resolved') return pos.status === 'claimed' || pos.status === 'lost'
    return true
  })

  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0)
  const totalPotential = positions
    .filter(p => p.status === 'active' || p.status === 'claimable')
    .reduce((sum, p) => sum + p.potentialWinnings, 0)

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Portfolio</h2>
        </div>
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading portfolio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Portfolio</h2>
        <div className="flex gap-2">
          {['all', 'active', 'claimable', 'resolved'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status as typeof filter)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Total Positions</p>
          <p className="text-2xl font-bold text-white">{positions.length}</p>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Current Value</p>
          <p className="text-2xl font-bold text-white">{totalValue.toFixed(2)} SOL</p>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Potential Winnings</p>
          <p className="text-2xl font-bold text-green-400">+{totalPotential.toFixed(2)} SOL</p>
        </div>
      </div>

      {/* Positions List */}
      {filteredPositions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No positions found</p>
          <p className="text-sm">
            {filter === 'all'
              ? 'Place a bet to see your portfolio'
              : `No ${filter} positions`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPositions.map(position => {
            const profit = position.potentialWinnings - position.totalStaked
            const profitPercent = position.totalStaked > 0
              ? (profit / position.totalStaked) * 100
              : 0

            return (
              <Link
                key={position.market.market_id}
                href={`/market/${position.market.market_id}`}
                className="block bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors border border-gray-600 hover:border-gray-500"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 pr-4">
                    <h3 className="text-white font-semibold mb-1 line-clamp-1">
                      {position.market.question}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {position.bets.length} bet{position.bets.length !== 1 ? 's' : ''}
                      {' • '}
                      {position.market.category}
                    </p>
                  </div>
                  <StatusBadge status={position.status} />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Staked</p>
                    <p className="text-sm font-semibold text-white">
                      {position.totalStaked.toFixed(3)} SOL
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Current Value</p>
                    <p className="text-sm font-semibold text-white">
                      {position.currentValue.toFixed(3)} SOL
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Potential</p>
                    <p className="text-sm font-semibold text-green-400">
                      {position.potentialWinnings.toFixed(3)} SOL
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Profit</p>
                    <p className={`text-sm font-semibold ${
                      profit >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {profit >= 0 ? '+' : ''}{profit.toFixed(3)} SOL
                      <span className="text-xs ml-1">
                        ({profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(0)}%)
                      </span>
                    </p>
                  </div>
                </div>

                {/* Bets Breakdown */}
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <div className="flex gap-2 text-xs">
                    {position.bets.map((bet, idx) => (
                      <span
                        key={bet.id}
                        className={`px-2 py-1 rounded ${
                          bet.outcome === 'YES'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {bet.outcome}: {(bet.amount / 1_000_000_000).toFixed(2)} SOL
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: PortfolioPosition['status'] }) {
  const styles = {
    active: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    won: 'bg-green-500/20 text-green-400 border-green-500/30',
    lost: 'bg-red-500/20 text-red-400 border-red-500/30',
    claimable: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    claimed: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  const labels = {
    active: '🔄 Active',
    won: '🎉 Won',
    lost: '❌ Lost',
    claimable: '💰 Claimable',
    claimed: '✓ Claimed'
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
