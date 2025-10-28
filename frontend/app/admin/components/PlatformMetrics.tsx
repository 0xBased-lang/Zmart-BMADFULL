'use client';

import { usePlatformMetrics } from '@/lib/hooks/usePlatformMetrics';

export function PlatformMetrics() {
  const { metrics, loading, error } = usePlatformMetrics();

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Platform Metrics</h2>
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg border border-red-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Platform Metrics</h2>
        <div className="text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Platform Metrics</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 uppercase">Total Markets</p>
          <p className="text-2xl font-bold text-white mt-1">{metrics.totalMarkets}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Active Users</p>
          <p className="text-2xl font-bold text-white mt-1">{metrics.activeUsers}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">24h Volume</p>
          <p className="text-2xl font-bold text-white mt-1">{metrics.volume24h.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Dispute Rate</p>
          <p className="text-2xl font-bold text-white mt-1">{metrics.disputeRate.toFixed(1)}%</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-4">Auto-refreshes every 30 seconds</p>
    </div>
  );
}
