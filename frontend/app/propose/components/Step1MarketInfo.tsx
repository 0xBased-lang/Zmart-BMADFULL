'use client';

/**
 * Step 1: Market Info
 * Story 3.6 - Build Proposal Creation Flow
 *
 * Collects:
 * - Title (10-200 characters)
 * - Category (dropdown selection)
 */

import { useFormContext } from 'react-hook-form';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { MARKET_CATEGORIES } from '@/lib/types/proposal';
import type { ProposalFormSchema } from '@/lib/validation/proposalSchema';

export default function Step1MarketInfo() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<ProposalFormSchema>();

  const selectedCategory = watch('category');
  const titleValue = watch('title');

  return (
    <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Market Information
        </h3>
        <p className="text-gray-600">
          Provide basic details about your proposed prediction market
        </p>
      </div>

      {/* Title Input */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Market Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          {...register('title')}
          placeholder="e.g., Will Bitcoin reach $100,000 by end of 2025?"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
        />

        {/* Character Counter */}
        <div className="mt-1 flex justify-between items-center text-sm">
          <div>
            {errors.title && (
              <span className="text-red-500">{errors.title.message}</span>
            )}
          </div>
          <span className={`${titleValue?.length > 200 ? 'text-red-500' : 'text-gray-500'}`}>
            {titleValue?.length || 0} / 200 characters
          </span>
        </div>

        {/* Help Text */}
        {!errors.title && (
          <p className="mt-1 text-sm text-gray-500">
            Write a clear, specific question that can be objectively resolved
          </p>
        )}
      </div>

      {/* Category Selector */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          Category <span className="text-red-500">*</span>
        </label>

        <Listbox
          value={selectedCategory}
          onChange={(value) => setValue('category', value, { shouldValidate: true })}
        >
          <div className="relative">
            <Listbox.Button
              className={`relative w-full px-4 py-3 text-left border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <span className={selectedCategory ? 'text-gray-900' : 'text-gray-400'}>
                {selectedCategory || 'Select a category'}
              </span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </Listbox.Button>

            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
                {MARKET_CATEGORIES.map((category) => (
                  <Listbox.Option
                    key={category}
                    value={category}
                    className={({ active }) =>
                      `cursor-pointer select-none relative py-2 px-4 ${
                        active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                        {category}
                      </span>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>

        {errors.category && (
          <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>
        )}

        {!errors.category && (
          <p className="mt-1 text-sm text-gray-500">
            Choose the category that best fits your market
          </p>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
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
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Pro Tips for Great Markets:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Be specific and avoid ambiguous wording</li>
              <li>Include clear resolution criteria</li>
              <li>Set a reasonable end date for resolution</li>
              <li>Choose a category that matches your market topic</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
