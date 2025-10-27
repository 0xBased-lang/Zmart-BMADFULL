'use client'

import { useMemo } from 'react'
import type { BetHistoryItem } from '@/lib/types/dashboard'

interface WinLossStatsProps {
  history: BetHistoryItem[]
}

export function WinLossStats({ history }: WinLossStatsProps) {
  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    const totalBets = history.length
    const wins = history.filter(bet => bet.outcome === 'WIN').length
    const losses = history.filter(bet => bet.outcome === 'LOSS').length
    const pending = history.filter(bet => bet.outcome === 'PENDING').length

    const winRate = totalBets > 0 ? (wins / (wins + losses)) * 100 : 0

    const totalWagered = history.reduce((sum, bet) => sum + bet.amount, 0)
    const totalReturns = history
      .filter(bet => bet.outcome === 'WIN')
      .reduce((sum, bet) => sum + (bet.payout || 0), 0)

    const netPnL = totalReturns - totalWagered
    const roiPercentage = totalWagered > 0 ? (netPnL / totalWagered) * 100 : 0

    // Calculate average bet size
    const avgBetSize = totalBets > 0 ? totalWagered / totalBets : 0

    // Calculate average win and loss amounts
    const avgWin = wins > 0
      ? history.filter(bet => bet.outcome === 'WIN').reduce((sum, bet) => sum + (bet.payout || 0), 0) / wins
      : 0

    const avgLoss = losses > 0
      ? history.filter(bet => bet.outcome === 'LOSS').reduce((sum, bet) => sum + bet.amount, 0) / losses
      : 0

    // Calculate profit factor (total wins / total losses)
    const totalLossAmount = history
      .filter(bet => bet.outcome === 'LOSS')
      .reduce((sum, bet) => sum + bet.amount, 0)

    const profitFactor = totalLossAmount > 0 ? totalReturns / totalLossAmount : 0

    // Calculate streak information
    let currentStreak = 0
    let longestWinStreak = 0
    let longestLossStreak = 0
    let tempWinStreak = 0
    let tempLossStreak = 0

    // Sort by date (most recent first)
    const sortedHistory = [...history]
      .filter(bet => bet.outcome !== 'PENDING')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    for (let i = 0; i < sortedHistory.length; i++) {
      const bet = sortedHistory[i]

      if (i === 0) {
        // Current streak
        if (bet.outcome === 'WIN') {
          currentStreak = 1
          tempWinStreak = 1
        } else if (bet.outcome === 'LOSS') {
          currentStreak = -1
          tempLossStreak = 1
        }
      } else {
        const prevBet = sortedHistory[i - 1]

        if (bet.outcome === 'WIN') {
          if (prevBet.outcome === 'WIN') {
            tempWinStreak++
            if (i === 1) currentStreak++
          } else {
            longestWinStreak = Math.max(longestWinStreak, tempWinStreak)
            tempWinStreak = 1
          }
        } else if (bet.outcome === 'LOSS') {
          if (prevBet.outcome === 'LOSS') {
            tempLossStreak++
            if (i === 1) currentStreak--
          } else {
            longestLossStreak = Math.max(longestLossStreak, tempLossStreak)
            tempLossStreak = 1
          }
        }
      }
    }

    longestWinStreak = Math.max(longestWinStreak, tempWinStreak)
    longestLossStreak = Math.max(longestLossStreak, tempLossStreak)

    return {
      totalBets,
      wins,
      losses,
      pending,
      winRate,
      totalWagered,
      totalReturns,
      netPnL,
      roiPercentage,
      avgBetSize,
      avgWin,
      avgLoss,
      profitFactor,
      currentStreak,
      longestWinStreak,
      longestLossStreak
    }
  }, [history])

  // Format SOL amount
  const formatSOL = (amount: number) => {
    return amount.toFixed(4)
  }

  // Format percentage
  const formatPercentage = (value: number) => {
    return value.toFixed(1)
  }

  // Empty state
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No Betting History
          </h3>
          <p className="text-sm text-gray-600">
            Place your first bet to start tracking your performance
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
          Win/Loss Statistics
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Comprehensive performance analysis
        </p>
      </div>

      {/* Stats grid */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Total Bets */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Bets</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalBets}</p>
        </div>

        {/* Win Rate */}
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Win Rate</p>
          <p className="text-2xl font-bold text-green-600">
            {formatPercentage(stats.winRate)}%
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {stats.wins}W / {stats.losses}L
          </p>
        </div>

        {/* Net P&L */}
        <div className={`p-4 rounded-lg ${
          stats.netPnL >= 0 ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <p className="text-sm text-gray-600 mb-1">Net P&L</p>
          <p className={`text-2xl font-bold ${
            stats.netPnL >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {stats.netPnL >= 0 ? '+' : ''}{formatSOL(stats.netPnL)} SOL
          </p>
        </div>

        {/* ROI */}
        <div className={`p-4 rounded-lg ${
          stats.roiPercentage >= 0 ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <p className="text-sm text-gray-600 mb-1">ROI</p>
          <p className={`text-2xl font-bold ${
            stats.roiPercentage >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {stats.roiPercentage >= 0 ? '+' : ''}{formatPercentage(stats.roiPercentage)}%
          </p>
        </div>

        {/* Total Wagered */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Wagered</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatSOL(stats.totalWagered)} SOL
          </p>
        </div>

        {/* Total Returns */}
        <div className="p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Returns</p>
          <p className="text-2xl font-bold text-purple-600">
            {formatSOL(stats.totalReturns)} SOL
          </p>
        </div>

        {/* Avg Bet Size */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Avg Bet Size</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatSOL(stats.avgBetSize)} SOL
          </p>
        </div>

        {/* Profit Factor */}
        <div className={`p-4 rounded-lg ${
          stats.profitFactor >= 1 ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <p className="text-sm text-gray-600 mb-1">Profit Factor</p>
          <p className={`text-2xl font-bold ${
            stats.profitFactor >= 1 ? 'text-green-600' : 'text-red-600'
          }`}>
            {stats.profitFactor.toFixed(2)}x
          </p>
        </div>
      </div>

      {/* Detailed stats */}
      <div className="p-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Winning stats */}
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-3">Winning Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Wins:</span>
                <span className="font-semibold text-gray-900">{stats.wins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Win:</span>
                <span className="font-semibold text-green-600">
                  {formatSOL(stats.avgWin)} SOL
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Longest Win Streak:</span>
                <span className="font-semibold text-green-600">
                  {stats.longestWinStreak} 🔥
                </span>
              </div>
            </div>
          </div>

          {/* Losing stats */}
          <div className="p-4 bg-red-50 rounded-lg">
            <h4 className="font-semibold text-red-900 mb-3">Losing Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Losses:</span>
                <span className="font-semibold text-gray-900">{stats.losses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Loss:</span>
                <span className="font-semibold text-red-600">
                  {formatSOL(stats.avgLoss)} SOL
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Longest Loss Streak:</span>
                <span className="font-semibold text-red-600">
                  {stats.longestLossStreak} ❄️
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current streak */}
        {stats.currentStreak !== 0 && (
          <div className={`mt-4 p-4 rounded-lg ${
            stats.currentStreak > 0 ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <p className="text-center">
              <span className="text-sm text-gray-600">Current Streak: </span>
              <span className={`text-lg font-bold ${
                stats.currentStreak > 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {Math.abs(stats.currentStreak)} {stats.currentStreak > 0 ? 'Wins 🔥' : 'Losses ❄️'}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          💡 <span className="font-semibold">Tip:</span> A profit factor above 1.0 means you're
          winning more than you're losing. ROI shows your return on investment percentage.
        </p>
      </div>
    </div>
  )
}
