'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistance } from 'date-fns'

interface MarketActivityProps {
  marketId: number
}

interface ActivityItem {
  id: string
  type: 'bet' | 'comment' | 'resolution' | 'creation'
  user: string
  amount?: number
  outcome?: 'YES' | 'NO'
  message?: string
  timestamp: Date
  txHash?: string
}

export function MarketActivity({ marketId }: MarketActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'bets' | 'comments'>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Simulate fetching activity data
  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true)
      try {
        // In production, fetch from Supabase or API
        // For now, generate simulated data
        const data = generateSimulatedActivity(marketId)
        setActivities(data)
      } catch (error) {
        console.error('Failed to fetch market activity:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()

    // Auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout | undefined
    if (autoRefresh) {
      interval = setInterval(fetchActivities, 30000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [marketId, autoRefresh])

  // Generate simulated activity data
  const generateSimulatedActivity = (id: number): ActivityItem[] => {
    const activities: ActivityItem[] = []
    const now = new Date()

    // Market creation
    activities.push({
      id: `create-${id}`,
      type: 'creation',
      user: '8xKj...9PoL',
      message: 'Market created',
      timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000), // 2 days ago
    })

    // Generate random bets
    const outcomes: ('YES' | 'NO')[] = ['YES', 'NO']
    const users = ['4nBx...2kLm', '9yTr...5pQw', '3mNb...8vCx', '7kLp...1zXc', '2wQr...6nMk']

    for (let i = 0; i < 15; i++) {
      const hoursAgo = Math.random() * 47 // Within last 47 hours
      activities.push({
        id: `bet-${i}`,
        type: 'bet',
        user: users[Math.floor(Math.random() * users.length)],
        amount: Math.round(Math.random() * 50 + 0.1) / 10, // 0.1 to 5 SOL
        outcome: outcomes[Math.floor(Math.random() * 2)],
        timestamp: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000),
        txHash: generateRandomTxHash()
      })
    }

    // Add some comments
    const comments = [
      'Looking bullish on YES!',
      'I think NO is undervalued here',
      'Great market, very interesting',
      'The odds are shifting quickly',
      'This will be resolved soon'
    ]

    for (let i = 0; i < 5; i++) {
      const hoursAgo = Math.random() * 24 // Within last day
      activities.push({
        id: `comment-${i}`,
        type: 'comment',
        user: users[Math.floor(Math.random() * users.length)],
        message: comments[i],
        timestamp: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)
      })
    }

    // Sort by timestamp (most recent first)
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Generate random transaction hash
  const generateRandomTxHash = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let hash = ''
    for (let i = 0; i < 44; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return hash
  }

  // Truncate wallet address
  const truncateAddress = (address: string): string => {
    if (address.length <= 10) return address
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  // Format amount
  const formatAmount = (amount: number): string => {
    return amount.toFixed(2)
  }

  // Get activity icon
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'bet':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      case 'comment':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )
      case 'resolution':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      case 'creation':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        )
    }
  }

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true
    if (filter === 'bets') return activity.type === 'bet'
    if (filter === 'comments') return activity.type === 'comment'
    return true
  })

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-white">Recent Activity</h4>

        {/* Auto-refresh toggle */}
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`flex items-center gap-2 text-sm ${
            autoRefresh ? 'text-green-400' : 'text-gray-500'
          }`}
        >
          <div className="relative">
            {autoRefresh && (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
              </>
            )}
            {!autoRefresh && (
              <div className="w-2 h-2 bg-gray-500 rounded-full" />
            )}
          </div>
          <span>{autoRefresh ? 'Live' : 'Paused'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'bets', 'comments'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab as typeof filter)}
            className={`px-3 py-1 rounded-lg text-sm transition-colors capitalize ${
              filter === tab
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            {tab}
            {tab === 'bets' && ` (${activities.filter(a => a.type === 'bet').length})`}
            {tab === 'comments' && ` (${activities.filter(a => a.type === 'comment').length})`}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No activity yet
          </div>
        ) : (
          filteredActivities.map(activity => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              {/* Icon */}
              <div className={`p-2 rounded-full ${
                activity.type === 'bet'
                  ? activity.outcome === 'YES'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                  : activity.type === 'comment'
                    ? 'bg-blue-500/20 text-blue-400'
                    : activity.type === 'resolution'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-gray-500/20 text-gray-400'
              }`}>
                {getActivityIcon(activity.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {/* Main Text */}
                    <p className="text-sm text-gray-300">
                      <span className="font-mono text-purple-400">
                        {truncateAddress(activity.user)}
                      </span>
                      {activity.type === 'bet' && (
                        <>
                          {' bet '}
                          <span className="font-semibold text-white">
                            {formatAmount(activity.amount!)} SOL
                          </span>
                          {' on '}
                          <span className={`font-semibold ${
                            activity.outcome === 'YES' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {activity.outcome}
                          </span>
                        </>
                      )}
                      {activity.type === 'comment' && (
                        <>
                          {' commented: '}
                          <span className="text-gray-400 italic">"{activity.message}"</span>
                        </>
                      )}
                      {activity.type === 'creation' && (
                        <span className="text-gray-400"> created this market</span>
                      )}
                      {activity.type === 'resolution' && (
                        <>
                          {' resolved market as '}
                          <span className="font-semibold text-purple-400">
                            {activity.outcome || 'CANCELLED'}
                          </span>
                        </>
                      )}
                    </p>

                    {/* Timestamp */}
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistance(activity.timestamp, new Date(), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Transaction Link */}
                  {activity.txHash && (
                    <a
                      href={`https://solscan.io/tx/${activity.txHash}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                      title="View on Solana Explorer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {filteredActivities.length >= 10 && (
        <button className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg transition-colors text-sm">
          Load More Activity
        </button>
      )}
    </div>
  )
}