import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { CreatedMarket } from '@/lib/hooks/useUserProfile'

interface CreatedMarketsProps {
  markets: CreatedMarket[]
}

/**
 * Component to display markets created by the user
 * Shows market details, status, and performance
 */
export function CreatedMarkets({ markets }: CreatedMarketsProps) {
  // Empty state
  if (markets.length === 0) {
    return (
      <div className="p-8 bg-gray-800 rounded-lg border border-gray-700 text-center">
        <p className="text-gray-400 text-lg mb-2">
          No markets created yet
        </p>
        <p className="text-gray-500 text-sm">
          Create your first prediction market to see it here!
        </p>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 text-xs rounded bg-green-900/30 text-green-400 border border-green-800">
            Active
          </span>
        )
      case 'locked':
        return (
          <span className="px-2 py-1 text-xs rounded bg-yellow-900/30 text-yellow-400 border border-yellow-800">
            Locked
          </span>
        )
      case 'resolved':
        return (
          <span className="px-2 py-1 text-xs rounded bg-blue-900/30 text-blue-400 border border-blue-800">
            Resolved
          </span>
        )
      case 'cancelled':
        return (
          <span className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-400 border border-gray-600">
            Cancelled
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-400 border border-gray-600">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-3">
      {markets.map((market) => (
        <div
          key={market.id}
          className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
        >
          <div className="flex justify-between items-start gap-4 mb-2">
            <Link
              href={`/markets/${market.id}`}
              className="text-blue-400 hover:text-blue-300 font-semibold flex-1"
            >
              {market.title || market.question}
            </Link>
            {getStatusBadge(market.status)}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Volume:</span>
              <span className="ml-2 text-gray-300 font-semibold">
                {(market.total_volume || 0).toFixed(2)} ZMart
              </span>
            </div>

            <div>
              <span className="text-gray-500">Market ID:</span>
              <span className="ml-2 text-gray-400 font-mono">
                #{market.market_id}
              </span>
            </div>

            <div>
              <span className="text-gray-500">Created:</span>
              <span className="ml-2 text-gray-400">
                {formatDistanceToNow(new Date(market.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
