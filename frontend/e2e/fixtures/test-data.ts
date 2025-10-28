/**
 * Test Data Fixture
 * Story 4.3 - Frontend E2E Tests with Playwright
 *
 * Provides consistent test data for markets, proposals, and user scenarios.
 * Ensures deterministic test execution with predictable data.
 */

/**
 * Test market configurations for different states
 */
export const TEST_MARKETS = {
  // Active market accepting bets
  ACTIVE_MARKET: {
    id: 'test-market-1-active',
    title: 'Will Bitcoin reach $100k by end of 2025?',
    description: 'Test market for active betting scenarios',
    category: 'CRYPTO',
    endTime: new Date('2025-12-31T23:59:59Z'),
    totalPool: 1000,
    yesPool: 600,
    noPool: 400,
    status: 'ACTIVE',
    creator: '11111111111111111111111111111111',
  },

  // Market that has ended, awaiting resolution
  ENDED_MARKET: {
    id: 'test-market-2-ended',
    title: 'Did Team A win the championship?',
    description: 'Test market for resolution voting scenarios',
    category: 'SPORTS',
    endTime: new Date('2025-01-01T00:00:00Z'), // Past date
    totalPool: 5000,
    yesPool: 3000,
    noPool: 2000,
    status: 'ENDED',
    creator: '22222222222222222222222222222222',
  },

  // Resolved market with YES outcome
  RESOLVED_YES_MARKET: {
    id: 'test-market-3-resolved-yes',
    title: 'Will it snow in December?',
    description: 'Test market for payout claim scenarios (YES outcome)',
    category: 'WEATHER',
    endTime: new Date('2024-12-31T23:59:59Z'),
    totalPool: 2000,
    yesPool: 1200,
    noPool: 800,
    status: 'RESOLVED',
    outcome: 'YES',
    creator: '11111111111111111111111111111111',
  },

  // Resolved market with NO outcome
  RESOLVED_NO_MARKET: {
    id: 'test-market-4-resolved-no',
    title: 'Will gas prices double?',
    description: 'Test market for payout claim scenarios (NO outcome)',
    category: 'ECONOMY',
    endTime: new Date('2024-11-30T23:59:59Z'),
    totalPool: 3000,
    yesPool: 1500,
    noPool: 1500,
    status: 'RESOLVED',
    outcome: 'NO',
    creator: '22222222222222222222222222222222',
  },

  // Disputed market
  DISPUTED_MARKET: {
    id: 'test-market-5-disputed',
    title: 'Was the election result valid?',
    description: 'Test market for dispute resolution scenarios',
    category: 'POLITICS',
    endTime: new Date('2024-12-01T00:00:00Z'),
    totalPool: 10000,
    yesPool: 6000,
    noPool: 4000,
    status: 'DISPUTED',
    disputeReason: 'Evidence contradicts initial resolution',
    creator: '11111111111111111111111111111111',
  },
};

/**
 * Test proposal configurations for different stages
 */
export const TEST_PROPOSALS = {
  // Pending proposal in voting period
  PENDING_PROPOSAL: {
    id: 'test-proposal-1-pending',
    title: 'Will AI replace 50% of jobs by 2030?',
    description: 'Test proposal for voting scenarios',
    category: 'TECHNOLOGY',
    endDate: new Date('2030-12-31T23:59:59Z'),
    bondAmount: 10,
    creator: '11111111111111111111111111111111',
    status: 'PENDING',
    votesFor: 5,
    votesAgainst: 2,
    votingEndTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },

  // Approved proposal that became a market
  APPROVED_PROPOSAL: {
    id: 'test-proposal-2-approved',
    title: 'Will Mars colony exist by 2050?',
    description: 'Test proposal for approved state',
    category: 'SPACE',
    endDate: new Date('2050-12-31T23:59:59Z'),
    bondAmount: 10,
    creator: '22222222222222222222222222222222',
    status: 'APPROVED',
    votesFor: 15,
    votesAgainst: 3,
    marketId: 'test-market-from-proposal-2',
  },

  // Rejected proposal
  REJECTED_PROPOSAL: {
    id: 'test-proposal-3-rejected',
    title: 'Will pigs fly?',
    description: 'Test proposal for rejected state',
    category: 'FANTASY',
    endDate: new Date('2099-12-31T23:59:59Z'),
    bondAmount: 10,
    creator: '11111111111111111111111111111111',
    status: 'REJECTED',
    votesFor: 2,
    votesAgainst: 20,
  },
};

/**
 * Test bet configurations
 */
export const TEST_BETS = {
  // Active bet on YES side
  ACTIVE_YES_BET: {
    id: 'test-bet-1-active-yes',
    marketId: TEST_MARKETS.ACTIVE_MARKET.id,
    userId: '11111111111111111111111111111111',
    side: 'YES',
    amount: 10,
    timestamp: new Date(),
    status: 'ACTIVE',
  },

  // Active bet on NO side
  ACTIVE_NO_BET: {
    id: 'test-bet-2-active-no',
    marketId: TEST_MARKETS.ACTIVE_MARKET.id,
    userId: '22222222222222222222222222222222',
    side: 'NO',
    amount: 5,
    timestamp: new Date(),
    status: 'ACTIVE',
  },

  // Winning bet (claimable)
  WINNING_BET: {
    id: 'test-bet-3-winning',
    marketId: TEST_MARKETS.RESOLVED_YES_MARKET.id,
    userId: '11111111111111111111111111111111',
    side: 'YES',
    amount: 20,
    timestamp: new Date('2024-12-25T00:00:00Z'),
    status: 'CLAIMABLE',
    payout: 33.33, // Based on pool ratio
  },

  // Losing bet
  LOSING_BET: {
    id: 'test-bet-4-losing',
    marketId: TEST_MARKETS.RESOLVED_YES_MARKET.id,
    userId: '22222222222222222222222222222222',
    side: 'NO',
    amount: 10,
    timestamp: new Date('2024-12-26T00:00:00Z'),
    status: 'LOST',
  },

  // Claimed bet
  CLAIMED_BET: {
    id: 'test-bet-5-claimed',
    marketId: TEST_MARKETS.RESOLVED_NO_MARKET.id,
    userId: '22222222222222222222222222222222',
    side: 'NO',
    amount: 15,
    timestamp: new Date('2024-11-20T00:00:00Z'),
    status: 'CLAIMED',
    payout: 30,
    claimedAt: new Date('2025-01-05T00:00:00Z'),
  },
};

/**
 * Test user profiles
 */
export const TEST_USERS = {
  USER1: {
    publicKey: '11111111111111111111111111111111',
    username: 'TestUser1',
    activeBets: 2,
    totalBets: 5,
    winRate: 60,
    activityScore: 150,
    rank: 5,
  },

  USER2: {
    publicKey: '22222222222222222222222222222222',
    username: 'TestUser2',
    activeBets: 1,
    totalBets: 3,
    winRate: 33,
    activityScore: 80,
    rank: 12,
  },

  ADMIN: {
    publicKey: 'AdminAdminAdminAdminAdminAdminAd',
    username: 'AdminUser',
    role: 'ADMIN',
    activeBets: 0,
    totalBets: 0,
    winRate: 0,
    activityScore: 0,
    rank: 999,
  },
};

/**
 * Test comments for discussion features
 */
export const TEST_COMMENTS = {
  COMMENT1: {
    id: 'test-comment-1',
    marketId: TEST_MARKETS.ACTIVE_MARKET.id,
    userId: '11111111111111111111111111111111',
    content: 'I think YES is more likely based on recent trends',
    upvotes: 5,
    timestamp: new Date('2025-01-15T10:00:00Z'),
  },

  COMMENT2: {
    id: 'test-comment-2',
    marketId: TEST_MARKETS.ACTIVE_MARKET.id,
    userId: '22222222222222222222222222222222',
    content: 'Strong disagreement here, NO side has better evidence',
    upvotes: 3,
    timestamp: new Date('2025-01-15T11:00:00Z'),
  },
};

/**
 * Helper function to create a test market with custom properties
 */
export function createTestMarket(overrides: Partial<typeof TEST_MARKETS.ACTIVE_MARKET> = {}) {
  return {
    ...TEST_MARKETS.ACTIVE_MARKET,
    ...overrides,
    id: overrides.id || `test-market-${Date.now()}`,
  };
}

/**
 * Helper function to create a test proposal with custom properties
 */
export function createTestProposal(overrides: Partial<typeof TEST_PROPOSALS.PENDING_PROPOSAL> = {}) {
  return {
    ...TEST_PROPOSALS.PENDING_PROPOSAL,
    ...overrides,
    id: overrides.id || `test-proposal-${Date.now()}`,
  };
}

/**
 * Helper function to create a test bet with custom properties
 */
export function createTestBet(overrides: Partial<typeof TEST_BETS.ACTIVE_YES_BET> = {}) {
  return {
    ...TEST_BETS.ACTIVE_YES_BET,
    ...overrides,
    id: overrides.id || `test-bet-${Date.now()}`,
  };
}

/**
 * Database seeding helpers for E2E tests
 * (To be implemented when backend test utilities are available)
 */
export async function seedTestData() {
  // TODO: Implement database seeding via Supabase test client
  // This would insert TEST_MARKETS, TEST_PROPOSALS, TEST_BETS into test database
  console.log('TODO: Seed test data to database');
}

export async function clearTestData() {
  // TODO: Implement database cleanup
  // This would remove all test data after test runs
  console.log('TODO: Clear test data from database');
}

/**
 * Wait helpers for blockchain and real-time updates
 */
export async function waitForBlockchainConfirmation(timeoutMs: number = 5000) {
  // Simulate blockchain confirmation delay
  await new Promise((resolve) => setTimeout(resolve, timeoutMs));
}

export async function waitForRealtimeUpdate(timeoutMs: number = 2000) {
  // Simulate Supabase real-time subscription delay
  await new Promise((resolve) => setTimeout(resolve, timeoutMs));
}
