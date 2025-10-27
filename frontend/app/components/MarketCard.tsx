'use client'

import Link from 'next/link'
import type { Market } from '@/lib/hooks/useMarkets'

interface MarketCardProps {
  market: Market
}

export function MarketCard({ market }: MarketCardProps) {
  // Calculate odds
  const totalPool = market.yes_pool + market.no_pool
  const yesOdds = totalPool > 0 ? ((market.yes_pool / totalPool) * 100).toFixed(1) : '50.0'
  const noOdds = totalPool > 0 ? ((market.no_pool / totalPool) * 100).toFixed(1) : '50.0'

  // Format date
  const endDate = new Date(market.end_time).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Link
      href={`/markets/${market.id}`}
      className="block p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
    >
      {/* Category Badge */}
      {market.category && (
        <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded uppercase mb-3">
          {market.category}
        </span>
      )}

      {/* Question */}
      <h3 className="text-lg font-semibold mb-4 line-clamp-2 min-h-[3.5rem]">
        {market.question}
      </h3>

      {/* Odds Display */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            YES
          </span>
          <span className="text-xl font-bold text-green-600 dark:text-green-400">
            {yesOdds}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            NO
          </span>
          <span className="text-xl font-bold text-red-600 dark:text-red-400">
            {noOdds}%
          </span>
        </div>
      </div>

      {/* Metadata Footer */}
      <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
        <span className="font-medium">
          ${market.total_volume.toFixed(2)}
        </span>
        <span>Ends {endDate}</span>
      </div>
    </Link>
  )
}
