/**
 * Cross-Program State Assertions
 *
 * Custom assertion functions for verifying state consistency across multiple
 * programs in integration tests. Provides high-level validation of complex
 * cross-program invariants.
 */

import { expect } from "chai";
import { PublicKey } from "@solana/web3.js";
import { ProgramInstances, getBalance } from "./accounts";
import * as anchor from "@coral-xyz/anchor";

/**
 * Assert that a market was created correctly from a proposal
 */
export async function assertMarketCreatedFromProposal(
  programs: ProgramInstances,
  marketKey: PublicKey,
  expectedTitle: string,
  expectedDescription: string
): Promise<void> {
  const market = await programs.coreMarkets.account.market.fetch(marketKey);

  expect(market.title).to.equal(expectedTitle, "Market title should match proposal");
  expect(market.description).to.equal(expectedDescription, "Market description should match proposal");
  expect(market.resolved).to.be.false;
}

/**
 * Assert that bond was properly deposited and tracked
 */
export async function assertBondDeposited(
  programs: ProgramInstances,
  bondPda: PublicKey,
  creator: PublicKey,
  expectedAmount: anchor.BN
): Promise<void> {
  const bondAccount = await programs.bondManager.account.bond.fetch(bondPda);

  expect(bondAccount.creator.toString()).to.equal(creator.toString());
  expect(bondAccount.amount.toString()).to.equal(expectedAmount.toString());
  expect(bondAccount.refunded).to.be.false;
}

/**
 * Assert that bond was refunded to creator
 */
export async function assertBondRefunded(
  programs: ProgramInstances,
  bondPda: PublicKey
): Promise<void> {
  const bondAccount = await programs.bondManager.account.bond.fetch(bondPda);
  expect(bondAccount.refunded).to.be.true;
}

/**
 * Assert that fees were distributed correctly
 */
export async function assertFeesDistributed(
  programs: ProgramInstances,
  treasuryBalance: number,
  teamBalance: number,
  burnBalance: number,
  creatorFees: anchor.BN,
  expectedTotal: anchor.BN
): Promise<void> {
  // Verify total fees match expected (platform + team + burn + creator = total fees)
  const totalFees = treasuryBalance + teamBalance + burnBalance + creatorFees.toNumber();

  // Allow for small rounding differences
  const difference = Math.abs(totalFees - expectedTotal.toNumber());
  expect(difference).to.be.lessThan(1000, "Fee distribution should match expected total");
}

/**
 * Assert that bet was placed correctly
 */
export async function assertBetPlaced(
  programs: ProgramInstances,
  betPda: PublicKey,
  bettor: PublicKey,
  expectedAmount: anchor.BN,
  expectedSide: boolean
): Promise<void> {
  const bet = await programs.coreMarkets.account.bet.fetch(betPda);

  expect(bet.bettor.toString()).to.equal(bettor.toString());
  expect(bet.amount.toString()).to.equal(expectedAmount.toString());
  expect(bet.side).to.equal(expectedSide);
  expect(bet.claimed).to.be.false;
}

/**
 * Assert that market was resolved with correct outcome
 */
export async function assertMarketResolved(
  programs: ProgramInstances,
  marketKey: PublicKey,
  resolutionPda: PublicKey,
  expectedOutcome: boolean
): Promise<void> {
  const market = await programs.coreMarkets.account.market.fetch(marketKey);
  const resolution = await programs.marketResolution.account.resolution.fetch(resolutionPda);

  expect(market.resolved).to.be.true;
  expect(resolution.outcome).to.equal(expectedOutcome);
  expect(resolution.finalized).to.be.true;
}

/**
 * Assert that payout was claimed successfully
 */
export async function assertPayoutClaimed(
  programs: ProgramInstances,
  betPda: PublicKey,
  expectedPayout: anchor.BN
): Promise<void> {
  const bet = await programs.coreMarkets.account.bet.fetch(betPda);

  expect(bet.claimed).to.be.true;
  expect(bet.payout.toString()).to.equal(expectedPayout.toString());
}

/**
 * Assert that parameter was updated and propagated
 */
export async function assertParameterUpdated(
  programs: ProgramInstances,
  parametersPda: PublicKey,
  parameterName: string,
  expectedValue: any
): Promise<void> {
  const parameters = await programs.parameterStorage.account.parameters.fetch(parametersPda);

  // Access parameter by name (assuming parameters struct has named fields)
  const actualValue = parameters[parameterName];

  if (typeof expectedValue === "object" && expectedValue !== null && "toString" in expectedValue) {
    expect(actualValue.toString()).to.equal(expectedValue.toString());
  } else {
    expect(actualValue).to.equal(expectedValue);
  }
}

/**
 * Assert that program was registered in registry
 */
export async function assertProgramRegistered(
  programs: ProgramInstances,
  registryPda: PublicKey,
  programName: string,
  expectedProgramId: PublicKey
): Promise<void> {
  const registry = await programs.programRegistry.account.registry.fetch(registryPda);

  // Assuming registry has a map of program names to IDs
  const registeredId = registry.programs[programName];
  expect(registeredId.toString()).to.equal(expectedProgramId.toString());
}

/**
 * Assert that account balance changed by expected amount
 */
export async function assertBalanceChanged(
  programs: ProgramInstances,
  account: PublicKey,
  beforeBalance: number,
  expectedChange: number,
  tolerance: number = 1000 // Allow for transaction fees
): Promise<void> {
  const afterBalance = await getBalance(programs.provider, account);
  const actualChange = afterBalance - beforeBalance;
  const difference = Math.abs(actualChange - expectedChange);

  expect(difference).to.be.lessThan(
    tolerance,
    `Balance change should be ${expectedChange}, was ${actualChange}`
  );
}

/**
 * Assert that proposal was approved
 */
export async function assertProposalApproved(
  programs: ProgramInstances,
  proposalPda: PublicKey
): Promise<void> {
  const proposal = await programs.proposalSystem.account.proposal.fetch(proposalPda);

  expect(proposal.approved).to.be.true;
  expect(proposal.votesYes.toNumber()).to.be.greaterThan(proposal.votesNo.toNumber());
}

/**
 * Assert that votes were aggregated correctly
 */
export async function assertVotesAggregated(
  programs: ProgramInstances,
  targetPda: PublicKey,
  expectedYes: number,
  expectedNo: number
): Promise<void> {
  // Could be proposal or resolution - try both
  try {
    const proposal = await programs.proposalSystem.account.proposal.fetch(targetPda);
    expect(proposal.votesYes.toNumber()).to.equal(expectedYes);
    expect(proposal.votesNo.toNumber()).to.equal(expectedNo);
    return;
  } catch (e) {
    // Try resolution
    const resolution = await programs.marketResolution.account.resolution.fetch(targetPda);
    expect(resolution.votesYes.toNumber()).to.equal(expectedYes);
    expect(resolution.votesNo.toNumber()).to.equal(expectedNo);
  }
}

/**
 * Assert total value locked (TVL) in a market
 */
export async function assertMarketTVL(
  programs: ProgramInstances,
  marketKey: PublicKey,
  expectedTVL: anchor.BN
): Promise<void> {
  const market = await programs.coreMarkets.account.market.fetch(marketKey);

  const totalBets = market.totalYesBets.add(market.totalNoBets);
  expect(totalBets.toString()).to.equal(expectedTVL.toString(), "Market TVL should match expected");
}

/**
 * Assert that market probabilities are valid (sum to 100%)
 */
export async function assertMarketProbabilitiesValid(
  programs: ProgramInstances,
  marketKey: PublicKey
): Promise<void> {
  const market = await programs.coreMarkets.account.market.fetch(marketKey);

  // Probabilities should be between 0 and 100
  expect(market.yesProb).to.be.at.least(0);
  expect(market.yesProb).to.be.at.most(100);
  expect(market.noProb).to.be.at.least(0);
  expect(market.noProb).to.be.at.most(100);

  // YES + NO should equal 100 (approximately, allowing for rounding)
  const sum = market.yesProb + market.noProb;
  expect(Math.abs(sum - 100)).to.be.lessThan(2, "Probabilities should sum to 100%");
}

/**
 * Assert that creator fees were accumulated correctly
 */
export async function assertCreatorFeesAccumulated(
  programs: ProgramInstances,
  bondPda: PublicKey,
  expectedFees: anchor.BN
): Promise<void> {
  const bondAccount = await programs.bondManager.account.bond.fetch(bondPda);

  expect(bondAccount.accumulatedFees.toString()).to.equal(
    expectedFees.toString(),
    "Accumulated creator fees should match expected"
  );
}

/**
 * Assert that admin override was executed correctly
 */
export async function assertAdminOverride(
  programs: ProgramInstances,
  resolutionPda: PublicKey,
  expectedOutcome: boolean
): Promise<void> {
  const resolution = await programs.marketResolution.account.resolution.fetch(resolutionPda);

  expect(resolution.overridden).to.be.true;
  expect(resolution.outcome).to.equal(expectedOutcome);
  expect(resolution.finalized).to.be.true;
}
