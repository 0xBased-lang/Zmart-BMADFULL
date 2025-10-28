'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useParameters } from '@/lib/hooks/useParameters';
import { updateParameter, calculateMaxChange } from '@/lib/admin/parameters';
import toast from 'react-hot-toast';

interface ParameterRowProps {
  name: string;
  label: string;
  value: number;
  unit: string;
  description: string;
  currentValue: number;
  maxChangeBps: number;
  lastUpdate: number;
  cooldownPeriod: number;
  onUpdate: (name: string, value: number) => Promise<void>;
}

function ParameterRow({
  name,
  label,
  value,
  unit,
  description,
  currentValue,
  maxChangeBps,
  lastUpdate,
  cooldownPeriod,
  onUpdate,
}: ParameterRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { min, max } = calculateMaxChange(currentValue, maxChangeBps);
  const now = Math.floor(Date.now() / 1000);
  const timeSinceLastUpdate = now - lastUpdate;
  const cooldownRemaining = Math.max(0, cooldownPeriod - timeSinceLastUpdate);
  const isCooldownActive = cooldownRemaining > 0;

  const handleSubmit = async () => {
    const newValue = parseFloat(editValue);

    if (isNaN(newValue)) {
      toast.error('Invalid number');
      return;
    }

    if (newValue < min || newValue > max) {
      toast.error(`Value must be between ${min.toFixed(2)} and ${max.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(name, Math.floor(newValue));
      setIsEditing(false);
      toast.success('Parameter updated successfully');
    } catch (error) {
      // Error already handled in onUpdate
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCooldown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="border-b border-gray-700 last:border-0 py-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-white">{label}</h4>
            {isCooldownActive && (
              <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                Cooldown: {formatCooldown(cooldownRemaining)}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">{description}</p>

          {isEditing ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm w-32"
                  disabled={isSubmitting}
                  step="any"
                />
                <span className="text-sm text-gray-400">{unit}</span>
              </div>

              <div className="text-xs text-gray-500">
                Allowed range: {min.toFixed(2)} - {max.toFixed(2)} {unit}
                <br />
                Max change: {(maxChangeBps / 100).toFixed(1)}%
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isCooldownActive}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition"
                >
                  {isSubmitting ? 'Updating...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditValue(value.toString());
                  }}
                  disabled={isSubmitting}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white text-sm rounded transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-3">
              <span className="text-lg font-mono text-white">
                {value.toLocaleString()} {unit}
              </span>
              <button
                onClick={() => setIsEditing(true)}
                disabled={isCooldownActive}
                className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ParameterManagement() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { parameters, loading, error, refresh } = useParameters();

  const handleUpdateParameter = async (name: string, value: number) => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet');
      throw new Error('Wallet not connected');
    }

    const result = await updateParameter({
      parameterName: name,
      newValue: value,
      publicKey,
      connection,
      signTransaction,
    });

    if (!result.success) {
      toast.error(result.error || 'Failed to update parameter');
      throw new Error(result.error);
    }

    // Refresh parameters after successful update
    await refresh();
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Parameter Management</h2>
        <div className="flex items-center justify-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <span className="ml-3 text-gray-400">Loading parameters...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg border border-red-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Parameter Management</h2>
        <div className="text-red-400 text-sm">{error}</div>
        <button
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!parameters) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Parameter Management</h2>
        <button
          onClick={refresh}
          className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-1">
        {/* Fee Parameters */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-300 mb-3 uppercase tracking-wider">
            Fee Configuration
          </h3>
          <ParameterRow
            name="platformFeeBps"
            label="Platform Fee"
            value={parameters.platformFeeBps}
            unit="BPS"
            description="Platform fee charged on bets (100 BPS = 1%)"
            currentValue={parameters.platformFeeBps}
            maxChangeBps={parameters.maxChangeBps}
            lastUpdate={parameters.lastUpdate}
            cooldownPeriod={parameters.cooldownPeriod}
            onUpdate={handleUpdateParameter}
          />
          <ParameterRow
            name="creatorFeeBps"
            label="Creator Fee"
            value={parameters.creatorFeeBps}
            unit="BPS"
            description="Fee paid to market creators (100 BPS = 1%)"
            currentValue={parameters.creatorFeeBps}
            maxChangeBps={parameters.maxChangeBps}
            lastUpdate={parameters.lastUpdate}
            cooldownPeriod={parameters.cooldownPeriod}
            onUpdate={handleUpdateParameter}
          />
        </div>

        {/* Market Duration Parameters */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-300 mb-3 uppercase tracking-wider">
            Market Duration Limits
          </h3>
          <ParameterRow
            name="minMarketDuration"
            label="Minimum Market Duration"
            value={parameters.minMarketDuration}
            unit="seconds"
            description="Minimum time a market must remain open"
            currentValue={parameters.minMarketDuration}
            maxChangeBps={parameters.maxChangeBps}
            lastUpdate={parameters.lastUpdate}
            cooldownPeriod={parameters.cooldownPeriod}
            onUpdate={handleUpdateParameter}
          />
          <ParameterRow
            name="maxMarketDuration"
            label="Maximum Market Duration"
            value={parameters.maxMarketDuration}
            unit="seconds"
            description="Maximum time a market can remain open"
            currentValue={parameters.maxMarketDuration}
            maxChangeBps={parameters.maxChangeBps}
            lastUpdate={parameters.lastUpdate}
            cooldownPeriod={parameters.cooldownPeriod}
            onUpdate={handleUpdateParameter}
          />
        </div>

        {/* Bond and Period Parameters */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-300 mb-3 uppercase tracking-wider">
            Bonds & Governance Periods
          </h3>
          <ParameterRow
            name="minBondAmount"
            label="Minimum Bond Amount"
            value={parameters.minBondAmount}
            unit="lamports"
            description="Minimum bond required to create a market"
            currentValue={parameters.minBondAmount}
            maxChangeBps={parameters.maxChangeBps}
            lastUpdate={parameters.lastUpdate}
            cooldownPeriod={parameters.cooldownPeriod}
            onUpdate={handleUpdateParameter}
          />
          <ParameterRow
            name="votingPeriodDuration"
            label="Voting Period"
            value={parameters.votingPeriodDuration}
            unit="seconds"
            description="Duration for community voting on proposals"
            currentValue={parameters.votingPeriodDuration}
            maxChangeBps={parameters.maxChangeBps}
            lastUpdate={parameters.lastUpdate}
            cooldownPeriod={parameters.cooldownPeriod}
            onUpdate={handleUpdateParameter}
          />
          <ParameterRow
            name="disputePeriodDuration"
            label="Dispute Period"
            value={parameters.disputePeriodDuration}
            unit="seconds"
            description="Time window for disputing market resolutions"
            currentValue={parameters.disputePeriodDuration}
            maxChangeBps={parameters.maxChangeBps}
            lastUpdate={parameters.lastUpdate}
            cooldownPeriod={parameters.cooldownPeriod}
            onUpdate={handleUpdateParameter}
          />
        </div>
      </div>

      {/* Safety Info */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-500">
          <p>
            <span className="font-medium">Cooldown Period:</span>{' '}
            {(parameters.cooldownPeriod / 3600).toFixed(0)} hours between updates
          </p>
          <p className="mt-1">
            <span className="font-medium">Max Change:</span> {(parameters.maxChangeBps / 100).toFixed(1)}% per
            update
          </p>
        </div>
      </div>
    </div>
  );
}
