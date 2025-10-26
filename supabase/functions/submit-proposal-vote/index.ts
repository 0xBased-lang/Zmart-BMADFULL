// BMAD-Zmart Edge Function: Submit Proposal Vote
// Story 2.4: Proposal Voting via Snapshot
// Purpose: Store verified proposal votes off-chain for gas-free voting

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

interface SubmitProposalVoteRequest {
  proposal_id: string; // Proposal ID from PostgreSQL
  vote_choice: 'YES' | 'NO';
  signature: string; // Base58 encoded Ed25519 signature
  public_key: string; // Voter's Solana wallet public key
  timestamp: number; // Unix timestamp (ms)
  nonce: string; // Unique nonce for replay prevention
}

interface SubmitProposalVoteResponse {
  success: boolean;
  vote_id?: string;
  vote_weight?: number;
  current_tally?: {
    yes_weight: number;
    no_weight: number;
    total_votes: number;
    yes_percentage: number;
  };
  error?: string;
}

interface ProposalData {
  proposal_id: string;
  status: string;
  voting_start: string | null;
  voting_end: string | null;
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
    const requestData = await req.json() as SubmitProposalVoteRequest;

    // Step 1: Validate request
    const validationError = validateRequest(requestData);
    if (validationError) {
      return new Response(
        JSON.stringify({ success: false, error: validationError }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { proposal_id, vote_choice, signature, public_key, timestamp, nonce } = requestData;

    // Step 2: Verify signature using Story 2.1's verification
    const isValidSignature = await verifyProposalVoteSignature(
      proposal_id,
      vote_choice,
      timestamp,
      nonce,
      signature,
      public_key
    );

    if (!isValidSignature) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid signature",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 3: Validate proposal exists and is in VOTING status
    const proposal = await fetchProposal(proposal_id);
    if (!proposal) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Proposal not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 4: Validate voting period
    const votingPeriodError = validateVotingPeriod(proposal);
    if (votingPeriodError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: votingPeriodError,
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 5: Check for duplicate vote
    const hasVoted = await checkDuplicateVote(proposal_id, public_key);
    if (hasVoted) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User has already voted on this proposal",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 6: Calculate vote weight
    const voteWeight = await calculateVoteWeight(public_key);

    // Step 7: Store vote in database
    const voteId = await storeVote({
      proposal_id,
      voter_wallet: public_key,
      vote_choice,
      signature,
      vote_weight: voteWeight,
      timestamp: new Date(timestamp).toISOString(),
      nonce,
    });

    // Step 8: Get current vote tally
    const tally = await getVoteTally(proposal_id);

    // Step 9: Return success response
    const response: SubmitProposalVoteResponse = {
      success: true,
      vote_id: voteId,
      vote_weight: voteWeight,
      current_tally: tally,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (error) {
    console.error("Submit proposal vote error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// ============================================================================
// Validation Functions
// ============================================================================

function validateRequest(data: any): string | null {
  if (!data.proposal_id) return "proposal_id is required";
  if (!data.vote_choice) return "vote_choice is required";
  if (!['YES', 'NO'].includes(data.vote_choice)) {
    return "vote_choice must be YES or NO";
  }
  if (!data.signature) return "signature is required";
  if (!data.public_key) return "public_key is required";
  if (!data.timestamp) return "timestamp is required";
  if (!data.nonce) return "nonce is required";

  // Validate timestamp is recent (within 5 minutes)
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  if (Math.abs(now - data.timestamp) > fiveMinutes) {
    return "Timestamp must be within 5 minutes of current time";
  }

  return null;
}

function validateVotingPeriod(proposal: ProposalData): string | null {
  // Check status
  if (proposal.status !== 'VOTING') {
    if (proposal.status === 'PENDING') {
      return "Voting has not started yet";
    }
    if (proposal.status === 'VOTE_COMPLETE') {
      return "Voting period has ended";
    }
    return `Proposal is not accepting votes (status: ${proposal.status})`;
  }

  // Check voting period
  const now = new Date();
  if (proposal.voting_start && new Date(proposal.voting_start) > now) {
    return "Voting period has not started";
  }
  if (proposal.voting_end && new Date(proposal.voting_end) < now) {
    return "Voting period has ended";
  }

  return null;
}

// ============================================================================
// Signature Verification (Story 2.1 Integration)
// ============================================================================

async function verifyProposalVoteSignature(
  proposalId: string,
  voteChoice: string,
  timestamp: number,
  nonce: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {
    // Build message to verify (same format as Story 2.1)
    const message = {
      proposal_id: proposalId,
      vote_choice: voteChoice,
      timestamp,
      nonce,
    };

    // Call Story 2.1's verify-vote-signature function
    const verifyUrl = `${SUPABASE_URL}/functions/v1/verify-vote-signature`;
    const response = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        message,
        signature,
        public_key: publicKey,
      }),
    });

    const result = await response.json();
    return result.valid === true;

  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

// ============================================================================
// Database Functions
// ============================================================================

async function fetchProposal(proposalId: string): Promise<ProposalData | null> {
  const { data, error } = await supabase
    .from("proposals")
    .select("proposal_id, status, voting_start, voting_end")
    .eq("proposal_id", proposalId)
    .single();

  if (error) {
    console.error("Fetch proposal error:", error);
    return null;
  }

  return data as ProposalData;
}

async function checkDuplicateVote(
  proposalId: string,
  voterWallet: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("proposal_votes")
    .select("id")
    .eq("proposal_id", proposalId)
    .eq("voter_wallet", voterWallet)
    .single();

  // If error is "PGRST116" (no rows), user hasn't voted (good)
  if (error && error.code === "PGRST116") {
    return false;
  }

  // If no error, vote exists (duplicate)
  return !!data;
}

/**
 * Calculate vote weight for a voter
 *
 * Uses the global voting_weight_mode configuration (Story 2.8):
 * - DEMOCRATIC: all votes have weight = 1
 * - ACTIVITY_WEIGHTED: weight = user's activity_points (minimum 1)
 */
async function calculateVoteWeight(voterWallet: string): Promise<number> {
  // Use database function that checks voting_weight_mode and calculates accordingly
  const { data, error } = await supabase.rpc('calculate_user_vote_weight', {
    p_voter_wallet: voterWallet
  });

  if (error) {
    console.error('Error calculating vote weight:', error);
    return 1; // Default to 1 on error
  }

  return data || 1;
}

async function storeVote(voteData: {
  proposal_id: string;
  voter_wallet: string;
  vote_choice: string;
  signature: string;
  vote_weight: number;
  timestamp: string;
  nonce: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from("proposal_votes")
    .insert({
      proposal_id: voteData.proposal_id,
      voter_wallet: voteData.voter_wallet,
      vote_choice: voteData.vote_choice,
      signature: voteData.signature,
      vote_weight: voteData.vote_weight,
      timestamp: voteData.timestamp,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to store vote: ${error.message}`);
  }

  // Store nonce to prevent replay attacks (using Story 2.1's table)
  await supabase.from("vote_nonces").insert({
    nonce: voteData.nonce,
    wallet_address: voteData.voter_wallet,
    used_at: new Date().toISOString(),
  });

  return data.id;
}

async function getVoteTally(proposalId: string): Promise<{
  yes_weight: number;
  no_weight: number;
  total_votes: number;
  yes_percentage: number;
}> {
  const { data, error } = await supabase
    .from("proposal_vote_summary")
    .select("yes_weight, no_weight, total_votes, yes_percentage")
    .eq("proposal_id", proposalId)
    .single();

  if (error) {
    console.warn("Vote tally query error:", error);
    return {
      yes_weight: 0,
      no_weight: 0,
      total_votes: 0,
      yes_percentage: 0,
    };
  }

  return {
    yes_weight: Number(data.yes_weight || 0),
    no_weight: Number(data.no_weight || 0),
    total_votes: Number(data.total_votes || 0),
    yes_percentage: Number(data.yes_percentage || 0),
  };
}
