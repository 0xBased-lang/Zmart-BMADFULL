'use client';

// Force dynamic rendering to avoid build-time env var parsing
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/lib/hooks/useAdminAuth';
import { ParameterManagement } from './components/ParameterManagement';
import { FeatureToggles } from './components/FeatureToggles';
import { DisputedMarkets } from './components/DisputedMarkets';
import { PlatformMetrics } from './components/PlatformMetrics';
import { OverrideModal } from './components/OverrideModal';
import { ProposalManagement } from './components/ProposalManagement';

export default function AdminDashboard() {
  const router = useRouter();
  const { isAdmin, isLoading, adminWallet, connectedWallet } = useAdminAuth();
  const [overrideMarketId, setOverrideMarketId] = useState<string | null>(null);
  const [overrideMarketTitle, setOverrideMarketTitle] = useState<string>('');

  const handleOverrideRequest = (marketId: string) => {
    setOverrideMarketId(marketId);
    setOverrideMarketTitle('Market ' + marketId);
  };

  const handleOverrideConfirm = async (marketId: string, outcome: 'YES' | 'NO' | 'CANCELLED', reason: string) => {
    // Call admin override API endpoint
    const response = await fetch('/api/admin-override-resolution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketId, outcome, reason }),
    });

    if (!response.ok) {
      throw new Error('Override failed');
    }
  };

  // Redirect non-admin wallets to homepage
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-400">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting non-admin users
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Admin Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-gray-400 mt-1">
                Platform Management & Monitoring
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Admin Wallet
              </p>
              <p className="text-sm font-mono text-white mt-1">
                {connectedWallet
                  ? `${connectedWallet.slice(0, 4)}...${connectedWallet.slice(-4)}`
                  : 'Not Connected'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-6 flex gap-4">
          <Link
            href="/admin/create-market"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold transition-all shadow-lg"
          >
            + Create Market (Direct)
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Parameter Management Panel */}
          <div className="lg:col-span-2">
            <ParameterManagement />
          </div>

          {/* Right Column - Feature Toggles and Metrics */}
          <div className="space-y-6">
            {/* Feature Toggles Panel */}
            <FeatureToggles />

            {/* Platform Metrics */}
            <PlatformMetrics />
          </div>
        </div>

        {/* Proposal Management */}
        <div className="mt-6">
          <ProposalManagement />
        </div>

        {/* Disputed Markets Queue */}
        <div className="mt-6">
          <DisputedMarkets onOverride={handleOverrideRequest} />
        </div>
      </main>

      {/* Override Modal */}
      {overrideMarketId && (
        <OverrideModal
          marketId={overrideMarketId}
          marketTitle={overrideMarketTitle}
          onClose={() => setOverrideMarketId(null)}
          onConfirm={handleOverrideConfirm}
        />
      )}
    </div>
  );
}
