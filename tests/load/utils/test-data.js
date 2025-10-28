/**
 * Test Data Generators for Load Tests
 *
 * Provides functions to generate realistic test data for markets,
 * bets, votes, and other entities used in load testing.
 */

import { randomInt, randomElement } from '../k6-config.js';

// Market data generators
export function generateMarketTitle() {
  const topics = [
    'BTC reach $100k',
    'ETH flip BTC marketcap',
    'SOL reach $500',
    'NFT sales exceed $1B',
    'DAO adoption by Fortune 500',
    'DeFi TVL reach $500B',
    'Web3 users exceed 1B',
    'Crypto regulation passes',
  ];

  const timeframes = [
    'by end of 2025',
    'in Q1 2026',
    'before 2027',
    'this year',
    'next quarter',
  ];

  return `Will ${randomElement(topics)} ${randomElement(timeframes)}?`;
}

export function generateMarketDescription(title) {
  return `Market resolves based on verified data sources. ${title} Resolution criteria: confirmed by at least 2 major sources.`;
}

export function generateMarket() {
  const title = generateMarketTitle();
  return {
    market_id: `market-${Date.now()}-${randomInt(1000, 9999)}`,
    title,
    description: generateMarketDescription(title),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    yes_pool: randomInt(1000, 100000),
    no_pool: randomInt(1000, 100000),
    status: 'active',
    created_at: new Date().toISOString(),
  };
}

// Bet data generators
export function generateBet(marketId) {
  const amount = randomInt(1, 1000) * 1000000; // 1-1000 USDC in lamports
  const side = Math.random() > 0.5;

  return {
    market_id: marketId,
    bettor: generateWalletAddress(),
    amount,
    side,
    created_at: new Date().toISOString(),
  };
}

export function generateBetBatch(marketId, count = 10) {
  return Array.from({ length: count }, () => generateBet(marketId));
}

// Vote data generators
export function generateVote(proposalId) {
  return {
    proposal_id: proposalId,
    voter: generateWalletAddress(),
    vote: Math.random() > 0.5,
    weight: randomInt(1, 100),
    created_at: new Date().toISOString(),
  };
}

export function generateVoteBatch(proposalId, count = 100) {
  return Array.from({ length: count }, () => generateVote(proposalId));
}

// Proposal data generators
export function generateProposal() {
  return {
    proposal_id: `proposal-${Date.now()}-${randomInt(1000, 9999)}`,
    title: generateMarketTitle(),
    description: 'Detailed proposal description with resolution criteria.',
    creator: generateWalletAddress(),
    bond_amount: randomInt(10, 100) * 1000000,
    status: 'active',
    created_at: new Date().toISOString(),
  };
}

// User/Wallet generators
export function generateWalletAddress() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let address = '';
  for (let i = 0; i < 44; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
}

export function generateUser() {
  return {
    wallet_address: generateWalletAddress(),
    total_volume: randomInt(1000, 1000000),
    markets_created: randomInt(0, 50),
    bets_placed: randomInt(0, 500),
    win_rate: Math.random(),
    created_at: new Date().toISOString(),
  };
}

// Event data generators
export function generateSolanaEvent(type = 'bet_placed') {
  return {
    signature: generateTransactionSignature(),
    type,
    slot: randomInt(100000000, 200000000),
    timestamp: Date.now(),
    data: {
      market_id: `market-${randomInt(1, 1000)}`,
      amount: randomInt(1, 1000) * 1000000,
    },
  };
}

export function generateTransactionSignature() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let sig = '';
  for (let i = 0; i < 88; i++) {
    sig += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return sig;
}

export function generateEventBatch(count = 100, type = 'bet_placed') {
  return Array.from({ length: count }, () => generateSolanaEvent(type));
}

// WebSocket message generators
export function generateWebSocketMessage(type = 'market_update') {
  return {
    type,
    payload: {
      market_id: `market-${randomInt(1, 1000)}`,
      yes_pool: randomInt(1000, 100000),
      no_pool: randomInt(1000, 100000),
      timestamp: Date.now(),
    },
  };
}

// Query parameter generators
export function generateQueryParams() {
  return {
    limit: randomElement([10, 20, 50, 100]),
    offset: randomInt(0, 1000),
    status: randomElement(['active', 'resolved', 'disputed']),
    sort: randomElement(['created_at', 'end_date', 'total_volume']),
    order: randomElement(['asc', 'desc']),
  };
}

// Batch operations
export function generateMarketBatch(count = 10) {
  return Array.from({ length: count }, () => generateMarket());
}

export function generateProposalBatch(count = 10) {
  return Array.from({ length: count }, () => generateProposal());
}

export function generateUserBatch(count = 10) {
  return Array.from({ length: count }, () => generateUser());
}

// Export all generators
export default {
  generateMarketTitle,
  generateMarketDescription,
  generateMarket,
  generateMarketBatch,
  generateBet,
  generateBetBatch,
  generateVote,
  generateVoteBatch,
  generateProposal,
  generateProposalBatch,
  generateWalletAddress,
  generateUser,
  generateUserBatch,
  generateSolanaEvent,
  generateEventBatch,
  generateTransactionSignature,
  generateWebSocketMessage,
  generateQueryParams,
};
