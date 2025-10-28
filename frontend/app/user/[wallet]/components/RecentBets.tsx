import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { RecentBet } from '@/lib/hooks/useUserProfile'

interface RecentBetsProps {
  bets: RecentBet[]
}

/**
 * Component to display user's recent betting activity
 * Shows last 10 bets with market details and outcomes
 */
export function RecentBets({ bets }: RecentBetsProps) {
  // Empty state
  if (bets.length === 0) {
    return (
      <div className="p-8 bg-gray-800 rounded-lg border border-gray-700 text-center">
        <p className="text-gray-400 text-lg mb-2">
          No bets placed yet
        </p>
        <p className="text-gray-500 text-sm">
          Start betting on prediction markets to see your activity here!
        </p>
      </div>
    )
  }

  const getStatusBadge = (bet: RecentBet) => {
    const market = bet.market

    // Market not resolved yet
    if (market.status === 'active' || market.status === 'locked') {
      return (
        <span className="px-2 py-1 text-xs rounded bg-yellow-900/30 text-yellow-400 border border-yellow-800">
          Pending
        </span>
      )
    }

    // Market resolved
    if (market.status === 'resolved' && market.winning_outcome) {
      const userWon = bet.outcome.toLowerCase() === market.winning_outcome.toLowerCase()
      return userWon ? (
        <span className="px-2 py-1 text-xs rounded bg-green-900/30 text-green-400 border border-green-800">
          Won
        </span>
      ) : (
        <span className="px-2 py-1 text-xs rounded bg-red-900/30 text-red-400 border border-red-800">
          Lost
        </span>
      )
    }

    // Market cancelled
    if (market.status === 'cancelled') {
      return (
        <span className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-400 border border-gray-600">
          Cancelled
        </span>
      )
    }

    return null
  }

  return (
    <div className="space-y-3">
      {bets.map((bet) => (
        <div
          key={bet.id}
          className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
        >
          <div className="flex justify-between items-start gap-4 mb-2">
            <Link
              href={`/markets/${bet.market.id}`}
              className="text-blue-400 hover:text-blue-300 font-semibold flex-1"
            >
              {bet.market.question}
            </Link>
            {getStatusBadge(bet)}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Outcome:</span>
              <span
                className={`ml-2 font-semibold ${
                  bet.outcome === 'YES' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {bet.outcome}
              </span>
            </div>

            <div>
              <span className="text-gray-500">Amount:</span>
              <span className="ml-2 text-gray-300 font-semibold">
                {bet.amount.toFixed(2)} ZMart
              </span>
            </div>

            {bet.profit_loss !== null && (
              <div>
                <span className="text-gray-500">P/L:</span>
                <span
                  className={`ml-2 font-semibold ${
                    bet.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {bet.profit_loss >= 0 ? '+' : ''}
                  {bet.profit_loss.toFixed(2)} ZMart
                </span>
              </div>
            )}

            <div>
              <span className="text-gray-500">When:</span>
              <span className="ml-2 text-gray-400">
                {formatDistanceToNow(new Date(bet.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
