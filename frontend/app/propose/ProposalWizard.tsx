'use client';

/**
 * ProposalWizard - Multi-step proposal creation form
 * Story 3.6 - Build Proposal Creation Flow
 *
 * Manages 4-step wizard:
 * 1. Market Info (title, category)
 * 2. Resolution Criteria (description, evidence, end date)
 * 3. Bond Selection (bond amount, fee preview)
 * 4. Review & Submit (summary, transaction)
 */

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { proposalFormSchema, type ProposalFormSchema } from '@/lib/validation/proposalSchema';
import { type ProposalFormData } from '@/lib/types/proposal';
import { useProposalSubmit } from '@/lib/hooks/useProposalSubmit';
import Step1MarketInfo from './components/Step1MarketInfo';
import Step2Resolution from './components/Step2Resolution';
import Step3BondSelection from './components/Step3BondSelection';
import Step4Preview from './components/Step4Preview';

const TOTAL_STEPS = 4;

export default function ProposalWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();

  // Initialize Solana transaction hook
  const { submitProposal, isSubmitting: isSubmittingTx } = useProposalSubmit();

  // Initialize React Hook Form with Zod validation
  const methods = useForm<ProposalFormSchema>({
    resolver: zodResolver(proposalFormSchema),
    mode: 'onBlur',
    defaultValues: {
      title: '',
      category: '',
      description: '',
      evidenceRequirements: '',
      bondAmount: 50, // Minimum bond
    },
  });

  const {
    handleSubmit,
    trigger,
    formState: { isValid },
  } = methods;

  // Handle next step navigation
  const handleNext = async () => {
    // Validate current step fields before proceeding
    let fieldsToValidate: (keyof ProposalFormSchema)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['title', 'category'];
        break;
      case 2:
        fieldsToValidate = ['description', 'endDate'];
        break;
      case 3:
        fieldsToValidate = ['bondAmount'];
        break;
    }

    const isStepValid = await trigger(fieldsToValidate);

    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    }
  };

  // Handle previous step navigation
  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Handle form submission (Step 4)
  const onSubmit = async (data: ProposalFormSchema) => {
    // Submit proposal to Solana
    const result = await submitProposal({
      title: data.title,
      description: data.description,
      bondAmount: data.bondAmount,
      endTimestamp: Math.floor(data.endDate.getTime() / 1000), // Convert to Unix timestamp
    });

    if (result.success) {
      // Navigate to success page with proposal details
      router.push(`/propose/success?signature=${result.signature}&proposalId=${result.proposalId}`);
    }
    // Error handling is done within the hook (toast notifications)
  };

  // Handle edit navigation from preview step
  const handleEditStep = (step: number) => {
    setCurrentStep(step);
  };

  // Render current step component
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1MarketInfo />;
      case 2:
        return <Step2Resolution />;
      case 3:
        return <Step3BondSelection />;
      case 4:
        return <Step4Preview onEditStep={handleEditStep} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Step {currentStep} of {TOTAL_STEPS}
          </h2>
          <span className="text-sm text-gray-500">
            {Math.round((currentStep / TOTAL_STEPS) * 100)}% Complete
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        {/* Step Labels */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-gray-600">
          <div className={currentStep >= 1 ? 'font-semibold text-blue-600' : ''}>
            Market Info
          </div>
          <div className={currentStep >= 2 ? 'font-semibold text-blue-600' : ''}>
            Resolution
          </div>
          <div className={currentStep >= 3 ? 'font-semibold text-blue-600' : ''}>
            Bond
          </div>
          <div className={currentStep >= 4 ? 'font-semibold text-blue-600' : ''}>
            Review
          </div>
        </div>
      </div>

      {/* Form */}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Current Step Content */}
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center bg-white rounded-lg p-6 shadow-sm">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-6 py-2 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {currentStep < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isValid || isSubmittingTx}
                className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingTx ? 'Submitting Transaction...' : 'Submit Proposal'}
              </button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
