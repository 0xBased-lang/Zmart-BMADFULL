'use client'

interface VoteTallyProps {
  yesVotes: number
  noVotes: number
  totalVoters?: number
}

export function VoteTally({ yesVotes, noVotes, totalVoters }: VoteTallyProps) {
  const totalVotes = yesVotes + noVotes
  const yesPercent = totalVotes > 0 ? Math.round((yesVotes / totalVotes) * 100) : 50
  const noPercent = totalVotes > 0 ? Math.round((noVotes / totalVotes) * 100) : 50

  return (
    <div className="space-y-3">
      {/* Vote bars */}
      <div className="space-y-2">
        {/* YES bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-green-400 font-semibold">YES</span>
            <span className="text-green-400 font-mono">{yesPercent}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500 ease-out"
              style={{ width: `${yesPercent}%` }}
            />
          </div>
        </div>

        {/* NO bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-red-400 font-semibold">NO</span>
            <span className="text-red-400 font-mono">{noPercent}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-500 ease-out"
              style={{ width: `${noPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Vote counts */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''} cast</span>
        {totalVoters && totalVoters > 0 && (
          <span>{Math.round((totalVotes / totalVoters) * 100)}% participation</span>
        )}
      </div>
    </div>
  )
}
