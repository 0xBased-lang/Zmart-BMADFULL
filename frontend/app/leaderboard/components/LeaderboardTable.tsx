'use client'

import Link from 'next/link'
import { TabType } from './LeaderboardInterface'
import { useLeaderboardData, LeaderboardEntry } from '@/lib/hooks/useLeaderboardData'
import { formatWallet } from '@/lib/utils/formatWallet'

interface LeaderboardTableProps {
  activeTab: TabType
  currentUserWallet: string | null
}

export function LeaderboardTable({
  activeTab,
  currentUserWallet,
}: LeaderboardTableProps) {
  const { data: rankings, loading, error } = useLeaderboardData(activeTab)

  const formatStatValue = (entry: LeaderboardEntry, tab: TabType): string => {
    switch (tab) {
      case 'points':
        return entry.activity_points?.toLocaleString() ?? '0'
      case 'win-rate':
        return `${((entry.win_rate ?? 0) * 100).toFixed(1)}%`
      case 'volume':
        return `${(entry.total_volume ?? 0).toFixed(2)} ZMart`
      case 'creators':
        return `${entry.markets_created ?? 0} markets`
    }
  }

  const getStatLabel = (tab: TabType): string => {
    switch (tab) {
      case 'points': return 'Activity Points'
      case 'win-rate': return 'Win Rate'
      case 'volume': return 'Total Volume'
      case 'creators': return 'Markets Created'
    }
  }

  const isCurrentUser = (wallet: string): boolean => {
    return currentUserWallet === wallet
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {/* Loading skeleton */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="h-16 bg-gray-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 bg-red-900/10 border border-red-800 rounded-lg">
        <p className="text-red-400 font-semibold mb-2">
          Error loading leaderboard
        </p>
        <p className="text-red-500 text-sm">
          {error.message}
        </p>
      </div>
    )
  }

  // Empty state
  if (!rankings || rankings.length === 0) {
    return (
      <div className="p-12 bg-gray-800 rounded-lg border border-gray-700 text-center">
        <p className="text-gray-400 text-lg mb-2">
          No rankings available yet
        </p>
        <p className="text-gray-500 text-sm">
          Be the first to earn activity points and climb the leaderboard!
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop: Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-400 font-semibold">Rank</th>
              <th className="text-left py-3 px-4 text-gray-400 font-semibold">User</th>
              <th className="text-right py-3 px-4 text-gray-400 font-semibold">
                {getStatLabel(activeTab)}
              </th>
              <th className="text-right py-3 px-4 text-gray-400 font-semibold">Total Bets</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((entry, index) => (
              <tr
                key={entry.wallet_address}
                className={`border-b border-gray-800 transition-colors ${
                  isCurrentUser(entry.wallet_address)
                    ? 'bg-blue-900/20 border-blue-500'
                    : 'hover:bg-gray-800/50'
                }`}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-blue-400">
                      #{index + 1}
                    </span>
                    {index === 0 && <span className="text-2xl">🥇</span>}
                    {index === 1 && <span className="text-2xl">🥈</span>}
                    {index === 2 && <span className="text-2xl">🥉</span>}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <Link
                    href={`/user/${entry.wallet_address}`}
                    className="text-blue-400 hover:text-blue-300 underline font-mono"
                  >
                    {formatWallet(entry.wallet_address)}
                  </Link>
                  {isCurrentUser(entry.wallet_address) && (
                    <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">
                      You
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 text-right font-semibold text-green-400">
                  {formatStatValue(entry, activeTab)}
                </td>
                <td className="py-4 px-4 text-right text-gray-400">
                  {entry.total_bets || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card View */}
      <div className="md:hidden space-y-3">
        {rankings.map((entry, index) => (
          <div
            key={entry.wallet_address}
            className={`p-4 rounded-lg border transition-colors ${
              isCurrentUser(entry.wallet_address)
                ? 'bg-blue-900/20 border-blue-500'
                : 'bg-gray-800 border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-400">
                  #{index + 1}
                </span>
                {index === 0 && <span className="text-2xl">🥇</span>}
                {index === 1 && <span className="text-2xl">🥈</span>}
                {index === 2 && <span className="text-2xl">🥉</span>}
              </div>
              <div className="text-right">
                <Link
                  href={`/user/${entry.wallet_address}`}
                  className="text-blue-400 hover:text-blue-300 underline text-sm font-mono"
                >
                  {formatWallet(entry.wallet_address)}
                </Link>
                {isCurrentUser(entry.wallet_address) && (
                  <div className="text-xs bg-blue-500 text-white px-2 py-1 rounded mt-1 inline-block">
                    You
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{getStatLabel(activeTab)}:</span>
                <span className="font-semibold text-green-400">
                  {formatStatValue(entry, activeTab)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Bets:</span>
                <span className="text-gray-300">{entry.total_bets || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
