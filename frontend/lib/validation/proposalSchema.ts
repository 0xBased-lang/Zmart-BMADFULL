/**
 * Zod Validation Schema for Proposal Creation
 * Story 3.6 - Build Proposal Creation Flow
 */

import { z } from 'zod';
import { VALIDATION_RULES } from '../types/proposal';

export const proposalFormSchema = z.object({
  // Step 1: Market Info
  title: z
    .string()
    .min(
      VALIDATION_RULES.title.min,
      `Title must be at least ${VALIDATION_RULES.title.min} characters`
    )
    .max(
      VALIDATION_RULES.title.max,
      `Title must be at most ${VALIDATION_RULES.title.max} characters`
    ),

  category: z.string().min(1, 'Please select a category'),

  // Step 2: Resolution Criteria
  description: z.string().min(50, 'Resolution criteria must be at least 50 characters'),

  evidenceRequirements: z.string().optional(),

  endDate: z
    .date()
    .refine((date) => date > new Date(), {
      message: 'End date must be in the future',
    })
    .refine(
      (date) => {
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + VALIDATION_RULES.endDate.maxYears);
        return date <= maxDate;
      },
      {
        message: `End date must be within ${VALIDATION_RULES.endDate.maxYears} years`,
      }
    ),

  // Step 3: Bond Selection
  bondAmount: z
    .number()
    .min(VALIDATION_RULES.bond.min, `Minimum bond is ${VALIDATION_RULES.bond.min} ZMart`),
});

export type ProposalFormSchema = z.infer<typeof proposalFormSchema>;
