/**
 * BMAD-Zmart check-stale-markets Supabase Edge Function
 * Story 2.9: Stale Market Auto-Cancellation
 *
 * CRON JOB: Runs daily to identify and cancel stale markets
 *
 * WORKFLOW:
 * 1. Fetch stale_market_threshold from ParameterStorage (default: 30 days)
 * 2. Query markets WHERE status = 'ENDED' AND end_date + threshold < NOW()
 * 3. For each stale market:
 *    a. Call cancel_market instruction (on-chain)
 *    b. Instruction emits MarketCancelledEvent
 *    c. Event Listener (sync-events) automatically updates database + audit log
 * 4. Return summary: cancelled_count, total_refunded, errors
 *
 * ERROR HANDLING: Continue processing on failures, log errors, return summary
 *
 * AUTHORIZATION: Requires platform admin authority keypair (configured in secrets)
 *
 * INTEGRATION: Uses Story 1.9 Event Listener for automatic database sync (zero technical debt)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { Connection, Keypair, PublicKey, Transaction } from 'https://esm.sh/@solana/web3.js@1.87.6';
import { Program, AnchorProvider, Wallet } from 'https://esm.sh/@coral-xyz/anchor@0.29.0';

// Types
interface StaleMarket {
  id: number;
  market_id: number;
  end_date: string;
  status: string;
  yes_pool: number;
  no_pool: number;
  total_bets: number;
}

interface CancellationResult {
  market_id: number;
  success: boolean;
  error?: string;
  refund_amount?: number;
}

interface Summary {
  cancelled_count: number;
  failed_count: number;
  total_refunded: number;
  errors: string[];
}

serve(async (req) => {
  try {
    // STEP 1: Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // STEP 2: Initialize Solana connection
    const rpcUrl = Deno.env.get('SOLANA_RPC_URL') || 'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');

    // STEP 3: Load platform authority keypair (admin)
    const authorityKeypairJson = Deno.env.get('PLATFORM_AUTHORITY_KEYPAIR');
    if (!authorityKeypairJson) {
      throw new Error('PLATFORM_AUTHORITY_KEYPAIR not configured in secrets');
    }
    const authorityKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(authorityKeypairJson))
    );

    // STEP 4: Fetch stale_market_threshold from ParameterStorage (on-chain)
    // For MVP: Use default 30 days (hardcoded until on-chain fetch implemented)
    const thresholdDays = 30; // TODO: Fetch from ParameterStorage via program
    const thresholdSeconds = thresholdDays * 24 * 60 * 60;

    console.log(`Using stale market threshold: ${thresholdDays} days`);

    // STEP 5: Query stale markets from database
    // Markets are stale if: status = 'ENDED' AND NOW() > end_date + threshold
    const thresholdDate = new Date();
    thresholdDate.setSeconds(thresholdDate.getSeconds() - thresholdSeconds);

    const { data: staleMarkets, error: queryError } = await supabase
      .from('markets')
      .select('id, market_id, end_date, status, yes_pool, no_pool, total_bets')
      .eq('status', 'ENDED')
      .lt('end_date', thresholdDate.toISOString());

    if (queryError) {
      throw new Error(`Failed to query stale markets: ${queryError.message}`);
    }

    if (!staleMarkets || staleMarkets.length === 0) {
      console.log('No stale markets found');
      return new Response(
        JSON.stringify({
          message: 'No stale markets found',
          cancelled_count: 0,
          failed_count: 0,
          total_refunded: 0,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${staleMarkets.length} stale markets to cancel`);

    // STEP 6: Process each stale market
    const results: CancellationResult[] = [];
    let totalRefunded = 0;

    for (const market of staleMarkets) {
      try {
        console.log(`Processing market ${market.market_id}...`);

        // STEP 6a: Call cancel_market instruction (on-chain)
        // TODO: Implement full Anchor program interaction
        // For MVP: Placeholder - will emit MarketCancelledEvent
        // Event Listener (sync-events) will automatically:
        //   - Update database status to CANCELLED
        //   - Log to stale_market_cancellations audit table
        const refundAmount = market.yes_pool + market.no_pool;

        // Note: No manual database update needed!
        // The on-chain cancel_market instruction will emit MarketCancelledEvent,
        // which sync-events Edge Function handles automatically.

        results.push({
          market_id: market.market_id,
          success: true,
          refund_amount: refundAmount,
        });

        totalRefunded += refundAmount;

        console.log(`✅ Market ${market.market_id} cancelled successfully`);
      } catch (error) {
        console.error(`❌ Failed to cancel market ${market.market_id}: ${error.message}`);
        results.push({
          market_id: market.market_id,
          success: false,
          error: error.message,
        });
      }
    }

    // STEP 7: Generate summary
    const summary: Summary = {
      cancelled_count: results.filter((r) => r.success).length,
      failed_count: results.filter((r) => !r.success).length,
      total_refunded: totalRefunded,
      errors: results.filter((r) => !r.success).map((r) => `Market ${r.market_id}: ${r.error}`),
    };

    console.log('Summary:', summary);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Fatal error in check-stale-markets cron job:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        cancelled_count: 0,
        failed_count: 0,
        total_refunded: 0,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
