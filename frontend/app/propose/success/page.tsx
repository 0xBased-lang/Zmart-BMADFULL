/**
 * Proposal Success Page
 * Story 3.6 - Build Proposal Creation Flow
 *
 * Displays success state after proposal submission
 */

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ProposalSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const signature = searchParams.get('signature');
  const proposalId = searchParams.get('proposalId');

  const [votingEndsAt, setVotingEndsAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState('');

  // Calculate voting period (typically 7 days from submission)
  useEffect(() => {
    const votingPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const endsAt = new Date(Date.now() + votingPeriod);
    setVotingEndsAt(endsAt);

    // Update countdown every second
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = endsAt.getTime() - now;

      if (remaining <= 0) {
        setTimeRemaining('Voting period ended');
        clearInterval(interval);
        return;
      }

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!signature || !proposalId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600">Invalid proposal submission.</p>
          <Link
            href="/propose"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700"
          >
            Create a new proposal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg
              className="w-12 h-12 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Proposal Submitted Successfully!
          </h1>
          <p className="text-gray-600">
            Your market proposal has been submitted to the blockchain
          </p>
        </div>

        {/* Proposal Details Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 mb-6">
          {/* Proposal ID */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Proposal ID</h3>
            <p className="text-lg font-mono text-gray-900">{proposalId}</p>
          </div>

          {/* Transaction Signature */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Transaction</h3>
            <a
              href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-mono text-sm break-all"
            >
              {signature}
            </a>
          </div>

          {/* Voting Period Countdown */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              Voting Period
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800">
                  Community voting ends in:
                </p>
                {votingEndsAt && (
                  <p className="text-xs text-blue-700 mt-1">
                    {votingEndsAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {timeRemaining}
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-yellow-900">
              <p className="font-medium mb-2">What happens next?</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-800">
                <li>Your proposal will be synced to the database shortly</li>
                <li>Community members can vote on your proposal for 7 days</li>
                <li>If approved, your proposal will become a live market</li>
                <li>Your bond will be refunded based on the voting outcome</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/propose')}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Another Proposal
          </button>

          <Link
            href={`/voting/${proposalId}`}
            className="px-6 py-3 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition-colors text-center"
          >
            View Proposal
          </Link>
        </div>

        {/* Secondary Actions */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
