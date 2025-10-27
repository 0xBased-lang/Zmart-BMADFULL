'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import type { PendingBet } from '@/lib/types/dashboard'

interface PendingResolutionsProps {
  bets: PendingBet[]
}

export function PendingResolutions({ bets }: PendingResolutionsProps) {
  // Format SOL amount
  const formatSOL = (amount: number) => {
    return amount.toFixed(4)
  }

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Sort bets by end date (earliest first)
  const sortedBets = useMemo(() => {
    return [...bets].sort((a, b) =>
      new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
    )
  }, [bets])

  // Empty state
  if (bets.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <div className="text-4xl mb-2">⏳</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No Pending Resolutions
          </h3>
          <p className="text-sm text-gray-600">
            All your markets have been resolved
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Pending Resolutions
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {bets.length} market{bets.length > 1 ? 's' : ''} awaiting resolution
        </p>
      </div>

      {/* Bets List */}
      <div className="divide-y divide-gray-200">
        {sortedBets.map((bet) => (
          <div key={bet.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              {/* Market info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/markets/${bet.market_id}`}
                  className="group block"
                >
                  <h4 className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors mb-2 truncate">
                    {bet.market_title}
                  </h4>
                </Link>

                <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm">
                  {/* Position */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Position:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      bet.outcome === 'YES'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {bet.outcome}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Bet:</span>
                    <span className="font-semibold text-gray-900">
                      {formatSOL(bet.amount)} SOL
                    </span>
                  </div>

                  {/* Potential payout */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Potential:</span>
                    <span className="font-semibold text-purple-600">
                      {formatSOL(bet.potential_payout)} SOL
                    </span>
                  </div>

                  {/* Market ended */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Ended:</span>
                    <span className="text-gray-900">
                      {formatDate(bet.end_date)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status badge */}
              <div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium whitespace-nowrap">
                  Pending Resolution
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          💡 <span className="font-semibold">Info:</span> Markets are currently awaiting resolution.
          Once resolved, you'll be able to claim your winnings if your position is correct.
        </p>
      </div>
    </div>
  )
}
