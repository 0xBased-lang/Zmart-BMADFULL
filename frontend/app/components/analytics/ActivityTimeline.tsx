/**
 * Activity Timeline Component
 *
 * Real-time feed of user actions and market events.
 * Shows recent bets, wins, losses, and claims with timestamps.
 *
 * Following Web3 dApp UX best practices:
 * - Chronological timeline view
 * - Activity type icons and colors
 * - Relative timestamps
 * - Market links
 * - Real-time updates
 * - Infinite scroll ready
 */

'use client'

import Link from 'next/link'
import type { ActivityItem } from '@/lib/analytics/user-analytics'

interface ActivityTimelineProps {
  activities: ActivityItem[]
  isLoading?: boolean
  limit?: number
}

export function ActivityTimeline({ activities, isLoading, limit = 20 }: ActivityTimelineProps) {
  const displayedActivities = activities.slice(0, limit)

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-6">Activity Timeline</h2>
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading activity...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Activity Timeline</h2>
        <span className="text-sm text-gray-400">
          {displayedActivities.length} recent activities
        </span>
      </div>

      {/* Timeline */}
      {displayedActivities.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No activity yet</p>
          <p className="text-sm">Your betting activity will appear here</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-700" />

          {/* Activity Items */}
          <div className="space-y-4">
            {displayedActivities.map((activity, index) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                isFirst={index === 0}
                isLast={index === displayedActivities.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Load More (if needed) */}
      {activities.length > limit && (
        <div className="mt-6 text-center">
          <button className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
            Load More Activity
          </button>
        </div>
      )}
    </div>
  )
}

function ActivityCard({
  activity,
  isFirst,
  isLast
}: {
  activity: ActivityItem
  isFirst: boolean
  isLast: boolean
}) {
  const config = getActivityConfig(activity.type)

  return (
    <div className="relative pl-16">
      {/* Timeline Dot */}
      <div className={`absolute left-4 w-5 h-5 rounded-full border-2 ${config.dotColor} bg-gray-800 z-10`}>
        <div className="absolute inset-0.5 rounded-full bg-gray-800" />
      </div>

      {/* Activity Card */}
      <Link
        href={`/market/${activity.market_id}`}
        className="block bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors border border-gray-600 hover:border-gray-500"
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left: Activity Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{config.icon}</span>
              <h3 className={`font-semibold ${config.textColor}`}>
                {config.label}
              </h3>
            </div>
            <p className="text-white text-sm mb-1 line-clamp-1">
              {activity.market_title}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>{getRelativeTime(activity.timestamp)}</span>
              {activity.outcome && (
                <>
                  <span>•</span>
                  <span className={activity.outcome === 'yes' ? 'text-green-400' : 'text-red-400'}>
                    {activity.outcome.toUpperCase()}
                  </span>
                </>
              )}
              <span>•</span>
              <span className={`font-medium ${config.amountColor}`}>
                {activity.type === 'bet_lost' ? '-' : ''}
                {activity.amount.toFixed(3)} SOL
              </span>
            </div>
          </div>

          {/* Right: Amount Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${config.badgeColor}`}>
            {activity.type === 'bet_lost' ? '-' : '+'}
            {activity.amount.toFixed(2)} SOL
          </div>
        </div>
      </Link>
    </div>
  )
}

// Helper functions
function getActivityConfig(type: ActivityItem['type']) {
  const configs = {
    bet_placed: {
      icon: '🎲',
      label: 'Bet Placed',
      dotColor: 'border-blue-500',
      textColor: 'text-blue-400',
      amountColor: 'text-blue-400',
      badgeColor: 'bg-blue-500/20 text-blue-400'
    },
    bet_won: {
      icon: '🎉',
      label: 'Bet Won',
      dotColor: 'border-green-500',
      textColor: 'text-green-400',
      amountColor: 'text-green-400',
      badgeColor: 'bg-green-500/20 text-green-400'
    },
    bet_lost: {
      icon: '❌',
      label: 'Bet Lost',
      dotColor: 'border-red-500',
      textColor: 'text-red-400',
      amountColor: 'text-red-400',
      badgeColor: 'bg-red-500/20 text-red-400'
    },
    payout_claimed: {
      icon: '💰',
      label: 'Payout Claimed',
      dotColor: 'border-yellow-500',
      textColor: 'text-yellow-400',
      amountColor: 'text-yellow-400',
      badgeColor: 'bg-yellow-500/20 text-yellow-400'
    },
    market_created: {
      icon: '🏗️',
      label: 'Market Created',
      dotColor: 'border-purple-500',
      textColor: 'text-purple-400',
      amountColor: 'text-purple-400',
      badgeColor: 'bg-purple-500/20 text-purple-400'
    }
  }

  return configs[type] || configs.bet_placed
}

function getRelativeTime(timestamp: string): string {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now.getTime() - then.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`

  return then.toLocaleDateString()
}
