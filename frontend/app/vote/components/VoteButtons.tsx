'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useVoteSubmit } from '@/lib/hooks/useVoteSubmit'

interface VoteButtonsProps {
  marketId: string
}

export function VoteButtons({ marketId }: VoteButtonsProps) {
  const { connected } = useWallet()
  const { submitVote, isSubmitting, userVote } = useVoteSubmit()

  async function handleVote(choice: 'YES' | 'NO') {
    await submitVote(marketId, choice)
  }

  // Show wallet connect button if not connected
  if (!connected) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-400 mb-3">Connect your wallet to vote</p>
        <WalletMultiButton className="!bg-green-600 hover:!bg-green-700 !rounded-lg !px-6 !py-3" />
      </div>
    )
  }

  // Disable buttons if submitting or already voted
  const isDisabled = isSubmitting || userVote !== null

  return (
    <div className="space-y-3">
      {/* Signing indicator */}
      {isSubmitting && (
        <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Waiting for wallet signature...</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Check your wallet to sign the vote message</p>
        </div>
      )}

      {/* Vote buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleVote('YES')}
          disabled={isDisabled}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            userVote === 'YES'
              ? 'bg-green-600 text-white ring-2 ring-green-400 ring-offset-2 ring-offset-gray-900'
              : isDisabled
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105 active:scale-95'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing...
            </span>
          ) : userVote === 'YES' ? (
            '✓ Voted YES'
          ) : (
            'Vote YES'
          )}
        </button>

        <button
          onClick={() => handleVote('NO')}
          disabled={isDisabled}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            userVote === 'NO'
              ? 'bg-red-600 text-white ring-2 ring-red-400 ring-offset-2 ring-offset-gray-900'
              : isDisabled
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white hover:scale-105 active:scale-95'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing...
            </span>
          ) : userVote === 'NO' ? (
            '✓ Voted NO'
          ) : (
            'Vote NO'
          )}
        </button>
      </div>

      {/* Vote confirmation */}
      {userVote && (
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-300">
            You voted <span className={`font-semibold ${userVote === 'YES' ? 'text-green-400' : 'text-red-400'}`}>{userVote}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Your vote has been recorded (gas-free!)</p>
        </div>
      )}
    </div>
  )
}
