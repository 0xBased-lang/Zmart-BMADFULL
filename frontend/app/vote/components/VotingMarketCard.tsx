'use client'

import { useState } from 'react'
import { Market } from '@/lib/types/database'
import { VoteTally } from './VoteTally'
import { VotingCountdown } from './VotingCountdown'
import { VoteButtons } from './VoteButtons'
import { EvidencePanel } from './EvidencePanel'
import { useVoteTally } from '@/lib/hooks/useVoteTally'

interface VotingMarketCardProps {
  market: Market
}

export function VotingMarketCard({ market }: VotingMarketCardProps) {
  const [showEvidence, setShowEvidence] = useState(false)
  const [showFullCriteria, setShowFullCriteria] = useState(false)

  // Fetch vote tally with real-time updates
  const { yesVotes, noVotes, totalVoters, loading: tallyLoading } = useVoteTally(market.id)

  // Truncate resolution criteria if too long
  const resolutionCriteria = market.resolution_criteria || market.description || 'No resolution criteria provided.'
  const criteriaPreview = resolutionCriteria.length > 150
    ? resolutionCriteria.slice(0, 150) + '...'
    : resolutionCriteria

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 hover:border-green-500/50 transition-colors flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-white pr-4">{market.question}</h3>
          {market.category && (
            <span className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded whitespace-nowrap">
              {market.category}
            </span>
          )}
        </div>

        {/* Resolution Criteria */}
        <div className="text-sm text-gray-400">
          <p className={showFullCriteria ? '' : 'line-clamp-3'}>
            {showFullCriteria ? resolutionCriteria : criteriaPreview}
          </p>
          {resolutionCriteria.length > 150 && (
            <button
              onClick={() => setShowFullCriteria(!showFullCriteria)}
              className="text-green-400 hover:text-green-300 mt-1 text-xs"
            >
              {showFullCriteria ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      </div>

      {/* Voting Countdown */}
      {market.end_time && (
        <div className="mb-4">
          <VotingCountdown endTime={market.end_time} />
        </div>
      )}

      {/* Vote Tally */}
      <div className="mb-6">
        {tallyLoading ? (
          <div className="text-center text-gray-500 py-4">Loading votes...</div>
        ) : (
          <VoteTally
            yesVotes={yesVotes}
            noVotes={noVotes}
            totalVoters={totalVoters}
          />
        )}
      </div>

      {/* Evidence Review Button */}
      <button
        onClick={() => setShowEvidence(!showEvidence)}
        className="w-full mb-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {showEvidence ? 'Hide Evidence' : 'Review Evidence'}
      </button>

      {/* Evidence Panel (Task 3) */}
      {showEvidence && <EvidencePanel marketId={market.id} />}

      {/* Vote Buttons (Task 4 will add full functionality) */}
      <div className="mt-auto">
        <VoteButtons marketId={market.id} />
      </div>
    </div>
  )
}
