'use client'

import { useState } from 'react'
import { useUserProfile } from '@/lib/hooks/useUserProfile'
import { formatWallet, copyToClipboard } from '@/lib/utils/formatWallet'
import { StatCard } from './StatCard'
import { RecentBets } from './RecentBets'
import { CreatedMarkets } from './CreatedMarkets'

interface UserProfileProps {
  walletAddress: string
}

export function UserProfile({ walletAddress }: UserProfileProps) {
  const { stats, recentBets, createdMarkets, loading, error } = useUserProfile(walletAddress)
  const [copySuccess, setCopySuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'bets' | 'markets'>('bets')

  const handleCopyAddress = async () => {
    try {
      await copyToClipboard(walletAddress)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Loading skeleton */}
        <div className="space-y-4">
          <div className="h-10 w-64 bg-gray-800 rounded animate-pulse" />
          <div className="h-6 w-96 bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 bg-red-900/10 border border-red-800 rounded-lg">
        <p className="text-red-400 font-semibold mb-2">
          Error loading profile
        </p>
        <p className="text-red-500 text-sm">
          {error.message}
        </p>
      </div>
    )
  }

  // No stats found (new user)
  if (!stats) {
    return (
      <div className="p-12 bg-gray-800 rounded-lg border border-gray-700">
        <h2 className="text-2xl font-bold mb-4">User Profile</h2>
        <p className="text-gray-400 mb-2">
          <code className="text-blue-400">{walletAddress}</code>
        </p>
        <p className="text-gray-500 mt-4">
          This user hasn't placed any bets or created any markets yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">User Profile</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <code className="text-lg text-gray-400 font-mono break-all">
            {walletAddress}
          </code>
          <button
            onClick={handleCopyAddress}
            className="text-sm text-blue-400 hover:text-blue-300 px-3 py-1 rounded border border-blue-400 hover:border-blue-300 transition-colors"
            title="Copy wallet address"
          >
            {copySuccess ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Win Rate"
          value={`${(stats.win_rate * 100).toFixed(1)}%`}
          icon="📊"
        />
        <StatCard
          label="Total Bets"
          value={stats.total_bets.toString()}
          icon="🎲"
        />
        <StatCard
          label="Total Profit"
          value={`${stats.total_profit.toFixed(2)} ZMart`}
          icon="💰"
          valueColor={stats.total_profit >= 0 ? 'text-green-400' : 'text-red-400'}
        />
        <StatCard
          label="Markets Created"
          value={stats.markets_created.toString()}
          icon="🏗️"
        />
        <StatCard
          label="Activity Points"
          value={stats.activity_points.toLocaleString()}
          icon="⭐"
        />
      </div>

      {/* Recent Activity Section - Placeholder for Task 5 */}
      <div className="space-y-4">
        <div className="flex gap-2 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('bets')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'bets'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Recent Bets ({recentBets.length})
          </button>
          <button
            onClick={() => setActiveTab('markets')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'markets'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Created Markets ({createdMarkets.length})
          </button>
        </div>

        {/* Recent Activity Components */}
        {activeTab === 'bets' ? (
          <RecentBets bets={recentBets} />
        ) : (
          <CreatedMarkets markets={createdMarkets} />
        )}
      </div>
    </div>
  )
}
