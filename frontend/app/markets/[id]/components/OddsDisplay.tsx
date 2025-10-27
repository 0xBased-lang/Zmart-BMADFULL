'use client'

import { useState, useEffect, useCallback } from 'react'

interface OddsDisplayProps {
  odds: {
    yes: number
    no: number
  }
  volume: number
  participants: number
  lastUpdate: Date | null
}

export function OddsDisplay({ odds, volume, participants, lastUpdate }: OddsDisplayProps) {
  const [previousOdds, setPreviousOdds] = useState(odds)
  const [oddsChanging, setOddsChanging] = useState<'yes' | 'no' | null>(null)

  // Detect and animate odds changes
  useEffect(() => {
    if (previousOdds.yes !== odds.yes || previousOdds.no !== odds.no) {
      // Determine which changed more
      const yesChange = Math.abs(odds.yes - previousOdds.yes)
      const noChange = Math.abs(odds.no - previousOdds.no)

      setOddsChanging(yesChange > noChange ? 'yes' : 'no')
      setPreviousOdds(odds)

      // Clear animation after delay
      const timeout = setTimeout(() => {
        setOddsChanging(null)
      }, 1000)

      return () => clearTimeout(timeout)
    }
  }, [odds, previousOdds])

  // Format currency
  const formatCurrency = useCallback((amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`
    }
    return `$${amount.toFixed(2)}`
  }, [])

  // Format time ago
  const formatTimeAgo = useCallback((date: Date | null): string => {
    if (!date) return 'Loading...'

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

    if (seconds < 5) return 'Just now'
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }, [])

  // Calculate visual representation
  const yesWidth = Math.max(5, Math.min(95, odds.yes)) // Ensure minimum visibility
  const noWidth = Math.max(5, Math.min(95, odds.no))

  return (
    <div className="space-y-6 mt-6">
      {/* Main Odds Display */}
      <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* YES Odds */}
          <div
            className={`relative overflow-hidden rounded-lg transition-all duration-500 ${
              oddsChanging === 'yes' ? 'ring-2 ring-green-400 animate-pulse' : ''
            }`}
          >
            <div className="bg-gradient-to-br from-green-600 to-green-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 font-medium">YES</span>
                {oddsChanging === 'yes' && odds.yes > previousOdds.yes && (
                  <span className="text-green-300 text-sm animate-bounce">↑</span>
                )}
                {oddsChanging === 'yes' && odds.yes < previousOdds.yes && (
                  <span className="text-red-300 text-sm animate-bounce">↓</span>
                )}
              </div>
              <div className="text-4xl md:text-5xl font-bold text-white">
                {odds.yes.toFixed(1)}%
              </div>
              <div className="mt-2 text-white/60 text-sm">
                {odds.yes > 50 ? 'Leading' : odds.yes === 50 ? 'Tied' : 'Trailing'}
              </div>
            </div>
          </div>

          {/* NO Odds */}
          <div
            className={`relative overflow-hidden rounded-lg transition-all duration-500 ${
              oddsChanging === 'no' ? 'ring-2 ring-red-400 animate-pulse' : ''
            }`}
          >
            <div className="bg-gradient-to-br from-red-600 to-red-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 font-medium">NO</span>
                {oddsChanging === 'no' && odds.no > previousOdds.no && (
                  <span className="text-green-300 text-sm animate-bounce">↑</span>
                )}
                {oddsChanging === 'no' && odds.no < previousOdds.no && (
                  <span className="text-red-300 text-sm animate-bounce">↓</span>
                )}
              </div>
              <div className="text-4xl md:text-5xl font-bold text-white">
                {odds.no.toFixed(1)}%
              </div>
              <div className="mt-2 text-white/60 text-sm">
                {odds.no > 50 ? 'Leading' : odds.no === 50 ? 'Tied' : 'Trailing'}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Odds Bar */}
        <div className="relative h-8 bg-white/10 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-1000 ease-out"
            style={{ width: `${yesWidth}%` }}
          />
          <div
            className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-500 to-red-600 transition-all duration-1000 ease-out"
            style={{ width: `${noWidth}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
              <span className="text-white text-xs font-medium">
                {odds.yes > odds.no
                  ? `YES leads by ${(odds.yes - odds.no).toFixed(1)}%`
                  : odds.no > odds.yes
                    ? `NO leads by ${(odds.no - odds.yes).toFixed(1)}%`
                    : 'Perfectly balanced'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <p className="text-gray-500 text-sm mb-1">Total Volume</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(volume)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Participants</p>
            <p className="text-2xl font-bold text-white">
              {participants.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Last Update</p>
            <p className="text-sm text-gray-300">
              {formatTimeAgo(lastUpdate)}
            </p>
          </div>
        </div>

        {/* Confidence Indicator */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Market Confidence</span>
            <span className="text-gray-300">
              {Math.max(Math.abs(odds.yes - 50), Math.abs(odds.no - 50)) * 2}%
              {' '}
              {Math.max(Math.abs(odds.yes - 50), Math.abs(odds.no - 50)) > 30
                ? '(High)'
                : Math.max(Math.abs(odds.yes - 50), Math.abs(odds.no - 50)) > 15
                  ? '(Medium)'
                  : '(Low)'
              }
            </span>
          </div>
          <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                Math.max(Math.abs(odds.yes - 50), Math.abs(odds.no - 50)) > 30
                  ? 'bg-green-500'
                  : Math.max(Math.abs(odds.yes - 50), Math.abs(odds.no - 50)) > 15
                    ? 'bg-yellow-500'
                    : 'bg-gray-500'
              }`}
              style={{
                width: `${Math.max(Math.abs(odds.yes - 50), Math.abs(odds.no - 50)) * 2}%`
              }}
            />
          </div>
        </div>

        {/* Live Indicator */}
        {lastUpdate && (
          <div className="mt-4 flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
            </div>
            <span className="text-green-400 text-sm">Live odds updating</span>
          </div>
        )}
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">YES Pool</p>
          <p className="text-lg font-semibold text-green-400">
            {formatCurrency(volume * (odds.yes / 100))}
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">NO Pool</p>
          <p className="text-lg font-semibold text-red-400">
            {formatCurrency(volume * (odds.no / 100))}
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Avg Bet Size</p>
          <p className="text-lg font-semibold text-gray-300">
            {participants > 0 ? formatCurrency(volume / participants) : '$0'}
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Implied Prob</p>
          <p className="text-lg font-semibold text-purple-400">
            {odds.yes > odds.no ? `YES ${odds.yes}%` : `NO ${odds.no}%`}
          </p>
        </div>
      </div>
    </div>
  )
}