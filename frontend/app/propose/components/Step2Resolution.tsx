'use client';

/**
 * Step 2: Resolution Criteria
 * Story 3.6 - Build Proposal Creation Flow
 *
 * Collects:
 * - Resolution criteria (textarea with markdown support)
 * - Evidence requirements (optional links)
 * - End date (date picker, must be future date, max 2 years)
 */

import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import type { ProposalFormSchema } from '@/lib/validation/proposalSchema';

// Simple markdown renderer (converts **bold**, *italic*, and line breaks)
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
}

export default function Step2Resolution() {
  const [showPreview, setShowPreview] = useState(false);

  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<ProposalFormSchema>();

  const descriptionValue = watch('description');
  const evidenceValue = watch('evidenceRequirements');
  const endDateValue = watch('endDate');

  // Calculate min and max dates
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1); // Tomorrow

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 2); // 2 years from now

  return (
    <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Resolution Criteria
        </h3>
        <p className="text-gray-600">
          Define how this market will be resolved and when
        </p>
      </div>

      {/* Resolution Criteria Textarea */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Resolution Criteria <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>

        {!showPreview ? (
          <>
            <textarea
              id="description"
              {...register('description')}
              rows={6}
              placeholder="Describe how this market will be objectively resolved. Be specific and clear.

Example: This market will resolve to YES if Bitcoin (BTC) reaches or exceeds $100,000 USD on any major exchange (Coinbase, Binance, Kraken) before the end date. The market will resolve to NO if BTC does not reach this price by the end date."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Use **bold** or *italic* for emphasis. {descriptionValue?.length || 0} characters
            </p>
          </>
        ) : (
          <div
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 min-h-[160px] prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(descriptionValue || ''),
            }}
          />
        )}
      </div>

      {/* Evidence Requirements (Optional) */}
      <div>
        <label htmlFor="evidenceRequirements" className="block text-sm font-medium text-gray-700 mb-2">
          Evidence Requirements <span className="text-gray-500">(Optional)</span>
        </label>
        <textarea
          id="evidenceRequirements"
          {...register('evidenceRequirements')}
          rows={3}
          placeholder="What evidence should be provided to resolve this market? (URLs, data sources, etc.)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          List any specific sources or evidence types needed for resolution
        </p>
      </div>

      {/* End Date Picker */}
      <div>
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
          End Date <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <DatePicker
            selected={endDateValue}
            onChange={(date) => setValue('endDate', date as Date, { shouldValidate: true })}
            minDate={minDate}
            maxDate={maxDate}
            dateFormat="MMMM d, yyyy"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.endDate ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholderText="Select market end date"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {errors.endDate && (
          <p className="mt-1 text-sm text-red-500">{errors.endDate.message}</p>
        )}

        {!errors.endDate && endDateValue && (
          <p className="mt-1 text-sm text-green-600">
            Market will end on {endDateValue.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}

        {!errors.endDate && !endDateValue && (
          <p className="mt-1 text-sm text-gray-500">
            Must be a future date, maximum 2 years from now
          </p>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg
            className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
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
          <div className="text-sm text-amber-900">
            <p className="font-medium mb-1">Resolution Criteria Best Practices:</p>
            <ul className="list-disc list-inside space-y-1 text-amber-800">
              <li>Be objective and verifiable - avoid subjective language</li>
              <li>Specify exact sources and conditions for resolution</li>
              <li>Include edge case handling (ties, unavailable data, etc.)</li>
              <li>Set a realistic end date with buffer time for data availability</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
