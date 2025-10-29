/**
 * Betting History Component
 *
 * Complete transaction history with advanced filtering and sorting.
 * Shows all bets with market details, outcomes, and profit/loss.
 *
 * Following Web3 dApp UX best practices:
 * - Advanced filtering (status, outcome, date range)
 * - Sorting (date, amount, profit)
 * - Search by market title
 * - Pagination for large datasets
 * - Export functionality
 * - Mobile-responsive table/cards
 */

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { UserBet, Market } from '@/lib/analytics/user-analytics'

interface BettingHistoryProps {
  bets: Array<UserBet & { markets: Market }>
  isLoading?: boolean
}

type FilterStatus = 'all' | 'active' | 'won' | 'lost' | 'pending'
type SortBy = 'date' | 'amount' | 'profit'
type SortOrder = 'asc' | 'desc'

export function BettingHistory({ bets, isLoading }: BettingHistoryProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter and sort bets
  const filteredAndSortedBets = useMemo(() => {
    let filtered = bets

    // Filter by status
    filtered = filtered.filter(bet => {
      if (!bet.markets) return false

      const market = bet.markets
      const status = getbetStatus(bet, market)

      if (filterStatus === 'all') return true
      if (filterStatus === 'active') return market.status === 'active' || market.status === 'locked'
      if (filterStatus === 'won') return status === 'won' || status === 'claimable' || status === 'claimed'
      if (filterStatus === 'lost') return status === 'lost'
      if (filterStatus === 'pending') return market.status === 'active' || market.status === 'locked'

      return true
    })

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(bet =>
        (bet.markets?.title || bet.markets?.question || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0

      if (sortBy === 'date') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount
      } else if (sortBy === 'profit') {
        const profitA = calculateProfit(a, a.markets)
        const profitB = calculateProfit(b, b.markets)
        comparison = profitA - profitB
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [bets, filterStatus, searchQuery, sortBy, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedBets.length / itemsPerPage)
  const paginatedBets = filteredAndSortedBets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Export to CSV
  const handleExport = () => {
    const headers = ['Date', 'Market', 'Outcome', 'Amount (SOL)', 'Status', 'Profit (SOL)']
    const rows = filteredAndSortedBets.map(bet => [
      new Date(bet.created_at).toLocaleDateString(),
      (bet.markets?.title || bet.markets?.question || 'Unknown'),
      bet.outcome,
      (bet.amount / 1_000_000_000).toFixed(4),
      getbetStatus(bet, bet.markets),
      calculateProfit(bet, bet.markets).toFixed(4)
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `betting-history-${new Date().toISOString()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-6">Betting History</h2>
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Betting History</h2>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          disabled={filteredAndSortedBets.length === 0}
        >
          📥 Export CSV
        </button>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'won', 'lost', 'pending'] as const).map(status => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status)
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-2 text-xs opacity-75">
                ({bets.filter(b => {
                  if (status === 'all') return true
                  const s = getbetStatus(b, b.markets)
                  if (status === 'active') return b.markets?.status === 'active' || b.markets?.status === 'locked'
                  if (status === 'won') return s === 'won' || s === 'claimable' || s === 'claimed'
                  if (status === 'lost') return s === 'lost'
                  if (status === 'pending') return b.markets?.status === 'active' || b.markets?.status === 'locked'
                  return false
                }).length})
              </span>
            </button>
          ))}
        </div>

        {/* Search and Sort */}
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by market title..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={e => {
              const [sort, order] = e.target.value.split('-')
              setSortBy(sort as SortBy)
              setSortOrder(order as SortOrder)
            }}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
            <option value="profit-desc">Highest Profit</option>
            <option value="profit-asc">Lowest Profit</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-400">
        Showing {paginatedBets.length} of {filteredAndSortedBets.length} bets
      </div>

      {/* Bets List */}
      {paginatedBets.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No bets found</p>
          <p className="text-sm">
            {searchQuery
              ? 'Try a different search term'
              : filterStatus !== 'all'
              ? `No ${filterStatus} bets`
              : 'Place a bet to see your history'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedBets.map(bet => {
            if (!bet.markets) return null

            const market = bet.markets
            const status = getbetStatus(bet, market)
            const profit = calculateProfit(bet, market)
            const profitPercent = bet.amount > 0 ? (profit / (bet.amount / 1_000_000_000)) * 100 : 0

            return (
              <Link
                key={bet.id}
                href={`/market/${market.market_id}`}
                className="block bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors border border-gray-600 hover:border-gray-500"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Market Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold mb-1 line-clamp-1">
                      {market.title || market.question}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                      <span>{new Date(bet.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{market.category}</span>
                      <span>•</span>
                      <span className={bet.outcome === 'YES' ? 'text-green-400' : 'text-red-400'}>
                        {bet.outcome}
                      </span>
                    </div>
                  </div>

                  {/* Right: Bet Stats */}
                  <div className="flex gap-6 text-right">
                    <div>
                      <p className="text-xs text-gray-400">Amount</p>
                      <p className="text-sm font-semibold text-white">
                        {(bet.amount / 1_000_000_000).toFixed(3)} SOL
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Profit/Loss</p>
                      <p className={`text-sm font-semibold ${
                        profit >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {profit >= 0 ? '+' : ''}{profit.toFixed(3)} SOL
                        <span className="text-xs ml-1">
                          ({profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(0)}%)
                        </span>
                      </p>
                    </div>
                    <div>
                      <StatusBadge status={status} />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

// Helper functions
function getbetStatus(bet: UserBet, market: Market | null): 'active' | 'won' | 'lost' | 'claimable' | 'claimed' {
  if (!market) return 'active'

  if (market.status === 'active' || market.status === 'locked') {
    return 'active'
  }

  if (market.status === 'resolved' && market.resolved_outcome) {
    const won = bet.outcome.toLowerCase() === market.resolved_outcome.toLowerCase()

    if (won) {
      return bet.claimed ? 'claimed' : 'claimable'
    } else {
      return 'lost'
    }
  }

  return 'active'
}

function calculateProfit(bet: UserBet, market: Market | null): number {
  if (!market || market.status !== 'resolved' || !market.resolved_outcome) {
    return 0 // Pending
  }

  const won = bet.outcome.toLowerCase() === market.resolved_outcome.toLowerCase()

  if (!won) {
    return -(bet.amount / 1_000_000_000) // Lost
  }

  // Calculate payout
  const winningPool = market.resolved_outcome === 'yes' ? market.yes_pool : market.no_pool
  const losingPool = market.resolved_outcome === 'yes' ? market.no_pool : market.yes_pool

  if (winningPool === 0) {
    return 0
  }

  const shareOfWinnings = (bet.shares * losingPool) / winningPool
  const payout = (bet.shares + shareOfWinnings) / 1_000_000_000
  const betAmount = bet.amount / 1_000_000_000

  return payout - betAmount
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    active: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    won: 'bg-green-500/20 text-green-400 border-green-500/30',
    lost: 'bg-red-500/20 text-red-400 border-red-500/30',
    claimable: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    claimed: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  const labels = {
    active: 'Active',
    won: 'Won',
    lost: 'Lost',
    claimable: 'Claimable',
    claimed: 'Claimed'
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  )
}
