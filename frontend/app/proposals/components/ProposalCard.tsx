'use client'

import { useState } from 'react'
import { ProposalVoteTally } from './ProposalVoteTally'
import { ProposalCountdown } from './ProposalCountdown'
import { ProposalVoteButtons } from './ProposalVoteButtons'
import { useProposalVoteTally } from '@/lib/hooks/useProposalVoteTally'

interface Proposal {
  id: string
  proposal_id: string
  creator_wallet: string
  title: string
  description: string
  bond_amount: number
  bond_tier: string
  status: string
  yes_votes: number
  no_votes: number
  total_voters: number
  created_at: string
  end_date: string
}

interface ProposalCardProps {
  proposal: Proposal
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)

  // Fetch real-time vote tally
  const { yesVotes, noVotes, totalVoters, loading: tallyLoading } = useProposalVoteTally(
    proposal.proposal_id
  )

  // Truncate description if too long
  const description = proposal.description || 'No description provided.'
  const descriptionPreview = description.length > 150
    ? description.slice(0, 150) + '...'
    : description

  // Calculate bond tier badge
  const getBondTierInfo = (tier: string) => {
    switch (tier.toUpperCase()) {
      case 'TIER1':
      case 'LOW':
        return { label: 'Low', color: 'bg-yellow-900 text-yellow-300' }
      case 'TIER2':
      case 'MEDIUM':
        return { label: 'Medium', color: 'bg-blue-900 text-blue-300' }
      case 'TIER3':
      case 'HIGH':
        return { label: 'High', color: 'bg-purple-900 text-purple-300' }
      default:
        return { label: tier, color: 'bg-gray-800 text-gray-300' }
    }
  }

  const bondTier = getBondTierInfo(proposal.bond_tier)

  // Convert bond amount from lamports to ZMart (1 ZMart = 1M lamports)
  const bondInZMart = proposal.bond_amount / 1_000_000

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 hover:border-green-500/50 transition-colors">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-white pr-4">{proposal.title}</h3>
          <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${bondTier.color}`}>
            {bondTier.label} Bond
          </span>
        </div>

        {/* Creator and Bond */}
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
          <span>
            Creator: {proposal.creator_wallet.slice(0, 6)}...{proposal.creator_wallet.slice(-4)}
          </span>
          <span className="text-green-400 font-semibold">
            {bondInZMart.toFixed(0)} ZMart Bond
          </span>
        </div>

        {/* Description */}
        <div className="text-sm text-gray-400">
          <p className={showFullDescription ? '' : 'line-clamp-3'}>
            {showFullDescription ? description : descriptionPreview}
          </p>
          {description.length > 150 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-green-400 hover:text-green-300 mt-1 text-xs"
            >
              {showFullDescription ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      </div>

      {/* Voting Countdown */}
      {proposal.end_date && (
        <div className="mb-4">
          <ProposalCountdown endTime={proposal.end_date} />
        </div>
      )}

      {/* Vote Tally */}
      <div className="mb-6">
        {tallyLoading ? (
          <div className="text-center text-gray-500 py-4">Loading votes...</div>
        ) : (
          <ProposalVoteTally
            yesVotes={yesVotes}
            noVotes={noVotes}
            totalVoters={totalVoters}
          />
        )}
      </div>

      {/* Vote Buttons */}
      <div className="mt-auto">
        <ProposalVoteButtons proposalId={proposal.proposal_id} />
      </div>
    </div>
  )
}
