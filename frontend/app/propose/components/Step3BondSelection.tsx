'use client';

/**
 * Step 3: Bond Selection
 * Story 3.6 - Build Proposal Creation Flow
 *
 * Features:
 * - Bond amount slider (50-1000 ZMart range)
 * - Tier visualization (Low: 0.5%, Medium: 1%, High: 2% creator fee)
 * - Real-time fee calculation
 * - Tooltip explanations for bond mechanics
 */

import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
import { BOND_TIERS, getBondTier, calculateFees } from '@/lib/types/proposal';
import type { ProposalFormSchema } from '@/lib/validation/proposalSchema';

export default function Step3BondSelection() {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ProposalFormSchema>();

  const bondAmount = watch('bondAmount') || 50;

  // Get current tier and calculate fees
  const currentTier = getBondTier(bondAmount);
  const fees = calculateFees(bondAmount);

  // Calculate slider percentage for visual representation
  const sliderPercent = ((bondAmount - 50) / (1000 - 50)) * 100;

  // Determine tier color
  const getTierColor = () => {
    if (currentTier.name === 'Low') return 'text-blue-600 bg-blue-100';
    if (currentTier.name === 'Medium') return 'text-purple-600 bg-purple-100';
    return 'text-pink-600 bg-pink-100';
  };

  const getTierBorderColor = () => {
    if (currentTier.name === 'Low') return 'border-blue-500';
    if (currentTier.name === 'Medium') return 'border-purple-500';
    return 'border-pink-500';
  };

  return (
    <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Bond Selection
        </h3>
        <p className="text-gray-600">
          Set your bond amount to determine your creator fee tier
        </p>
      </div>

      {/* Bond Amount Slider */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <label htmlFor="bondAmount" className="block text-sm font-medium text-gray-700">
            Bond Amount <span className="text-red-500">*</span>
          </label>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {bondAmount.toLocaleString()} ZMart
            </div>
            <div className="text-sm text-gray-500">
              ≈ {(bondAmount / 1000).toFixed(3)} SOL
            </div>
          </div>
        </div>

        {/* Slider */}
        <div className="relative">
          <input
            type="range"
            id="bondAmount"
            min="50"
            max="1000"
            step="10"
            value={bondAmount}
            onChange={(e) => setValue('bondAmount', parseInt(e.target.value), { shouldValidate: true })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          {/* Tier Markers */}
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>50 (Min)</span>
            <span>100</span>
            <span>500</span>
            <span>1000+</span>
          </div>
        </div>

        {errors.bondAmount && (
          <p className="mt-2 text-sm text-red-500">{errors.bondAmount.message}</p>
        )}
      </div>

      {/* Current Tier Display */}
      <div className={`p-4 rounded-lg border-2 ${getTierBorderColor()}`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-700">Current Tier:</span>
            <div className={`inline-block ml-2 px-3 py-1 rounded-full text-sm font-semibold ${getTierColor()}`}>
              {currentTier.name} Tier
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Creator Fee</div>
            <div className="text-xl font-bold text-gray-900">{currentTier.creatorFeePercent}%</div>
          </div>
        </div>
      </div>

      {/* Tier Visualization */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Bond Tier Breakdown</h4>
        <div className="space-y-2">
          {BOND_TIERS.map((tier) => {
            const isCurrentTier = tier.name === currentTier.name;
            return (
              <div
                key={tier.name}
                className={`p-3 rounded-lg border ${
                  isCurrentTier
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      isCurrentTier ? 'bg-blue-600' : 'bg-gray-400'
                    }`} />
                    <div>
                      <div className={`font-medium ${
                        isCurrentTier ? 'text-blue-900' : 'text-gray-700'
                      }`}>
                        {tier.name} Tier
                      </div>
                      <div className="text-xs text-gray-500">
                        {tier.minAmount}{tier.maxAmount ? `-${tier.maxAmount}` : '+'} ZMart
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${
                    isCurrentTier ? 'text-blue-900' : 'text-gray-600'
                  }`}>
                    {tier.creatorFeePercent}% fee
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Cost Breakdown</h4>

        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Bond Amount</span>
            <button
              type="button"
              onMouseEnter={() => setShowTooltip('bond')}
              onMouseLeave={() => setShowTooltip(null)}
              className="text-gray-400 hover:text-gray-600 relative"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {showTooltip === 'bond' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                  Refundable: 100% if approved, 50% if rejected, 0% if cancelled
                </div>
              )}
            </button>
          </div>
          <span className="font-semibold text-green-600">
            {bondAmount.toLocaleString()} ZMart
          </span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Proposal Tax (1%)</span>
            <button
              type="button"
              onMouseEnter={() => setShowTooltip('tax')}
              onMouseLeave={() => setShowTooltip(null)}
              className="text-gray-400 hover:text-gray-600 relative"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {showTooltip === 'tax' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                  Non-refundable fee paid when creating proposal
                </div>
              )}
            </button>
          </div>
          <span className="font-semibold text-red-600">
            {fees.proposalTax.toFixed(2)} ZMart
          </span>
        </div>

        <div className="flex justify-between items-center text-sm pb-2">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Creator Fee ({currentTier.creatorFeePercent}%)</span>
            <button
              type="button"
              onMouseEnter={() => setShowTooltip('creator')}
              onMouseLeave={() => setShowTooltip(null)}
              className="text-gray-400 hover:text-gray-600 relative"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {showTooltip === 'creator' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                  Fee percentage you'll earn from all market trades if proposal is approved
                </div>
              )}
            </button>
          </div>
          <span className="font-semibold text-blue-600">
            {fees.creatorFee.toFixed(2)} ZMart
          </span>
        </div>

        <div className="border-t border-gray-300 pt-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total Cost</span>
            <span className="text-xl font-bold text-gray-900">
              {fees.totalCost.toFixed(2)} ZMart
            </span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg
            className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
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
          <div className="text-sm text-green-900">
            <p className="font-medium mb-1">Higher Bond = Higher Rewards</p>
            <p className="text-green-800">
              Larger bonds show confidence in your proposal and earn higher creator fees if approved.
              Your bond is refundable based on the outcome of community voting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
