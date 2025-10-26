// BMAD-Zmart Event Listener - Supabase Edge Function
// Story 1.9: Solana → Database Sync
// Created: 2025-10-24

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Connection, PublicKey } from "https://esm.sh/@solana/web3.js@1.87.6";

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SOLANA_RPC_URL = Deno.env.get("SOLANA_RPC_URL") || "https://api.devnet.solana.com";

// Program IDs (from deployment)
const PROGRAM_IDS = {
  programRegistry: new PublicKey("2ysaGgXXKK7fTjKp59nVyivP7yoUpf9QHJqQHAuavchP"),
  parameterStorage: new PublicKey("J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD"),
  coreMarkets: new PublicKey("6BBZWsJZq23k2NX3YnENgXTEPhbVEHXYmPxmamN83eEV"),
  bondManager: new PublicKey("8XvCToLC42ZV4hw6PW5SEhqDpX3NfqvbAS2tNseG52Fx"),
  marketResolution: new PublicKey("Hcxxt6W1HmKQmnUvqpgzNEqVG611Yzt2i4DUvwvkLRf2"),
  proposalSystem: new PublicKey("5XH5i8dypiB4Wwa7TkmU6dnk9SyUGqE92GiQMHypPekL"),
};

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const connection = new Connection(SOLANA_RPC_URL, "confirmed");

// ============================================================================
// Event Handlers
// ============================================================================

interface EventContext {
  signature: string;
  slot: number;
  timestamp: number;
  programId: string;
}

// CoreMarkets Event Handlers
async function handleMarketCreated(data: any, ctx: EventContext) {
  console.log(`[MarketCreated] signature=${ctx.signature}`);

  const { error } = await supabase.from("markets").insert({
    market_id: data.marketId.toString(),
    creator: data.creator.toString(),
    title: data.title,
    description: data.description,
    category: data.category,
    end_date: new Date(data.endTimestamp * 1000).toISOString(),
    status: "active",
    yes_pool: 0,
    no_pool: 0,
    total_bets: 0,
    created_at: new Date(ctx.timestamp).toISOString(),
  });

  if (error) throw error;

  // Log sync event
  await logEvent(ctx, "market_created", true);
}

async function handleBetPlaced(data: any, ctx: EventContext) {
  console.log(`[BetPlaced] signature=${ctx.signature}`);

  // Insert bet record
  const { error: betError } = await supabase.from("bets").insert({
    bet_id: data.betId?.toString() || `${ctx.signature}_${data.bettor}`,
    market_id: data.marketId.toString(),
    user_wallet: data.bettor.toString(),
    position: data.position ? "yes" : "no",
    amount: data.amount,
    shares: data.shares,
    timestamp: new Date(ctx.timestamp).toISOString(),
    claimed: false,
  });

  if (betError) throw betError;

  // Update market pools
  const poolField = data.position ? "yes_pool" : "no_pool";
  const { error: marketError } = await supabase.rpc("increment_market_pool", {
    p_market_id: data.marketId.toString(),
    p_pool_field: poolField,
    p_amount: data.amount,
  });

  if (marketError) throw marketError;

  // Award activity points (+5 for bet)
  await awardActivityPoints(data.bettor.toString(), 5, "bet_placed");

  await logEvent(ctx, "bet_placed", true);
}

async function handleMarketResolved(data: any, ctx: EventContext) {
  console.log(`[MarketResolved] signature=${ctx.signature}`);

  const { error } = await supabase
    .from("markets")
    .update({
      status: "resolved",
      winning_outcome: data.winningOutcome ? "yes" : "no",
      resolved_at: new Date(ctx.timestamp).toISOString(),
    })
    .eq("market_id", data.marketId.toString());

  if (error) throw error;

  await logEvent(ctx, "market_resolved", true);
}

async function handlePayoutClaimed(data: any, ctx: EventContext) {
  console.log(`[PayoutClaimed] signature=${ctx.signature}`);

  const { error } = await supabase
    .from("bets")
    .update({ claimed: true })
    .eq("bet_id", data.betId?.toString() || `${data.marketId}_${data.bettor}`)
    .eq("user_wallet", data.bettor.toString());

  if (error) throw error;

  // Award win bonus points (+5 to +50 based on payout size)
  const bonusPoints = Math.min(50, Math.max(5, Math.floor(data.amount / 1_000_000)));
  await awardActivityPoints(data.bettor.toString(), bonusPoints, "payout_claimed");

  await logEvent(ctx, "payout_claimed", true);
}

// BondManager Event Handlers
async function handleBondDeposited(data: any, ctx: EventContext) {
  console.log(`[BondDeposited] signature=${ctx.signature}`);

  const { error } = await supabase
    .from("markets")
    .update({ bond_deposited: true })
    .eq("market_id", data.marketId.toString());

  if (error) throw error;

  await logEvent(ctx, "bond_deposited", true);
}

async function handleCreatorFeesClaimed(data: any, ctx: EventContext) {
  console.log(`[CreatorFeesClaimed] signature=${ctx.signature}`);

  // Update user stats
  await supabase.rpc("update_user_stats", {
    p_wallet: data.creator.toString(),
    p_fees_earned: data.amount,
  });

  await logEvent(ctx, "creator_fees_claimed", true);
}

// MarketResolution Event Handlers
async function handleVoteSubmitted(data: any, ctx: EventContext) {
  console.log(`[VoteSubmitted] signature=${ctx.signature}`);

  const { error } = await supabase.from("resolution_votes").insert({
    market_id: data.marketId.toString(),
    voter: data.voter.toString(),
    vote_outcome: data.outcome ? "yes" : "no",
    timestamp: new Date(ctx.timestamp).toISOString(),
  });

  if (error) throw error;

  // Award activity points (+10 for voting)
  await awardActivityPoints(data.voter.toString(), 10, "resolution_vote");

  await logEvent(ctx, "vote_submitted", true);
}

async function handleVoteResultPosted(data: any, ctx: EventContext) {
  console.log(`[VoteResultPosted] signature=${ctx.signature}`);

  // Update market status to DISPUTE_WINDOW
  const { error: marketError } = await supabase
    .from("markets")
    .update({
      status: "DISPUTE_WINDOW",
      dispute_window_end: new Date(data.disputeWindowEnd * 1000).toISOString(),
    })
    .eq("market_id", data.marketId.toString());

  if (marketError) throw marketError;

  // Insert vote result record
  const { error: resultError } = await supabase.from("vote_results").insert({
    market_id: data.marketId.toString(),
    outcome: outcomeEnumToString(data.outcome),
    yes_vote_weight: data.yesVoteWeight.toString(),
    no_vote_weight: data.noVoteWeight.toString(),
    total_votes_count: data.totalVotesCount,
    merkle_root: bytesToHex(data.merkleRoot),
    posted_at: new Date(data.timestamp * 1000).toISOString(),
    dispute_window_end: new Date(data.disputeWindowEnd * 1000).toISOString(),
    transaction_signature: ctx.signature,
  });

  if (resultError) throw resultError;

  await logEvent(ctx, "vote_result_posted", true);
}

// Helper: Convert VoteChoice enum to string
function outcomeEnumToString(outcome: any): string {
  // VoteChoice enum: Yes=0, No=1, Cancel=2
  if (outcome === 0 || outcome.Yes !== undefined) return "YES";
  if (outcome === 1 || outcome.No !== undefined) return "NO";
  if (outcome === 2 || outcome.Cancel !== undefined) return "TIE";
  return "NO"; // Default
}

// Helper: Convert byte array to hex string
function bytesToHex(bytes: number[] | Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ProposalSystem Event Handlers
async function handleProposalCreated(data: any, ctx: EventContext) {
  console.log(`[ProposalCreated] signature=${ctx.signature}`);

  const { error } = await supabase.from("proposals").insert({
    proposal_id: data.proposalId.toString(),
    proposer: data.proposer.toString(),
    proposal_type: data.proposalType,
    target_program: data.targetProgram?.toString() || null,
    parameter_key: data.parameterKey || null,
    new_value: data.newValue || null,
    description: data.description,
    status: "active",
    yes_votes: 0,
    no_votes: 0,
    created_at: new Date(ctx.timestamp).toISOString(),
  });

  if (error) throw error;

  // Award activity points (+20 for creating proposal)
  await awardActivityPoints(data.proposer.toString(), 20, "proposal_created");

  await logEvent(ctx, "proposal_created", true);
}

async function handleProposalVote(data: any, ctx: EventContext) {
  console.log(`[ProposalVote] signature=${ctx.signature}`);

  const { error } = await supabase.from("proposal_votes").insert({
    proposal_id: data.proposalId.toString(),
    voter: data.voter.toString(),
    vote: data.vote ? "yes" : "no",
    voting_power: data.votingPower || 1,
    timestamp: new Date(ctx.timestamp).toISOString(),
  });

  if (error) throw error;

  // Award activity points (+10 for voting)
  await awardActivityPoints(data.voter.toString(), 10, "proposal_vote");

  await logEvent(ctx, "proposal_vote", true);
}

async function handleProposalFinalized(data: any, ctx: EventContext) {
  console.log(`[ProposalFinalized] signature=${ctx.signature}`);

  const { error } = await supabase
    .from("proposals")
    .update({
      status: data.approved ? "approved" : "rejected",
      finalized_at: new Date(ctx.timestamp).toISOString(),
    })
    .eq("proposal_id", data.proposalId.toString());

  if (error) throw error;

  await logEvent(ctx, "proposal_finalized", true);
}

// ============================================================================
// Helper Functions
// ============================================================================

async function awardActivityPoints(
  wallet: string,
  points: number,
  reason: string
) {
  const { error } = await supabase.from("activity_points").insert({
    user_wallet: wallet,
    points,
    reason,
    timestamp: new Date().toISOString(),
  });

  if (error) console.error(`Failed to award points: ${error.message}`);
}

async function logEvent(
  ctx: EventContext,
  eventType: string,
  success: boolean,
  errorMsg?: string
) {
  await supabase.from("event_log").insert({
    signature: ctx.signature,
    slot: ctx.slot,
    program_id: ctx.programId,
    event_type: eventType,
    success,
    error_message: errorMsg || null,
    timestamp: new Date(ctx.timestamp).toISOString(),
  });
}

// ============================================================================
// Event Router
// ============================================================================

const EVENT_HANDLERS: Record<string, (data: any, ctx: EventContext) => Promise<void>> = {
  // CoreMarkets
  "MarketCreated": handleMarketCreated,
  "BetPlaced": handleBetPlaced,
  "MarketResolved": handleMarketResolved,
  "PayoutClaimed": handlePayoutClaimed,

  // BondManager
  "BondDeposited": handleBondDeposited,
  "CreatorFeesClaimed": handleCreatorFeesClaimed,

  // MarketResolution
  "VoteSubmitted": handleVoteSubmitted,
  "VoteResultPosted": handleVoteResultPosted, // Story 2.3

  // ProposalSystem
  "ProposalCreated": handleProposalCreated,
  "ProposalVote": handleProposalVote,
  "ProposalFinalized": handleProposalFinalized,
};

async function processEvent(
  eventName: string,
  data: any,
  ctx: EventContext
): Promise<void> {
  const handler = EVENT_HANDLERS[eventName];

  if (!handler) {
    console.warn(`Unknown event: ${eventName}`);
    await logEvent(ctx, eventName, false, "Unknown event type");
    return;
  }

  // Retry logic: 3 attempts with exponential backoff
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await handler(data, ctx);
      return; // Success
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt}/3 failed for ${eventName}:`, error);

      if (attempt < 3) {
        const backoffMs = Math.pow(2, attempt) * 1000; // 2s, 4s
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  // All retries failed
  await logEvent(ctx, eventName, false, lastError?.message);
  throw lastError;
}

// ============================================================================
// Main Event Listener
// ============================================================================

async function startEventListener() {
  console.log("🚀 BMAD-Zmart Event Listener Started");
  console.log(`RPC: ${SOLANA_RPC_URL}`);
  console.log("Listening to programs:", Object.keys(PROGRAM_IDS));

  // Subscribe to all program logs
  for (const [name, programId] of Object.entries(PROGRAM_IDS)) {
    connection.onLogs(
      programId,
      async (logs, ctx) => {
        console.log(`[${name}] Transaction: ${logs.signature}`);

        // Parse events from logs
        for (const log of logs.logs) {
          // Look for "Program data:" prefix (Anchor event logs)
          if (log.startsWith("Program data:")) {
            try {
              const eventData = log.replace("Program data: ", "");
              // TODO: Decode Anchor event data (requires IDL)
              // For now, we'll use a simple parser

              const eventContext: EventContext = {
                signature: logs.signature,
                slot: ctx.slot,
                timestamp: Date.now(),
                programId: programId.toString(),
              };

              // Parse event name and data
              // This is a simplified version - production would use Anchor's EventParser
              const eventMatch = log.match(/Program log: (.+)/);
              if (eventMatch) {
                const [eventName, ...dataParts] = eventMatch[1].split(" ");
                const eventData = JSON.parse(dataParts.join(" ") || "{}");

                await processEvent(eventName, eventData, eventContext);
              }
            } catch (error) {
              console.error("Failed to parse event:", error);
            }
          }
        }
      },
      "confirmed"
    );

    console.log(`✅ Subscribed to ${name} (${programId.toString()})`);
  }

  // Keep function alive
  await new Promise(() => {});
}

// ============================================================================
// HTTP Handler (for Supabase Edge Functions)
// ============================================================================

serve(async (req) => {
  const { action } = await req.json();

  if (action === "start") {
    // Start event listener in background
    startEventListener().catch(console.error);

    return new Response(
      JSON.stringify({ status: "started", message: "Event listener running" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  if (action === "health") {
    return new Response(
      JSON.stringify({ status: "healthy", timestamp: new Date().toISOString() }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ error: "Invalid action" }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
});
