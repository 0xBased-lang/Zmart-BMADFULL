// BMAD-Zmart Edge Function: Admin Override Resolution
// Story 2.7: Implement Admin Override for Disputed Markets
// Purpose: Allow authorized admins to override market outcomes during dispute period

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

interface AdminOverrideRequest {
  market_id: string; // Market ID from PostgreSQL
  admin_wallet: string; // Admin's Solana wallet address
  new_outcome: 'YES' | 'NO' | 'CANCELLED'; // Overridden outcome
  override_reason: string; // Reason for override
  timestamp: number; // Unix timestamp (ms)
}

interface AdminOverrideResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface MarketData {
  market_id: string;
  status: string;
  resolved_outcome: string | null;
  resolved_at: string | null;
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
    const requestData = await req.json() as AdminOverrideRequest;

    // Step 1: Validate request
    const validationError = validateRequest(requestData);
    if (validationError) {
      return new Response(
        JSON.stringify({ success: false, error: validationError }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    const { market_id, admin_wallet, new_outcome, override_reason, timestamp } = requestData;

    // Step 2: Verify admin authorization
    const isAdmin = await isAuthorizedAdmin(admin_wallet);
    if (!isAdmin) {
      // Log unauthorized attempt for audit trail
      await logOverrideAttempt(market_id, admin_wallet, new_outcome, override_reason, false, "Unauthorized");

      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized: Only authorized admins can override market outcomes",
        }),
        { status: 401, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Step 3: Validate market exists and status
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

    // Step 4: Validate market is in UNDER_REVIEW status
    const statusError = validateMarketStatus(market);
    if (statusError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: statusError,
        }),
        { status: 409, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Step 5: Update market outcome and status to RESOLVED
    await updateMarketResolution(market_id, new_outcome);

    // Step 6: Update all disputes for this market with admin decision
    await updateDisputesWithAdminDecision(market_id, admin_wallet, override_reason);

    // Step 7: Log successful override for audit trail
    await logOverrideAttempt(market_id, admin_wallet, new_outcome, override_reason, true, "Success");

    // Step 8: Return success response
    const response: AdminOverrideResponse = {
      success: true,
      message: `Market ${market_id} outcome overridden to ${new_outcome}. Market status set to RESOLVED.`,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (error) {
    console.error("Admin override error:", error);

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
  if (!data.admin_wallet) return "admin_wallet is required";
  if (!data.new_outcome) return "new_outcome is required";
  if (!data.override_reason) return "override_reason is required";
  if (!data.timestamp) return "timestamp is required";

  // Validate admin wallet address format (Solana addresses are 32-44 characters)
  if (data.admin_wallet.length < 32 || data.admin_wallet.length > 44) {
    return "Invalid admin wallet address format";
  }

  // Validate new outcome is valid
  if (!['YES', 'NO', 'CANCELLED'].includes(data.new_outcome)) {
    return "new_outcome must be YES, NO, or CANCELLED";
  }

  // Validate override reason is not empty and meets minimum length
  if (data.override_reason.trim().length === 0) {
    return "Override reason cannot be empty";
  }
  if (data.override_reason.length < 10) {
    return "Override reason must be at least 10 characters";
  }
  if (data.override_reason.length > 2000) {
    return "Override reason cannot exceed 2000 characters";
  }

  // Validate timestamp is recent (within 5 minutes)
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  if (Math.abs(now - data.timestamp) > fiveMinutes) {
    return "Timestamp must be within 5 minutes of current time";
  }

  return null;
}

function validateMarketStatus(market: MarketData): string | null {
  // Market must be in UNDER_REVIEW status
  if (market.status !== 'UNDER_REVIEW') {
    if (market.status === 'ACTIVE') {
      return "Market is still active and has not been disputed";
    }
    if (market.status === 'VOTING') {
      return "Market is in voting period";
    }
    if (market.status === 'DISPUTE_WINDOW') {
      return "Market is in dispute window but has not been disputed yet";
    }
    if (market.status === 'RESOLVED') {
      return "Market has already been resolved. Cannot override again.";
    }
    if (market.status === 'CANCELLED') {
      return "Market has been cancelled";
    }
    return `Market is not accepting overrides (status: ${market.status})`;
  }

  // Additional check: market should not already be resolved
  if (market.resolved_outcome !== null || market.resolved_at !== null) {
    return "Market has already been resolved. Cannot override again.";
  }

  return null;
}

// ============================================================================
// Admin Authorization
// ============================================================================

async function isAuthorizedAdmin(wallet: string): Promise<boolean> {
  try {
    // For MVP: Simple database table approach for admin whitelist
    // Check if wallet exists in admin_wallets table
    const { data, error } = await supabase
      .from("admin_wallets")
      .select("wallet_address")
      .eq("wallet_address", wallet)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Admin authorization check error:", error);
      return false;
    }

    // If data exists, admin is authorized
    return !!data;

  } catch (error) {
    console.error("Admin authorization error:", error);
    return false;
  }
}

// ============================================================================
// Database Functions
// ============================================================================

async function fetchMarket(marketId: string): Promise<MarketData | null> {
  const { data, error } = await supabase
    .from("markets")
    .select("market_id, status, resolved_outcome, resolved_at")
    .eq("market_id", marketId)
    .single();

  if (error) {
    console.error("Fetch market error:", error);
    return null;
  }

  return data as MarketData;
}

async function updateMarketResolution(
  marketId: string,
  newOutcome: string
): Promise<void> {
  const { error } = await supabase
    .from("markets")
    .update({
      status: 'RESOLVED',
      resolved_outcome: newOutcome,
      resolved_at: new Date().toISOString(),
    })
    .eq("market_id", marketId);

  if (error) {
    throw new Error(`Failed to update market resolution: ${error.message}`);
  }
}

async function updateDisputesWithAdminDecision(
  marketId: string,
  adminWallet: string,
  overrideReason: string
): Promise<void> {
  // Update all disputes for this market to 'resolved' status
  // Store admin wallet and reason in admin_notes
  const adminDecision = `Admin ${adminWallet} overrode market outcome. Reason: ${overrideReason}`;

  const { error } = await supabase
    .from("disputes")
    .update({
      status: 'resolved',
      admin_notes: adminDecision,
    })
    .eq("market_id", marketId)
    .eq("status", "pending"); // Only update pending disputes

  if (error) {
    throw new Error(`Failed to update disputes: ${error.message}`);
  }
}

async function logOverrideAttempt(
  marketId: string,
  adminWallet: string,
  newOutcome: string,
  reason: string,
  success: boolean,
  result: string
): Promise<void> {
  try {
    // Log to admin_override_log table for audit trail
    await supabase.from("admin_override_log").insert({
      market_id: marketId,
      admin_wallet: adminWallet,
      new_outcome: newOutcome,
      override_reason: reason,
      success: success,
      result: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Don't throw error - logging failure shouldn't break the main flow
    console.error("Failed to log override attempt:", error);
  }
}
