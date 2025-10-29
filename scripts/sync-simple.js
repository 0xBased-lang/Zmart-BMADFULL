#!/usr/bin/env node
/**
 * Simple transaction syncer (JavaScript - no TypeScript issues!)
 */

const { Connection, PublicKey } = require('@solana/web3.js');
const { Program, AnchorProvider, BN } = require('@coral-xyz/anchor');
const { createClient } = require('@supabase/supabase-js');
const { Keypair } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

// Simple wallet
class NodeWallet {
  constructor(payer) {
    this.payer = payer;
  }
  async signTransaction(tx) { return tx; }
  async signAllTransactions(txs) { return txs; }
  get publicKey() { return this.payer.publicKey; }
}

// Config
const SOLANA_RPC_URL = 'https://api.devnet.solana.com';
const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const CORE_MARKETS_ID = '6BBZWsJZq23k2NX3YnENgXTEPhbVEHXYmPxmamN83eEV';

// Load IDL
const idlPath = path.join(__dirname, '../frontend/lib/solana/idl/core_markets.json');
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));

// Initialize
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const wallet = new NodeWallet(Keypair.generate());
const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
const program = new Program(idl, provider);

async function syncMarkets() {
  console.log('\n📊 Syncing markets...');

  try {
    const markets = await program.account.market.all();
    console.log(`   Found ${markets.length} markets on devnet`);

    for (const market of markets) {
      const data = market.account;
      const marketId = data.marketId.toNumber();
      const creatorWallet = data.creator.toString();

      // First ensure user exists
      await supabase.from('users').upsert({
        wallet_address: creatorWallet,
        created_at: new Date().toISOString()
      }, { onConflict: 'wallet_address', ignoreDuplicates: true });

      // Check if market exists
      const { data: existing } = await supabase
        .from('markets')
        .select('id')
        .eq('market_id', marketId)
        .single();

      let error;
      if (existing) {
        // Update existing market
        const result = await supabase
          .from('markets')
          .update({
            yes_pool: data.yesPool.toNumber(),
            no_pool: data.noPool.toNumber(),
            total_volume: data.totalVolume.toNumber(),
            status: data.status.active ? 'active' : (data.status.resolved ? 'resolved' : 'cancelled'),
            winning_outcome: data.resolvedOutcome ? (data.resolvedOutcome.yes ? 'YES' : 'NO') : null
          })
          .eq('market_id', marketId);
        error = result.error;
      } else {
        // Insert new market
        const result = await supabase
          .from('markets')
          .insert({
            market_id: marketId,
            creator_wallet: creatorWallet,
            question: data.title,
            end_date: new Date(data.endDate.toNumber() * 1000).toISOString(),
            status: data.status.active ? 'active' : (data.status.resolved ? 'resolved' : 'cancelled'),
            yes_pool: data.yesPool.toNumber(),
            no_pool: data.noPool.toNumber(),
            total_volume: data.totalVolume.toNumber(),
            winning_outcome: data.resolvedOutcome ? (data.resolvedOutcome.yes ? 'YES' : 'NO') : null,
            created_at: new Date(data.createdAt.toNumber() * 1000).toISOString()
          });
        error = result.error;
      }

      if (error) {
        console.log(`   ❌ Market ${marketId}: ${error.message}`);
      } else {
        console.log(`   ✅ Market ${marketId}: "${data.title}"`);
      }
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
}

async function syncBets(marketId) {
  console.log(`\n💰 Syncing bets for market #${marketId}...`);

  try {
    // Get all UserBet accounts
    const bets = await program.account.userBet.all();
    console.log(`   Found ${bets.length} total bets on-chain`);

    let count = 0;
    for (const bet of bets) {
      try {
        const data = bet.account;
        if (!data || !data.marketId) continue;
        if (data.marketId.toNumber() !== marketId) continue;

        count++;
        // UserBet account structure: bettor field (not user)
        const userWallet = (data.bettor || data.user)?.toString() || 'unknown';

        // Ensure user exists first
        await supabase.from('users').upsert({
          wallet_address: userWallet,
          created_at: new Date().toISOString()
        }, { onConflict: 'wallet_address', ignoreDuplicates: true });

        // Get the DB market ID (not the on-chain market_id)
        const { data: marketData } = await supabase
          .from('markets')
          .select('id')
          .eq('market_id', marketId)
          .single();

        if (!marketData) {
          console.log(`   ⚠️ Market ${marketId} not found in DB, skipping bet`);
          continue;
        }

        const { error } = await supabase.from('bets').insert({
          user_wallet: userWallet,
          market_id: marketData.id, // Use DB ID not chain market_id
          outcome: data.betSide?.yes ? 'YES' : 'NO',
          amount: data.amount?.toNumber() || 0,
          shares: data.amountToPool?.toNumber() || 0,
          profit_loss: null,
          claimed: data.claimed || false,
          created_at: new Date(data.createdAt?.toNumber() * 1000 || Date.now()).toISOString()
        });

        if (error && !error.message.includes('duplicate key')) {
          console.log(`   ❌ Bet sync failed: ${error.message}`);
        } else if (!error) {
          const shortWallet = `${userWallet.slice(0, 4)}...${userWallet.slice(-4)}`;
          const side = data.betSide?.yes ? 'YES' : 'NO';
          const amount = (data.amount.toNumber() / 1e9).toFixed(4);
          console.log(`   ✅ ${shortWallet} → ${side} ${amount} SOL`);
        }
      } catch (err) {
        console.log(`   ⚠️ Skipping invalid bet: ${err.message}`);
      }
    }

    console.log(`   📊 Synced ${count} bets for market #${marketId}`);
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
}

async function main() {
  console.log('\n🚀 BMAD-Zmart Simple Syncer');
  console.log(`   RPC: ${SOLANA_RPC_URL}`);
  console.log(`   Program: ${CORE_MARKETS_ID}`);
  console.log('='.repeat(60));

  await syncMarkets();
  await syncBets(1); // Market #1
  await syncBets(2); // Market #2

  console.log('\n' + '='.repeat(60));
  console.log('✅ Sync complete!\n');

  // Watch mode - continuous sync
  if (process.argv.includes('--watch')) {
    console.log('👀 Watch mode enabled - syncing every 30 seconds');
    console.log('   Press Ctrl+C to stop\n');

    setInterval(async () => {
      const now = new Date().toLocaleTimeString();
      console.log(`[${now}] Running sync...`);
      await syncMarkets();
      await syncBets(1);
      await syncBets(2);
    }, 30000); // 30 seconds
  }
}

main().catch(console.error);
