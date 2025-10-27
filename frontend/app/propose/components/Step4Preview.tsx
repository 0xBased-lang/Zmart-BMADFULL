'use client';

/**
 * Step 4: Proposal Preview and Submit
 * Story 3.6 - Build Proposal Creation Flow
 *
 * Features:
 * - Display all form data for review
 * - Fee breakdown summary
 * - Edit links to jump back to specific steps
 * - Submit button (will trigger transaction in Task 6)
 */

import { useFormContext } from 'react-hook-form';
import { calculateFees, getBondTier } from '@/lib/types/proposal';
import type { ProposalFormSchema } from '@/lib/validation/proposalSchema';

interface Step4PreviewProps {
  onEditStep: (step: number) => void;
}

export default function Step4Preview({ onEditStep }: Step4PreviewProps) {
  const { watch } = useFormContext<ProposalFormSchema>();

  const formData = watch();
  const { title, category, description, evidenceRequirements, endDate, bondAmount } = formData;

  // Calculate fees
  const fees = calculateFees(bondAmount || 50);
  const tier = getBondTier(bondAmount || 50);

  return (
    <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Review Your Proposal
        </h3>
        <p className="text-gray-600">
          Please review all details before submitting
        </p>
      </div>

      {/* Market Information Section */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Market Information</h4>
          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-600">Title:</span>
            <p className="text-gray-900 mt-1">{title || <em className="text-gray-400">Not provided</em>}</p>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-600">Category:</span>
            <div className="mt-1">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {category || <em className="text-gray-400">Not selected</em>}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Criteria Section */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Resolution Criteria</h4>
          <button
            type="button"
            onClick={() => onEditStep(2)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-600">Criteria:</span>
            <p className="text-gray-900 mt-1 whitespace-pre-wrap">
              {description || <em className="text-gray-400">Not provided</em>}
            </p>
          </div>

          {evidenceRequirements && (
            <div>
              <span className="text-sm font-medium text-gray-600">Evidence Requirements:</span>
              <p className="text-gray-700 mt-1 text-sm">{evidenceRequirements}</p>
            </div>
          )}

          <div>
            <span className="text-sm font-medium text-gray-600">End Date:</span>
            <p className="text-gray-900 mt-1">
              {endDate ? (
                endDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              ) : (
                <em className="text-gray-400">Not selected</em>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Bond & Fees Section */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Bond & Fees</h4>
          <button
            type="button"
            onClick={() => onEditStep(3)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit
          </button>
        </div>

        <div className="space-y-4">
          {/* Tier Badge */}
          <div>
            <span className="text-sm font-medium text-gray-600">Selected Tier:</span>
            <div className="mt-2">
              <span className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${
                tier.name === 'Low' ? 'bg-blue-100 text-blue-900' :
                tier.name === 'Medium' ? 'bg-purple-100 text-purple-900' :
                'bg-pink-100 text-pink-900'
              }`}>
                {tier.name} Tier - {tier.creatorFeePercent}% Creator Fee
              </span>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h5 className="text-sm font-semibold text-gray-700 mb-2">Cost Breakdown</h5>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Bond Amount</span>
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    {bondAmount?.toLocaleString() || '50'} ZMart
                  </div>
                  <div className="text-xs text-gray-500">Refundable</div>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Proposal Tax (1%)</span>
                <div className="text-right">
                  <div className="font-semibold text-red-600">
                    {fees.proposalTax.toFixed(2)} ZMart
                  </div>
                  <div className="text-xs text-gray-500">Non-refundable</div>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm pb-2">
                <span className="text-gray-600">Creator Fee ({tier.creatorFeePercent}%)</span>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">
                    {fees.creatorFee.toFixed(2)} ZMart
                  </div>
                  <div className="text-xs text-gray-500">If approved</div>
                </div>
              </div>

              <div className="border-t border-gray-300 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Cost</span>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      {fees.totalCost.toFixed(2)} ZMart
                    </div>
                    <div className="text-sm text-gray-500">
                      ≈ {(fees.totalCost / 1000).toFixed(3)} SOL
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg
            className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-yellow-900">
            <p className="font-medium mb-2">Before You Submit:</p>
            <ul className="list-disc list-inside space-y-1 text-yellow-800">
              <li>Ensure wallet is connected and has sufficient balance</li>
              <li>Verify all information is accurate - proposals cannot be edited after submission</li>
              <li>Your proposal will enter a voting period before becoming a live market</li>
              <li>Bond refund depends on community voting outcome</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
