'use client'

import { useState, useCallback } from 'react'
import type { Market } from '@/lib/types/database'

interface MarketStatus {
  isActive: boolean
  isResolved: boolean
  isCancelled: boolean
  isExpired: boolean
  timeLeft: number
  endingSoon: boolean
  justCreated: boolean
}

interface MarketHeaderProps {
  market: Market
  marketStatus: MarketStatus | null
}

export function MarketHeader({ market, marketStatus }: MarketHeaderProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)

  // Format time remaining
  const formatTimeLeft = useCallback((ms: number): string => {
    if (ms <= 0) return 'Ended'

    const days = Math.floor(ms / (1000 * 60 * 60 * 24))
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }, [])

  // Copy creator address to clipboard
  const copyCreatorAddress = useCallback(() => {
    if (!market.creator_wallet) return

    navigator.clipboard.writeText(market.creator_wallet)
    setCopiedAddress(true)
    setTimeout(() => setCopiedAddress(false), 2000)
  }, [market.creator_wallet])

  // Truncate wallet address
  const truncateAddress = (address: string | null): string => {
    if (!address) return 'Unknown'
    if (address.length <= 10) return address
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status badge
  const getStatusBadge = () => {
    if (!marketStatus) return null

    if (marketStatus.isResolved) {
      return (
        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
          Resolved: {market.resolved_outcome || 'Unknown'}
        </span>
      )
    }

    if (marketStatus.isCancelled) {
      return (
        <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
          Cancelled
        </span>
      )
    }

    if (marketStatus.isExpired) {
      return (
        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
          Expired - Awaiting Resolution
        </span>
      )
    }

    if (marketStatus.endingSoon) {
      return (
        <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium animate-pulse">
          Ending Soon
        </span>
      )
    }

    if (marketStatus.justCreated) {
      return (
        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
          New
        </span>
      )
    }

    return (
      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
        Active
      </span>
    )
  }

  return (
    <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm">
      {/* Header Top Row */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Market #{market.market_id}
          </h1>
          {getStatusBadge()}
        </div>

        {/* Category Badge */}
        {market.category && (
          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
            {market.category}
          </span>
        )}
      </div>

      {/* Question/Title */}
      <h2 className="text-xl md:text-2xl font-semibold text-gray-100 mb-4">
        {market.question}
      </h2>

      {/* Description (if exists) */}
      {market.description && (
        <div className="mb-4">
          <p className={`text-gray-300 ${!showFullDescription && 'line-clamp-3'}`}>
            {market.description}
          </p>
          {market.description.length > 200 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-purple-400 hover:text-purple-300 text-sm mt-1"
            >
              {showFullDescription ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-white/10">
        {/* Creator */}
        <div>
          <p className="text-gray-500 text-sm mb-1">Creator</p>
          <button
            onClick={copyCreatorAddress}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <span className="font-mono">
              {truncateAddress(market.creator_wallet)}
            </span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={copiedAddress
                  ? "M5 13l4 4L19 7"
                  : "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                }
              />
            </svg>
            {copiedAddress && (
              <span className="text-green-400 text-xs">Copied!</span>
            )}
          </button>
        </div>

        {/* End Date */}
        <div>
          <p className="text-gray-500 text-sm mb-1">End Date</p>
          <p className="text-gray-300">
            {formatDate(market.end_date || market.end_time || '')}
          </p>
          {marketStatus && marketStatus.isActive && (
            <p className={`text-sm ${marketStatus.endingSoon ? 'text-orange-400' : 'text-gray-400'}`}>
              {formatTimeLeft(marketStatus.timeLeft)} remaining
            </p>
          )}
        </div>

        {/* Bond Amount */}
        {market.bond_amount !== undefined && market.bond_amount !== null && (
          <div>
            <p className="text-gray-500 text-sm mb-1">Bond Amount</p>
            <p className="text-gray-300">
              {(market.bond_amount / 1e9).toFixed(2)} SOL
            </p>
          </div>
        )}

        {/* Total Bets */}
        <div>
          <p className="text-gray-500 text-sm mb-1">Total Bets</p>
          <p className="text-gray-300">
            {market.total_bets?.toLocaleString() || '0'}
          </p>
        </div>

        {/* Created Date */}
        <div>
          <p className="text-gray-500 text-sm mb-1">Created</p>
          <p className="text-gray-300">
            {formatDate(market.created_at)}
          </p>
        </div>

        {/* Resolution Criteria (if exists) */}
        {market.resolution_criteria && (
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-gray-500 text-sm mb-1">Resolution Criteria</p>
            <p className="text-gray-300 bg-white/5 rounded p-2">
              {market.resolution_criteria}
            </p>
          </div>
        )}
      </div>

      {/* Warning Messages */}
      {marketStatus && (
        <>
          {marketStatus.isExpired && !marketStatus.isResolved && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm">
                ⚠️ This market has ended and is awaiting resolution
              </p>
            </div>
          )}

          {marketStatus.isCancelled && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">
                ❌ This market has been cancelled. Bets will be refunded.
              </p>
            </div>
          )}

          {marketStatus.endingSoon && marketStatus.isActive && (
            <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <p className="text-orange-400 text-sm">
                ⏰ This market is ending soon. Place your bets before it closes!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}