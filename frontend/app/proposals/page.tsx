import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProposalsInterface } from './components/ProposalsInterface';

export const metadata: Metadata = {
  title: 'Proposals | BMAD-Zmart',
  description: 'Vote on market proposals to participate in platform governance',
};

/**
 * Proposals page for community governance voting
 *
 * Features:
 * - View pending proposals in voting period
 * - Cast votes with wallet signatures (gas-free)
 * - View historical approved/rejected proposals
 * - Real-time vote tally updates
 */
export default function ProposalsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Market Proposals
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Vote on community proposals to control which markets get created on the platform.
            Use your voting power to ensure quality and maintain platform standards.
          </p>
        </div>

        {/* Proposals Interface with Tabs */}
        <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="text-center"><div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" /><p className="text-gray-500">Loading proposals...</p></div></div>}>
          <ProposalsInterface />
        </Suspense>
      </div>
    </main>
  );
}
