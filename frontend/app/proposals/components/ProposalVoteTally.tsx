'use client'

interface ProposalVoteTallyProps {
  yesVotes: number
  noVotes: number
  totalVoters: number
}

export function ProposalVoteTally({ yesVotes, noVotes, totalVoters }: ProposalVoteTallyProps) {
  const totalVotes = yesVotes + noVotes
  const yesPercentage = totalVotes > 0 ? Math.round((yesVotes / totalVotes) * 100) : 0
  const noPercentage = totalVotes > 0 ? Math.round((noVotes / totalVotes) * 100) : 0

  return (
    <div className="space-y-3">
      {/* YES Bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-semibold text-green-400">YES</span>
          <span className="text-sm text-gray-400">{yesPercentage}%</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${yesPercentage}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">{yesVotes} votes</div>
      </div>

      {/* NO Bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-semibold text-red-400">NO</span>
          <span className="text-sm text-gray-400">{noPercentage}%</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${noPercentage}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">{noVotes} votes</div>
      </div>

      {/* Total Votes */}
      <div className="pt-2 border-t border-gray-700">
        <p className="text-xs text-gray-400">
          <span className="font-semibold text-white">{totalVoters}</span> {totalVoters === 1 ? 'vote' : 'votes'} cast
        </p>
      </div>
    </div>
  )
}
