/**
 * Integration Test Configuration
 *
 * Centralized configuration for integration tests including timeouts,
 * retry policies, and test environment settings.
 */

/**
 * Timeout configuration (in milliseconds)
 */
export const TIMEOUTS = {
  // Individual transaction confirmation
  TRANSACTION: 30000, // 30 seconds

  // Single workflow step (one cross-program interaction)
  WORKFLOW_STEP: 45000, // 45 seconds

  // Complete workflow (multiple steps)
  COMPLETE_WORKFLOW: 120000, // 2 minutes

  // Test suite setup/teardown
  SUITE_SETUP: 60000, // 1 minute

  // Account confirmation after creation
  ACCOUNT_WAIT: 30000, // 30 seconds

  // Default Mocha test timeout
  DEFAULT_TEST: 90000, // 1.5 minutes
};

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  // Number of retries for flaky operations
  MAX_RETRIES: 3,

  // Delay between retries (ms)
  RETRY_DELAY: 2000, // 2 seconds

  // Backoff multiplier for exponential backoff
  BACKOFF_MULTIPLIER: 1.5,
};

/**
 * Economic constants for testing
 */
export const ECONOMIC_CONSTANTS = {
  LAMPORTS_PER_USDC: 1_000_000, // 6 decimals
  MIN_BET_AMOUNT: 1_000_000, // 1 USDC
  MAX_BET_AMOUNT: 1000_000_000, // 1000 USDC
  INITIAL_PROBABILITY: 50, // 50%
  INITIAL_LIQUIDITY: 100_000_000, // 100 USDC
  PROPOSAL_BOND_AMOUNT: 10_000_000, // 10 USDC
};

/**
 * Fee percentages (basis points, 10000 = 100%)
 */
export const FEE_PERCENTAGES = {
  PLATFORM_FEE: 200, // 2%
  TEAM_FEE: 100, // 1%
  BURN_FEE: 50, // 0.5%
  CREATOR_FEE: 150, // 1.5%
  TOTAL_FEE: 500, // 5%
};

/**
 * Governance parameters
 */
export const GOVERNANCE = {
  PROPOSAL_APPROVAL_THRESHOLD: 60, // 60% YES votes required
  RESOLUTION_VOTE_THRESHOLD: 50, // 50% + 1 for resolution
  DISPUTE_WINDOW: 48 * 60 * 60, // 48 hours in seconds
  VOTING_PERIOD: 7 * 24 * 60 * 60, // 7 days in seconds
};

/**
 * Test data generation helpers
 */
export const TEST_DATA = {
  /**
   * Generate a random market title
   */
  generateMarketTitle: (): string => {
    const topics = [
      "BTC reach $100k",
      "ETH flip BTC",
      "SOL reach $500",
      "NFT sales exceed $1B",
      "DAO adoption by Fortune 500",
    ];
    const timeframes = ["by end of 2025", "in Q1 2026", "before 2027", "this year"];
    return `Will ${topics[Math.floor(Math.random() * topics.length)]} ${
      timeframes[Math.floor(Math.random() * timeframes.length)]
    }?`;
  },

  /**
   * Generate market description
   */
  generateMarketDescription: (title: string): string => {
    return `Market resolves based on verified data sources. ${title} Resolution criteria: confirmed by at least 2 major sources.`;
  },

  /**
   * Generate future timestamp (days from now)
   */
  generateFutureTimestamp: (daysFromNow: number): number => {
    return Math.floor(Date.now() / 1000) + daysFromNow * 24 * 60 * 60;
  },
};

/**
 * Apply extended timeout to Mocha test
 */
export function extendedTimeout(test: Mocha.Runnable, timeout: number = TIMEOUTS.DEFAULT_TEST): void {
  test.timeout(timeout);
}

/**
 * Retry wrapper for flaky operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = RETRY_CONFIG.MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delay = RETRY_CONFIG.RETRY_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Operation failed after retries");
}

/**
 * Wait helper with timeout
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  timeoutMs: number = TIMEOUTS.ACCOUNT_WAIT,
  pollInterval: number = 1000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Condition not met after ${timeoutMs}ms`);
}
