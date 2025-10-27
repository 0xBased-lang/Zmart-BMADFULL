/**
 * Proposal Creation Route
 * Story 3.6 - Build Proposal Creation Flow
 *
 * Server Component: /propose
 * Renders ProposalWizard client component for multi-step proposal form
 */

import { Metadata } from 'next';
import ProposalWizard from './ProposalWizard';

export const metadata: Metadata = {
  title: 'Create Proposal | ZMart',
  description: 'Propose new prediction markets on ZMart',
};

export default function ProposePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Create Market Proposal
          </h1>
          <p className="text-gray-600">
            Submit your prediction market idea for community voting.
            Approved proposals become live markets.
          </p>
        </div>

        {/* Wizard Component */}
        <ProposalWizard />
      </div>
    </div>
  );
}
