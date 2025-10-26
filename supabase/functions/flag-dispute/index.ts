// BMAD-Zmart Edge Function: Flag Dispute
// Story 2.6: Implement Dispute Flagging Mechanism
// Purpose: Allow users to flag market resolutions during 48-hour dispute window

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Initialize Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// Types
// ============================================================================

interface FlagDisputeRequest {
  market_id: string; // Market ID from PostgreSQL
  disputer_wallet: string; // Solana wallet address
  reason_text: string; // Reason for disputing
  evidence_links?: string[]; // Optional array of evidence URLs
  timestamp: number; // Unix timestamp (ms)
}

interface FlagDisputeResponse {
  success: boolean;
  dispute_id?: string;
  message?: string;
  error?: string;
}

interface MarketData {
  market_id: string;
  status: string;
  dispute_window_end: string | null;
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const requestData = await req.json() as FlagDisputeRequest;

    // Step 1: Validate request
    const validationError = validateRequest(requestData);
    if (validationError) {
      return new Response(
        JSON.stringify({ success: false, error: validationError }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    const { market_id, disputer_wallet, reason_text, evidence_links, timestamp } = requestData;

    // Step 2: Validate market exists
    const market = await fetchMarket(market_id);
    if (!market) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Market not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Step 3: Validate 48-hour dispute window
    const disputeWindowError = validateDisputeWindow(market);
    if (disputeWindowError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: disputeWindowError,
        }),
        { status: 409, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Step 4: Check for duplicate dispute
    const hasDisputed = await checkDuplicateDispute(market_id, disputer_wallet);
    if (hasDisputed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "You have already disputed this market",
        }),
        { status: 409, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Step 5: Validate evidence links (if provided)
    if (evidence_links && evidence_links.length > 0) {
      const evidenceError = validateEvidenceLinks(evidence_links);
      if (evidenceError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: evidenceError,
          }),
          { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );
      }
    }

    // Step 6: Store dispute in database
    const disputeId = await storeDispute({
      market_id,
      disputer_wallet,
      reason_text,
      evidence_links: evidence_links || [],
      timestamp: new Date(timestamp).toISOString(),
    });

    // Step 7: Update market status to UNDER_REVIEW (if first dispute)
    await updateMarketStatusIfNeeded(market_id);

    // Step 8: Return success response
    const response: FlagDisputeResponse = {
      success: true,
      dispute_id: disputeId,
      message: "Dispute submitted successfully. Admins will review your submission.",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (error) {
    console.error("Flag dispute error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
});

// ============================================================================
// Validation Functions
// ============================================================================

function validateRequest(data: any): string | null {
  if (!data.market_id) return "market_id is required";
  if (!data.disputer_wallet) return "disputer_wallet is required";
  if (!data.reason_text) return "reason_text is required";
  if (!data.timestamp) return "timestamp is required";

  // Validate wallet address format (Solana addresses are 32-44 characters)
  if (data.disputer_wallet.length < 32 || data.disputer_wallet.length > 44) {
    return "Invalid wallet address format";
  }

  // Validate reason text is not empty
  if (data.reason_text.trim().length === 0) {
    return "Reason text cannot be empty";
  }

  // Validate reason text length (min 10 chars, max 2000 chars)
  if (data.reason_text.length < 10) {
    return "Reason text must be at least 10 characters";
  }
  if (data.reason_text.length > 2000) {
    return "Reason text cannot exceed 2000 characters";
  }

  // Validate timestamp is recent (within 5 minutes)
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  if (Math.abs(now - data.timestamp) > fiveMinutes) {
    return "Timestamp must be within 5 minutes of current time";
  }

  return null;
}

function validateDisputeWindow(market: MarketData): string | null {
  // Check market status
  if (market.status !== 'DISPUTE_WINDOW') {
    if (market.status === 'ACTIVE') {
      return "Market voting has not completed yet";
    }
    if (market.status === 'VOTING') {
      return "Market is still in voting period";
    }
    if (market.status === 'RESOLVED') {
      return "Market has already been resolved. Dispute window has closed.";
    }
    if (market.status === 'CANCELLED') {
      return "Market has been cancelled";
    }
    if (market.status === 'UNDER_REVIEW') {
      // Allow disputes even if market is already under review
      // Multiple users can dispute the same market
      // Fall through to check dispute window timing
    } else {
      return `Market is not accepting disputes (status: ${market.status})`;
    }
  }

  // Check dispute window timing
  if (!market.dispute_window_end) {
    return "Market does not have a dispute window set";
  }

  const now = new Date();
  const disputeEnd = new Date(market.dispute_window_end);

  if (disputeEnd < now) {
    return "Dispute window has closed (48 hours have passed)";
  }

  return null;
}

function validateEvidenceLinks(links: string[]): string | null {
  // Validate maximum number of evidence links
  if (links.length > 10) {
    return "Maximum 10 evidence links allowed";
  }

  // Validate each link is a valid URL
  for (const link of links) {
    try {
      const url = new URL(link);

      // Only allow http/https protocols
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return `Invalid URL protocol: ${link}. Only http/https allowed.`;
      }

      // Validate URL length
      if (link.length > 500) {
        return `URL too long (max 500 characters): ${link}`;
      }

    } catch (error) {
      return `Invalid URL format: ${link}`;
    }
  }

  return null;
}

// ============================================================================
// Database Functions
// ============================================================================

async function fetchMarket(marketId: string): Promise<MarketData | null> {
  const { data, error } = await supabase
    .from("markets")
    .select("market_id, status, dispute_window_end")
    .eq("market_id", marketId)
    .single();

  if (error) {
    console.error("Fetch market error:", error);
    return null;
  }

  return data as MarketData;
}

async function checkDuplicateDispute(
  marketId: string,
  disputerWallet: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("disputes")
    .select("id")
    .eq("market_id", marketId)
    .eq("disputer_wallet", disputerWallet)
    .single();

  // If error is "PGRST116" (no rows), user hasn't disputed (good)
  if (error && error.code === "PGRST116") {
    return false;
  }

  // If no error, dispute exists (duplicate)
  return !!data;
}

async function storeDispute(disputeData: {
  market_id: string;
  disputer_wallet: string;
  reason_text: string;
  evidence_links: string[];
  timestamp: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from("disputes")
    .insert({
      market_id: disputeData.market_id,
      disputer_wallet: disputeData.disputer_wallet,
      reason_text: disputeData.reason_text,
      evidence_links: disputeData.evidence_links,
      timestamp: disputeData.timestamp,
      status: 'pending',
    })
    .select("id")
    .single();

  if (error) {
    // Check for unique constraint violation
    if (error.code === '23505') {
      throw new Error("You have already disputed this market");
    }
    throw new Error(`Failed to store dispute: ${error.message}`);
  }

  return data.id.toString();
}

async function updateMarketStatusIfNeeded(marketId: string): Promise<void> {
  // Check if this is the first dispute for this market
  const { count, error: countError } = await supabase
    .from("disputes")
    .select("*", { count: 'exact', head: true })
    .eq("market_id", marketId);

  if (countError) {
    console.error("Count disputes error:", countError);
    return;
  }

  // If this is the first dispute, update market status to UNDER_REVIEW
  if (count === 1) {
    const { error: updateError } = await supabase
      .from("markets")
      .update({ status: 'UNDER_REVIEW' })
      .eq("market_id", marketId);

    if (updateError) {
      console.error("Update market status error:", updateError);
      // Don't throw - dispute was stored successfully
      // Market status update is a secondary operation
    }
  }
}
