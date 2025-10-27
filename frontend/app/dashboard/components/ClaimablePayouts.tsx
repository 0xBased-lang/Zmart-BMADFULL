'use client'

import { useState, useCallback, useMemo } from 'react'
import type { ClaimablePayout } from '@/lib/types/dashboard'

interface ClaimablePayoutsProps {
  payouts: ClaimablePayout[]
  onClaim: (marketId: number) => Promise<void>
  isClaiming: boolean
}

export function ClaimablePayouts({ payouts, onClaim, isClaiming }: ClaimablePayoutsProps) {
  const [claimingMarket, setClaimingMarket] = useState<number | null>(null)
  const [claimErrors, setClaimErrors] = useState<Record<number, string>>({})

  // Calculate total claimable amount
  const totalClaimable = useMemo(() => {
    return payouts.reduce((sum, payout) => sum + payout.amount, 0)
  }, [payouts])

  // Handle individual claim
  const handleClaim = useCallback(async (marketId: number) => {
    if (isClaiming || claimingMarket !== null) {
      return // Prevent multiple simultaneous claims
    }

    try {
      setClaimingMarket(marketId)
      setClaimErrors(prev => {
        const updated = { ...prev }
        delete updated[marketId]
        return updated
      })

      await onClaim(marketId)

      // Success - the payout will be removed from the list by parent component
    } catch (error) {
      console.error('Claim failed:', error)
      setClaimErrors(prev => ({
        ...prev,
        [marketId]: error instanceof Error ? error.message : 'Failed to claim payout'
      }))
    } finally {
      setClaimingMarket(null)
    }
  }, [onClaim, isClaiming, claimingMarket])

  // Handle claim all
  const handleClaimAll = useCallback(async () => {
    if (isClaiming || claimingMarket !== null || payouts.length === 0) {
      return
    }

    // Claim each payout sequentially to avoid race conditions
    for (const payout of payouts) {
      try {
        await handleClaim(payout.market_id)
        // Small delay between claims to avoid overwhelming the network
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Failed to claim payout for market ${payout.market_id}:`, error)
        // Continue with next payout even if one fails
      }
    }
  }, [payouts, handleClaim, isClaiming, claimingMarket])

  // Format SOL amount
  const formatSOL = useCallback((amount: number) => {
    return amount.toFixed(4)
  }, [])

  // Format date
  const formatDate = useCallback((date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }, [])

  // Empty state
  if (payouts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <div className="text-4xl mb-2">💰</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No Claimable Payouts
          </h3>
          <p className="text-sm text-gray-600">
            Win resolved markets to earn payouts
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header with total and claim all */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Claimable Payouts
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Total: <span className="font-semibold text-green-600">
              {formatSOL(totalClaimable)} SOL
            </span>
          </p>
        </div>
        <button
          onClick={handleClaimAll}
          disabled={isClaiming || claimingMarket !== null}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isClaiming ? 'Claiming...' : 'Claim All'}
        </button>
      </div>

      {/* Payouts list */}
      <div className="divide-y divide-gray-200">
        {payouts.map((payout) => {
          const isClaimingThis = claimingMarket === payout.market_id
          const error = claimErrors[payout.market_id]

          return (
            <div key={payout.market_id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                {/* Market info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1 truncate">
                    {payout.market_title}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      Outcome: <span className={`font-semibold ${
                        payout.winning_outcome === 'YES' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {payout.winning_outcome}
                      </span>
                    </span>
                    <span>
                      Resolved: {formatDate(payout.resolved_at)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-lg font-bold text-green-600">
                      {formatSOL(payout.amount)} SOL
                    </span>
                  </div>
                </div>

                {/* Claim button */}
                <button
                  onClick={() => handleClaim(payout.market_id)}
                  disabled={isClaiming || claimingMarket !== null}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium whitespace-nowrap"
                >
                  {isClaimingThis ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Claiming...
                    </span>
                  ) : (
                    'Claim'
                  )}
                </button>
              </div>

              {/* Error display */}
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <span className="font-semibold">Error:</span> {error}
                  </p>
                  <button
                    onClick={() => handleClaim(payout.market_id)}
                    className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Info footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          💡 <span className="font-semibold">Tip:</span> Claiming payouts requires a Solana transaction.
          Make sure your wallet is connected and has enough SOL for transaction fees (~0.000005 SOL).
        </p>
      </div>
    </div>
  )
}
