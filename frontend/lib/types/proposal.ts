/**
 * Type definitions for Proposal Creation Flow
 * Story 3.6 - Build Proposal Creation Flow
 */

export interface ProposalFormData {
  // Step 1: Market Info
  title: string;
  category: string;

  // Step 2: Resolution Criteria
  description: string; // Resolution criteria
  evidenceRequirements: string; // Optional evidence links/requirements
  endDate: Date;

  // Step 3: Bond Selection
  bondAmount: number; // in lamports
}

export interface BondTier {
  name: 'Low' | 'Medium' | 'High';
  minAmount: number; // in ZMart
  maxAmount?: number; // in ZMart
  creatorFeePercent: number; // 0.5%, 1.0%, or 2.0%
}

export const BOND_TIERS: BondTier[] = [
  {
    name: 'Low',
    minAmount: 50,
    maxAmount: 99,
    creatorFeePercent: 0.5,
  },
  {
    name: 'Medium',
    minAmount: 100,
    maxAmount: 499,
    creatorFeePercent: 1.0,
  },
  {
    name: 'High',
    minAmount: 500,
    creatorFeePercent: 2.0,
  },
];

export interface FeeBreakdown {
  bondAmount: number; // Refundable (100% if approved, 50% if rejected, 0% if cancelled)
  proposalTax: number; // 1% non-refundable
  creatorFee: number; // Based on bond tier
  totalCost: number; // Sum of all fees
}

export const MARKET_CATEGORIES = [
  'Politics',
  'Sports',
  'Crypto',
  'Technology',
  'Entertainment',
  'Science',
  'Economics',
  'Other',
] as const;

export type MarketCategory = (typeof MARKET_CATEGORIES)[number];

// Validation constants
export const VALIDATION_RULES = {
  title: {
    min: 10,
    max: 200,
  },
  endDate: {
    maxYears: 2,
  },
  bond: {
    min: 50, // ZMart
  },
  proposalTaxPercent: 1, // 1% of bond
} as const;

// Helper function to calculate fee breakdown
export function calculateFees(bondAmount: number): FeeBreakdown {
  const proposalTax = bondAmount * (VALIDATION_RULES.proposalTaxPercent / 100);

  // Determine bond tier
  const tier = BOND_TIERS.find(
    (t) => bondAmount >= t.minAmount && (!t.maxAmount || bondAmount <= t.maxAmount)
  ) || BOND_TIERS[BOND_TIERS.length - 1];

  const creatorFee = bondAmount * (tier.creatorFeePercent / 100);

  return {
    bondAmount,
    proposalTax,
    creatorFee,
    totalCost: bondAmount + proposalTax,
  };
}

// Helper function to get bond tier
export function getBondTier(bondAmount: number): BondTier {
  return (
    BOND_TIERS.find(
      (t) => bondAmount >= t.minAmount && (!t.maxAmount || bondAmount <= t.maxAmount)
    ) || BOND_TIERS[BOND_TIERS.length - 1]
  );
}
