#!/usr/bin/env ts-node
/**
 * BMAD-Zmart Proposal Syncer
 *
 * Syncs proposals and proposal votes from Solana ProposalSystem program to Supabase
 * Run this continuously alongside sync-transactions.ts
 *
 * Usage:
 *   npx ts-node scripts/sync-proposals.ts
 */

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet as AnchorWallet } from '@coral-xyz/anchor';
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

// Load ProposalSystem IDL
const proposalSystemIdl = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../frontend/lib/solana/idl/proposal_system.json'), 'utf-8')
);

// =============================================================================
// Configuration
// =============================================================================

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const PROPOSAL_SYSTEM_PROGRAM_ID = new PublicKey(proposalSystemIdl.address);

const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Dummy wallet for read-only operations
const dummyWallet = new NodeWallet(Keypair.generate());
const provider = new AnchorProvider(connection, dummyWallet, { commitment: 'confirmed' });

// Initialize ProposalSystem program
const proposalSystemProgram = new Program(proposalSystemIdl, provider) as any;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Map on-chain ProposalStatus enum to database status string
 */
function getProposalStatus(status: any): string {
  if (status.pending) return 'PENDING';
  if (status.approved) return 'APPROVED';
  if (status.rejected) return 'REJECTED';
  return 'PENDING';
}

/**
 * Map on-chain BondTier enum to database tier string
 */
function getBondTier(bondTier: any): string {
  if (bondTier.tier1) return 'TIER1';
  if (bondTier.tier2) return 'TIER2';
  if (bondTier.tier3) return 'TIER3';
  return 'TIER1';
}

/**
 * Map on-chain VoteChoice enum to database choice string
 */
function getVoteChoice(voteChoice: any): string {
  if (voteChoice.yes) return 'YES';
  if (voteChoice.no) return 'NO';
  return 'YES';
}

// =============================================================================
// Sync Functions
// =============================================================================

/**
 * Sync all proposals from blockchain to database
 */
async function syncProposals() {
  console.log('📋 Syncing proposals from Solana...');

  try {
    // Fetch all Proposal accounts
    const proposals = await proposalSystemProgram.account.proposal.all();
    console.log(`   Found ${proposals.length} proposals on-chain`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const proposal of proposals) {
      const data = proposal.account as any;
      const proposalPDA = proposal.publicKey.toString();

      try {
        // Upsert to database
        const { error } = await supabase.from('proposals').upsert({
          proposal_id: data.proposalId.toString(),
          creator_wallet: data.creator.toString(),
          title: data.title,
          description: data.description,
          bond_amount: data.bondAmount.toNumber(),
          bond_tier: getBondTier(data.bondTier),
          proposal_tax: data.proposalTax.toNumber(),
          status: getProposalStatus(data.status),
          yes_votes: data.yesVotes,
          no_votes: data.noVotes,
          total_voters: data.totalVoters,
          created_at: new Date(data.createdAt.toNumber() * 1000).toISOString(),
          end_date: new Date(data.endDate.toNumber() * 1000).toISOString(),
          processed_at: data.processedAt
            ? new Date(data.processedAt.toNumber() * 1000).toISOString()
            : null,
          market_id: data.marketId ? data.marketId.toString() : null,
          on_chain_address: proposalPDA,
        }, {
          onConflict: 'proposal_id'
        });

        if (error) {
          console.error(`   ❌ Failed to sync proposal ${data.proposalId}:`, error.message);
          errorCount++;
        } else {
          console.log(`   ✅ Synced proposal ${data.proposalId}: "${data.title}"`);
          syncedCount++;
        }
      } catch (error: any) {
        console.error(`   ❌ Error processing proposal ${data.proposalId}:`, error.message);
        errorCount++;
      }
    }

    console.log(`   📊 Sync complete: ${syncedCount} synced, ${errorCount} errors`);

  } catch (error: any) {
    console.error('   ❌ Proposal sync error:', error.message);
  }
}

/**
 * Sync all proposal votes from blockchain to database
 */
async function syncProposalVotes() {
  console.log('🗳️  Syncing proposal votes from Solana...');

  try {
    // Fetch all ProposalVoteRecord accounts
    const voteRecords = await proposalSystemProgram.account.proposalVoteRecord.all();
    console.log(`   Found ${voteRecords.length} vote records on-chain`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const voteRecord of voteRecords) {
      const data = voteRecord.account as any;
      const voteRecordPDA = voteRecord.publicKey.toString();

      try {
        // Upsert to database
        const { error } = await supabase.from('proposal_votes').upsert({
          proposal_id: data.proposalId.toString(),
          voter_wallet: data.voter.toString(),
          vote_choice: getVoteChoice(data.voteChoice),
          timestamp: new Date(data.timestamp.toNumber() * 1000).toISOString(),
          on_chain_address: voteRecordPDA,
          // transaction_signature: null // Not stored on-chain
        }, {
          onConflict: 'proposal_id,voter_wallet' // Unique constraint
        });

        if (error) {
          console.error(`   ❌ Failed to sync vote for proposal ${data.proposalId}:`, error.message);
          errorCount++;
        } else {
          syncedCount++;
        }
      } catch (error: any) {
        console.error(`   ❌ Error processing vote record:`, error.message);
        errorCount++;
      }
    }

    console.log(`   📊 Sync complete: ${syncedCount} votes synced, ${errorCount} errors`);

  } catch (error: any) {
    console.error('   ❌ Vote sync error:', error.message);
  }
}

/**
 * Get the next available proposal ID
 * Queries the database for the highest proposal_id and returns next
 */
export async function getNextProposalId(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('proposals')
      .select('proposal_id')
      .order('proposal_id', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching last proposal ID:', error);
      return 1; // Start from 1 if error
    }

    if (!data || data.length === 0) {
      return 1; // First proposal
    }

    const lastId = parseInt(data[0].proposal_id);
    return lastId + 1;
  } catch (error) {
    console.error('Error in getNextProposalId:', error);
    return Date.now(); // Fallback to timestamp
  }
}

// =============================================================================
// Main Sync Loop
// =============================================================================

async function runSyncOnce() {
  console.log('\n🔄 Starting proposal sync cycle...\n');

  await syncProposals();
  console.log('');
  await syncProposalVotes();

  console.log('\n✅ Sync cycle complete\n');
}

async function runSyncLoop(intervalMs: number = 30000) {
  console.log('🚀 BMAD-Zmart Proposal Syncer Started');
  console.log(`📡 Solana RPC: ${SOLANA_RPC_URL}`);
  console.log(`💾 Supabase: ${SUPABASE_URL}`);
  console.log(`⏱️  Sync interval: ${intervalMs / 1000}s\n`);

  // Run immediately
  await runSyncOnce();

  // Then run on interval
  setInterval(async () => {
    await runSyncOnce();
  }, intervalMs);
}

// =============================================================================
// Entry Point
// =============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--once')) {
    // Run once and exit
    runSyncOnce().then(() => {
      console.log('Exiting...');
      process.exit(0);
    }).catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
  } else {
    // Run continuous loop
    const interval = args.includes('--interval')
      ? parseInt(args[args.indexOf('--interval') + 1]) * 1000
      : 30000;

    runSyncLoop(interval).catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
  }
}
