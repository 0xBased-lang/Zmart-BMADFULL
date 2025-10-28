/**
 * Test Data Seeding Script
 * Story 4.3 - Frontend E2E Tests with Playwright
 *
 * Seeds Supabase database with consistent test data for E2E testing.
 * Run this before executing E2E tests to ensure deterministic test data.
 *
 * Usage:
 *   npx tsx scripts/seed-test-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import { TEST_MARKETS, TEST_PROPOSALS, TEST_BETS, TEST_USERS, TEST_COMMENTS } from '../e2e/fixtures/test-data';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_TEST_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_TEST_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Clear existing test data
 */
async function clearTestData() {
  console.log('🧹 Clearing existing test data...');

  try {
    // Delete in reverse order of dependencies
    await supabase.from('comments').delete().like('id', 'test-%');
    await supabase.from('bets').delete().like('id', 'test-%');
    await supabase.from('proposals').delete().like('id', 'test-%');
    await supabase.from('markets').delete().like('id', 'test-%');
    await supabase.from('users').delete().like('public_key', 'test-%');

    console.log('✅ Test data cleared');
  } catch (error) {
    console.error('⚠️  Error clearing test data:', error);
    // Continue anyway - tables might not exist yet
  }
}

/**
 * Seed test users
 */
async function seedUsers() {
  console.log('👥 Seeding test users...');

  const users = [
    {
      public_key: TEST_USERS.USER1.publicKey,
      username: TEST_USERS.USER1.username,
      activity_score: TEST_USERS.USER1.activityScore,
      created_at: new Date().toISOString(),
    },
    {
      public_key: TEST_USERS.USER2.publicKey,
      username: TEST_USERS.USER2.username,
      activity_score: TEST_USERS.USER2.activityScore,
      created_at: new Date().toISOString(),
    },
    {
      public_key: TEST_USERS.ADMIN.publicKey,
      username: TEST_USERS.ADMIN.username,
      activity_score: TEST_USERS.ADMIN.activityScore,
      created_at: new Date().toISOString(),
    },
  ];

  const { error } = await supabase.from('users').upsert(users);

  if (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }

  console.log(`✅ Seeded ${users.length} test users`);
}

/**
 * Seed test markets
 */
async function seedMarkets() {
  console.log('📊 Seeding test markets...');

  const markets = Object.values(TEST_MARKETS).map((market) => ({
    id: market.id,
    title: market.title,
    description: market.description,
    category: market.category,
    end_time: market.endTime.toISOString(),
    total_pool: market.totalPool,
    yes_pool: market.yesPool,
    no_pool: market.noPool,
    status: market.status,
    creator: market.creator,
    outcome: (market as any).outcome || null,
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('markets').upsert(markets);

  if (error) {
    console.error('❌ Error seeding markets:', error);
    throw error;
  }

  console.log(`✅ Seeded ${markets.length} test markets`);
}

/**
 * Seed test proposals
 */
async function seedProposals() {
  console.log('📝 Seeding test proposals...');

  const proposals = Object.values(TEST_PROPOSALS).map((proposal) => ({
    id: proposal.id,
    title: proposal.title,
    description: proposal.description,
    category: proposal.category,
    end_date: proposal.endDate.toISOString(),
    bond_amount: proposal.bondAmount,
    creator: proposal.creator,
    status: proposal.status,
    votes_for: proposal.votesFor,
    votes_against: proposal.votesAgainst,
    voting_end_time: (proposal as any).votingEndTime?.toISOString() || null,
    market_id: (proposal as any).marketId || null,
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('proposals').upsert(proposals);

  if (error) {
    console.error('❌ Error seeding proposals:', error);
    throw error;
  }

  console.log(`✅ Seeded ${proposals.length} test proposals`);
}

/**
 * Seed test bets
 */
async function seedBets() {
  console.log('🎲 Seeding test bets...');

  const bets = Object.values(TEST_BETS).map((bet) => ({
    id: bet.id,
    market_id: bet.marketId,
    user_id: bet.userId,
    side: bet.side,
    amount: bet.amount,
    status: bet.status,
    payout: (bet as any).payout || null,
    claimed_at: (bet as any).claimedAt?.toISOString() || null,
    created_at: bet.timestamp.toISOString(),
  }));

  const { error } = await supabase.from('bets').upsert(bets);

  if (error) {
    console.error('❌ Error seeding bets:', error);
    throw error;
  }

  console.log(`✅ Seeded ${bets.length} test bets`);
}

/**
 * Seed test comments
 */
async function seedComments() {
  console.log('💬 Seeding test comments...');

  const comments = Object.values(TEST_COMMENTS).map((comment) => ({
    id: comment.id,
    market_id: comment.marketId,
    user_id: comment.userId,
    content: comment.content,
    upvotes: comment.upvotes,
    created_at: comment.timestamp.toISOString(),
  }));

  const { error } = await supabase.from('comments').upsert(comments);

  if (error) {
    console.error('❌ Error seeding comments:', error);
    throw error;
  }

  console.log(`✅ Seeded ${comments.length} test comments`);
}

/**
 * Main seeding function
 */
async function seedTestData() {
  console.log('🌱 Starting test data seeding...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  try {
    // Clear existing test data
    await clearTestData();
    console.log('');

    // Seed data in order of dependencies
    await seedUsers();
    await seedMarkets();
    await seedProposals();
    await seedBets();
    await seedComments();

    console.log('');
    console.log('✅ Test data seeding complete!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - ${Object.keys(TEST_USERS).length} users`);
    console.log(`   - ${Object.keys(TEST_MARKETS).length} markets`);
    console.log(`   - ${Object.keys(TEST_PROPOSALS).length} proposals`);
    console.log(`   - ${Object.keys(TEST_BETS).length} bets`);
    console.log(`   - ${Object.keys(TEST_COMMENTS).length} comments`);
    console.log('');
    console.log('🧪 Ready to run E2E tests!');
  } catch (error) {
    console.error('');
    console.error('❌ Test data seeding failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  seedTestData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedTestData, clearTestData };
