'use client';

import { useDisputedMarkets } from '@/lib/hooks/useDisputedMarkets';

export function DisputedMarkets({ onOverride }: { onOverride: (marketId: string) => void }) {
  const { markets, loading, error } = useDisputedMarkets();

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Disputed Markets Queue</h2>
        <div className="text-gray-400 text-sm">Loading disputed markets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg border border-red-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Disputed Markets Queue</h2>
        <div className="text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-white mb-4">
        Disputed Markets Queue ({markets.length})
      </h2>

      {markets.length === 0 ? (
        <p className="text-gray-400 text-sm">No disputed markets at this time</p>
      ) : (
        <div className="space-y-4">
          {markets.map((market) => (
            <div key={market.id} className="border border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-white">{market.title}</h3>
                <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                  {formatTimeRemaining(market.timeRemaining)} remaining
                </span>
              </div>

              <div className="text-sm text-gray-400 mb-3">
                Vote Outcome: <span className="font-medium text-white">{market.voteOutcome}</span>
              </div>

              <div className="space-y-2 mb-3">
                <p className="text-xs text-gray-500 font-medium">Disputes ({market.disputes.length}):</p>
                {market.disputes.map((dispute) => (
                  <div key={dispute.id} className="bg-gray-900/50 p-2 rounded text-xs">
                    <p className="text-gray-300">{dispute.reason}</p>
                    <p className="text-gray-500 mt-1">
                      By: {dispute.flagger.slice(0, 8)}...
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onOverride(market.id)}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition"
              >
                Override Resolution
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
