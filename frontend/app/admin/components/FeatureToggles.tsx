'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useToggles } from '@/lib/hooks/useToggles';
import { updateToggle } from '@/lib/admin/toggles';
import toast from 'react-hot-toast';
import { Switch } from '@headlessui/react';

interface ToggleRowProps {
  name: string;
  label: string;
  description: string;
  enabled: boolean;
  critical?: boolean;
  onUpdate: (name: string, enabled: boolean) => Promise<void>;
}

function ToggleRow({ name, label, description, enabled, critical, onUpdate }: ToggleRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleToggle = async (newValue: boolean) => {
    if (critical && !newValue) {
      // Disabling critical feature requires confirmation
      setShowConfirm(true);
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate(name, newValue);
      toast.success(`${label} ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      // Error already handled in onUpdate
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmToggle = async () => {
    setShowConfirm(false);
    setIsUpdating(true);
    try {
      await onUpdate(name, false);
      toast.success(`${label} disabled`);
    } catch (error) {
      // Error already handled
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="border-b border-gray-700 last:border-0 py-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-white">{label}</h4>
            {critical && (
              <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">Critical</span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>

        <Switch
          checked={enabled}
          onChange={handleToggle}
          disabled={isUpdating}
          className={`${
            enabled ? 'bg-green-600' : 'bg-gray-600'
          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span
            className={`${
              enabled ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </Switch>
      </div>

      {showConfirm && (
        <div className="mt-3 p-3 bg-red-900/20 border border-red-700 rounded">
          <p className="text-sm text-red-300 mb-2">Are you sure you want to disable {label}?</p>
          <div className="flex gap-2">
            <button
              onClick={confirmToggle}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
            >
              Confirm Disable
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function FeatureToggles() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { toggles, loading, error, refresh } = useToggles();

  const handleUpdateToggle = async (name: string, enabled: boolean) => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet');
      throw new Error('Wallet not connected');
    }

    const result = await updateToggle({
      toggleName: name,
      enabled,
      publicKey,
      connection,
      signTransaction,
    });

    if (!result.success) {
      toast.error(result.error || 'Failed to update toggle');
      throw new Error(result.error);
    }

    await refresh();
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Feature Toggles</h2>
        <div className="flex items-center justify-center py-4">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        </div>
      </div>
    );
  }

  if (error || !toggles) {
    return (
      <div className="bg-gray-800 rounded-lg border border-red-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Feature Toggles</h2>
        <div className="text-red-400 text-sm">{error || 'Failed to load'}</div>
        <button
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Feature Toggles</h2>
        <button
          onClick={refresh}
          className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-1">
        <ToggleRow
          name="marketCreationEnabled"
          label="Market Creation"
          description="Allow users to create new prediction markets"
          enabled={toggles.marketCreationEnabled}
          critical
          onUpdate={handleUpdateToggle}
        />
        <ToggleRow
          name="bettingEnabled"
          label="Betting"
          description="Allow users to place bets on markets"
          enabled={toggles.bettingEnabled}
          critical
          onUpdate={handleUpdateToggle}
        />
        <ToggleRow
          name="votingEnabled"
          label="Voting"
          description="Allow community voting on market resolutions"
          enabled={toggles.votingEnabled}
          critical
          onUpdate={handleUpdateToggle}
        />
        <ToggleRow
          name="proposalsEnabled"
          label="Proposals"
          description="Allow users to submit market proposals"
          enabled={toggles.proposalsEnabled}
          onUpdate={handleUpdateToggle}
        />
        <ToggleRow
          name="emergencyPause"
          label="Emergency Pause"
          description="Master kill switch - disables all platform operations"
          enabled={toggles.emergencyPause}
          critical
          onUpdate={handleUpdateToggle}
        />
      </div>
    </div>
  );
}
