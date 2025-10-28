'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface OverrideModalProps {
  marketId: string;
  marketTitle: string;
  onClose: () => void;
  onConfirm: (marketId: string, outcome: 'YES' | 'NO' | 'CANCELLED', reason: string) => Promise<void>;
}

export function OverrideModal({ marketId, marketTitle, onClose, onConfirm }: OverrideModalProps) {
  const [outcome, setOutcome] = useState<'YES' | 'NO' | 'CANCELLED'>('YES');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (reason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(marketId, outcome, reason);
      toast.success('Market resolution overridden successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to override resolution');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold text-white mb-4">Override Market Resolution</h3>

        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">Market:</p>
          <p className="text-white font-medium">{marketTitle}</p>
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-400 block mb-2">New Outcome:</label>
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as any)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            disabled={isSubmitting}
          >
            <option value="YES">YES</option>
            <option value="NO">NO</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-400 block mb-2">
            Reason (min 10 characters):
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white h-24"
            placeholder="Explain why this override is necessary..."
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">{reason.length} / 10 minimum</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || reason.trim().length < 10}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition"
          >
            {isSubmitting ? 'Submitting...' : 'Confirm Override'}
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
