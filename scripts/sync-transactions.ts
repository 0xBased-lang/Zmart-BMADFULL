#!/usr/bin/env ts-node
/**
 * BMAD-Zmart Transaction Syncer
 *
 * Polls Solana devnet for transactions and syncs to Supabase
 * Run this continuously to keep database in sync with blockchain
 *
 * Usage:
 *   npx ts-node scripts/sync-transactions.ts
 */

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Wallet as AnchorWallet } from '@coral-xyz/anchor';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Simple wallet wrapper for read-only operations
class NodeWallet implements AnchorWallet {
  constructor(readonly payer: Keypair) {}
  async signTransaction(tx: any) { return tx; }
  async signAllTransactions(txs: any[]) { return txs; }
  get publicKey() { return this.payer.publicKey; }
}

// Load IDLs
const coreMarketsIdl = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../frontend/lib/solana/idl/core_markets.json'), 'utf-8')
);

// =============================================================================
// Configuration
// =============================================================================

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const CORE_MARKETS_PROGRAM_ID = new PublicKey('6BBZWsJZq23k2NX3YnENgXTEPhbVEHXYmPxmamN83eEV');

const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Dummy wallet for read-only operations
const dummyWallet = new NodeWallet(Keypair.generate());
const provider = new AnchorProvider(connection, dummyWallet, { commitment: 'confirmed' });

// Initialize Core Markets program
const coreMarketsProgram = new Program(coreMarketsIdl as any, provider);

// =============================================================================
// Sync Functions
// =============================================================================

/**
 * Sync all markets from blockchain to database
 */
async function syncMarkets() {
  console.log('📊 Syncing markets from Solana...');

  try {
    // Fetch all Market accounts
    const markets = await coreMarketsProgram.account.market.all();
    console.log(`   Found ${markets.length} markets on-chain`);

    for (const market of markets) {
      const data = market.account as any;

      // Upsert to database
      const { error } = await supabase.from('markets').upsert({
        market_id: data.marketId.toString(),
        creator_wallet: data.creator.toString(),
        question: data.title,
        description: data.description,
        category: 'crypto', // TODO: Add category to on-chain data
        end_date: new Date(data.endDate.toNumber() * 1000).toISOString(),
        status: getMarketStatus(data.status),
        yes_pool: data.yesPool.toNumber(),
        no_pool: data.noPool.toNumber(),
        total_volume: data.totalVolume.toNumber(),
        total_bets: data.totalBets,
        resolved_outcome: data.resolvedOutcome ? (data.resolvedOutcome.yes ? 'YES' : 'NO') : null,
        created_at: new Date(data.createdAt.toNumber() * 1000).toISOString()
      }, {
        onConflict: 'market_id'
      });

      if (error) {
        console.error(`   ❌ Failed to sync market ${data.marketId}:`, error.message);
      } else {
        console.log(`   ✅ Synced market ${data.marketId}: "${data.title}"`);
      }
    }

  } catch (error: any) {
    console.error('   ❌ Market sync error:', error.message);
  }
}

/**
 * Sync all bets for a specific market
 */
async function syncBetsForMarket(marketId: number) {
  console.log(`💰 Syncing bets for market #${marketId}...`);

  try {
    // Get all UserBet accounts for this market
    const bets = await coreMarketsProgram.account.userBet.all([
      {
        memcmp: {
          offset: 8, // Skip discriminator
          bytes: new BN(marketId).toArrayLike(Buffer, 'le', 8).toString('base64')
        }
      }
    ]);

    console.log(`   Found ${bets.length} bets for market #${marketId}`);

    for (const bet of bets) {
      const data = bet.account as any;

      const { error } = await supabase.from('bets').upsert({
        user_wallet: data.user.toString(),
        market_id: data.marketId.toString(),
        outcome: data.betSide.yes ? 'YES' : 'NO',
        amount: data.amount.toNumber(),
        shares: data.amountToPool.toNumber(), // Shares = amount going to pool
        profit_loss: null, // Calculate after resolution
        claimed: data.claimed,
        created_at: new Date(data.createdAt.toNumber() * 1000).toISOString()
      }, {
        onConflict: 'user_wallet,market_id' // Assuming composite unique
      });

      if (error) {
        console.error(`   ❌ Failed to sync bet:`, error.message);
      } else {
        console.log(`   ✅ Synced bet: ${data.user.toString().slice(0, 8)}... → ${data.betSide.yes ? 'YES' : 'NO'} ${data.amount.toNumber() / 1e9} SOL`);
      }
    }

  } catch (error: any) {
    console.error(`   ❌ Bet sync error for market #${marketId}:`, error.message);
  }
}

/**
 * Sync proposals (placeholder - implement when needed)
 */
async function syncProposals() {
  console.log('📝 Syncing proposals (skipped for now)...');
  // TODO: Implement when proposal-system IDL is available
}

/**
 * Full sync - all data from blockchain
 */
async function fullSync() {
  console.log('\n🚀 Starting full blockchain → database sync\n');
  console.log('='.repeat(60));

  const startTime = Date.now();

  // Sync markets
  await syncMarkets();

  // Sync bets for each market (only markets 1-10 for now)
  console.log('\n');
  for (let marketId = 1; marketId <= 10; marketId++) {
    await syncBetsForMarket(marketId);
  }

  // Sync proposals
  console.log('\n');
  await syncProposals();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Full sync complete in ${elapsed}s\n`);
}

// =============================================================================
// Helper Functions
// =============================================================================

function getMarketStatus(status: any): string {
  if (status.active) return 'active';
  if (status.resolved) return 'resolved';
  if (status.cancelled) return 'cancelled';
  if (status.locked) return 'locked';
  return 'active';
}

function getProposalStatus(status: any): string {
  if (status.pending) return 'PENDING';
  if (status.voting) return 'VOTING';
  if (status.voteComplete) return 'VOTE_COMPLETE';
  if (status.approved) return 'APPROVED';
  if (status.rejected) return 'REJECTED';
  return 'PENDING';
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('📡 BMAD-Zmart Transaction Syncer');
  console.log(`   RPC: ${SOLANA_RPC_URL}`);
  console.log(`   Supabase: ${SUPABASE_URL}`);
  console.log(`   Core Markets: ${CORE_MARKETS_PROGRAM_ID.toBase58()}`);
  console.log(`   Proposals: ${PROPOSAL_SYSTEM_PROGRAM_ID.toBase58()}\n`);

  // Run full sync
  await fullSync();

  // If --watch flag, poll every 10 seconds
  if (process.argv.includes('--watch')) {
    console.log('👀 Watch mode enabled - polling every 10 seconds');
    console.log('   Press Ctrl+C to stop\n');

    setInterval(async () => {
      console.log(`\n[${new Date().toISOString()}] Running sync...`);
      await fullSync();
    }, 10000); // 10 seconds

  } else {
    console.log('💡 Tip: Run with --watch flag to poll continuously');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
