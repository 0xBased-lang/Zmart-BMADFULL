/**
 * Performance Metrics Component
 *
 * Displays comprehensive betting performance statistics.
 * Shows win rate, profit/loss, ROI, rankings, and key metrics.
 *
 * Following Web3 dApp UX best practices:
 * - Clear KPI displays
 * - Visual indicators (charts, progress bars)
 * - Comparative metrics (vs platform average)
 * - Mobile-responsive design
 */

'use client'

import type { PerformanceMetrics } from '@/lib/analytics/user-analytics'

interface PerformanceMetricsProps {
  metrics: PerformanceMetrics
  rank?: { rank: number; totalUsers: number; percentile: number }
  isLoading?: boolean
}

export function PerformanceMetrics({ metrics, rank, isLoading }: PerformanceMetricsProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-6">Performance</h2>
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading metrics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Performance</h2>
        {rank && (
          <div className="text-right">
            <p className="text-sm text-gray-400">Your Rank</p>
            <p className="text-xl font-bold text-blue-400">
              #{rank.rank} / {rank.totalUsers}
            </p>
            <p className="text-xs text-gray-400">
              Top {rank.percentile.toFixed(0)}%
            </p>
          </div>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Net Profit */}
        <MetricCard
          label="Net Profit"
          value={`${metrics.netProfit >= 0 ? '+' : ''}${metrics.netProfit.toFixed(2)} SOL`}
          color={metrics.netProfit >= 0 ? 'green' : 'red'}
          icon="💰"
        />

        {/* Win Rate */}
        <MetricCard
          label="Win Rate"
          value={`${metrics.winRate.toFixed(1)}%`}
          color={metrics.winRate >= 50 ? 'green' : 'red'}
          icon="🎯"
          subtitle={`${metrics.resolvedBets} resolved bets`}
        />

        {/* ROI */}
        <MetricCard
          label="ROI"
          value={`${metrics.roi >= 0 ? '+' : ''}${metrics.roi.toFixed(1)}%`}
          color={metrics.roi >= 0 ? 'green' : 'red'}
          icon="📈"
        />

        {/* Total Wagered */}
        <MetricCard
          label="Total Wagered"
          value={`${metrics.totalWagered.toFixed(2)} SOL`}
          color="blue"
          icon="💵"
          subtitle={`${metrics.totalBets} total bets`}
        />
      </div>

      {/* Win Rate Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Win Rate Progress</span>
          <span className="text-sm font-medium text-white">{metrics.winRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              metrics.winRate >= 50 ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(metrics.winRate, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0%</span>
          <span className="font-medium">50% breakeven</span>
          <span>100%</span>
        </div>
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-3">
          <StatRow label="Total Won" value={`${metrics.totalWon.toFixed(2)} SOL`} />
          <StatRow label="Total Lost" value={`${metrics.totalLost.toFixed(2)} SOL`} />
          <StatRow label="Largest Win" value={`+${metrics.largestWin.toFixed(2)} SOL`} positive />
          <StatRow label="Largest Loss" value={`-${metrics.largestLoss.toFixed(2)} SOL`} negative />
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <StatRow label="Active Positions" value={metrics.activePositions.toString()} />
          <StatRow label="Claimable" value={`${metrics.claimableAmount.toFixed(2)} SOL`} />
          <StatRow label="Avg Bet Size" value={`${metrics.averageBetSize.toFixed(2)} SOL`} />
          <StatRow label="Resolved Bets" value={metrics.resolvedBets.toString()} />
        </div>
      </div>

      {/* Performance Summary */}
      <div className={`mt-6 rounded-lg p-4 ${
        metrics.netProfit >= 0
          ? 'bg-green-500/10 border border-green-500/30'
          : 'bg-red-500/10 border border-red-500/30'
      }`}>
        <p className={`text-sm font-medium ${
          metrics.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {metrics.netProfit >= 0 ? '✓ Profitable Trader' : '⚠️ Net Loss'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {metrics.netProfit >= 0
            ? `You're up ${metrics.netProfit.toFixed(2)} SOL with a ${metrics.winRate.toFixed(0)}% win rate`
            : `Down ${Math.abs(metrics.netProfit).toFixed(2)} SOL. Keep learning and improve your strategy!`}
        </p>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  color,
  icon,
  subtitle
}: {
  label: string
  value: string
  color: 'green' | 'red' | 'blue' | 'yellow'
  icon: string
  subtitle?: string
}) {
  const colors = {
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
  }

  return (
    <div className={`rounded-lg border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  )
}

function StatRow({
  label,
  value,
  positive,
  negative
}: {
  label: string
  value: string
  positive?: boolean
  negative?: boolean
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm font-semibold ${
        positive ? 'text-green-400' : negative ? 'text-red-400' : 'text-white'
      }`}>
        {value}
      </span>
    </div>
  )
}
