// BMAD-Zmart Edge Function: Submit Vote
// Story 2.2: Vote Collection and Storage
// Purpose: Store verified votes in PostgreSQL for gas-free voting
//
// This Edge Function integrates with Story 2.1 (verify-vote-signature) to
// verify signatures before storing votes in the database.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface VoteMessage {
  market_id: number;
  vote_choice: 'YES' | 'NO';
  timestamp: number;
  nonce: string;
}

interface SubmitVoteRequest {
  message: VoteMessage;
  signature: string;
  publicKey: string;
}

interface VoteCounts {
  yes_count: number;
  no_count: number;
  yes_weight: number;
  no_weight: number;
  total_votes: number;
  total_weight: number;
}

interface SuccessResponse {
  success: true;
  vote: {
    id: number;
    market_id: number;
    voter_wallet: string;
    vote_choice: string;
    vote_weight: number;
    timestamp: string;
  };
  current_totals: VoteCounts;
  message: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: string;
}

// ============================================================================
// CORS Headers
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate vote weight for a voter
 */
async function calculateVoteWeight(
  supabase: any,
  voterWallet: string,
  mode: 'democratic' | 'weighted' = 'democratic'
): Promise<number> {
  if (mode === 'democratic') {
    return 1;
  }

  // Weighted mode: use activity points from database function
  const { data, error } = await supabase.rpc('calculate_vote_weight', {
    p_voter_wallet: voterWallet,
    p_mode: mode
  });

  if (error) {
    console.error('Error calculating vote weight:', error);
    return 1; // Default to 1 on error
  }

  return data || 1;
}

/**
 * Get current vote counts for a market
 */
async function getVoteCounts(supabase: any, marketId: number): Promise<VoteCounts> {
  const { data, error } = await supabase.rpc('get_vote_counts', {
    p_market_id: marketId
  });

  if (error) {
    console.error('Error getting vote counts:', error);
    throw error;
  }

  return data[0] || {
    yes_count: 0,
    no_count: 0,
    yes_weight: 0,
    no_weight: 0,
    total_votes: 0,
    total_weight: 0,
  };
}

/**
 * Verify signature by calling Story 2.1 Edge Function
 */
async function verifySignature(
  message: VoteMessage,
  signature: string,
  publicKey: string
): Promise<{ verified: boolean; error?: string; code?: string }> {
  try {
    const verifyUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/verify-vote-signature`;

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({ message, signature, publicKey }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        verified: false,
        error: result.error || 'Signature verification failed',
        code: result.code || 'VERIFICATION_FAILED',
      };
    }

    return { verified: true };
  } catch (error) {
    console.error('Signature verification error:', error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'VERIFICATION_ERROR',
    };
  }
}

// ============================================================================
// Error Response Helper
// ============================================================================

function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: string
): Response {
  const body: ErrorResponse = {
    success: false,
    error: message,
    code,
  };

  if (details) {
    body.details = details;
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

// ============================================================================
// Main Edge Function Handler
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed, use POST');
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    let requestBody: SubmitVoteRequest;
    try {
      requestBody = await req.json();
    } catch (error) {
      return errorResponse(400, 'INVALID_JSON', 'Invalid JSON in request body');
    }

    const { message, signature, publicKey } = requestBody;

    // Validate required fields
    if (!message || !signature || !publicKey) {
      return errorResponse(
        400,
        'MISSING_FIELDS',
        'Missing required fields: message, signature, publicKey'
      );
    }

    // STEP 1: Verify signature using Story 2.1 function
    console.log('Step 1: Verifying signature...');
    const verificationResult = await verifySignature(message, signature, publicKey);

    if (!verificationResult.verified) {
      return errorResponse(
        401,
        verificationResult.code || 'INVALID_SIGNATURE',
        verificationResult.error || 'Signature verification failed'
      );
    }

    // STEP 2: Calculate vote weight
    console.log('Step 2: Calculating vote weight...');
    const voteWeight = await calculateVoteWeight(
      supabase,
      publicKey,
      'democratic' // TODO: Make configurable per market or system-wide
    );

    // STEP 3: Store vote in database
    console.log('Step 3: Storing vote in database...');
    const { data: vote, error: insertError } = await supabase
      .from('votes')
      .insert({
        market_id: message.market_id,
        voter_wallet: publicKey,
        vote_choice: message.vote_choice,
        vote_weight: voteWeight,
        signature,
        nonce: message.nonce,
        vote_message: message,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);

      // Check for unique constraint violation (double vote)
      if (insertError.code === '23505') {
        return errorResponse(
          409,
          'DUPLICATE_VOTE',
          'You have already voted on this market',
          'Each voter can only submit one vote per market. To change your vote, contact support.'
        );
      }

      // Check for foreign key violation (market doesn't exist)
      if (insertError.code === '23503') {
        return errorResponse(
          404,
          'MARKET_NOT_FOUND',
          'Market not found',
          `Market with ID ${message.market_id} does not exist`
        );
      }

      throw insertError;
    }

    // STEP 4: Get updated vote counts
    console.log('Step 4: Getting updated vote counts...');
    const voteCounts = await getVoteCounts(supabase, message.market_id);

    // STEP 5: Return success response
    console.log('Step 5: Returning success response');
    const response: SuccessResponse = {
      success: true,
      vote: {
        id: vote.id,
        market_id: vote.market_id,
        voter_wallet: vote.voter_wallet,
        vote_choice: vote.vote_choice,
        vote_weight: vote.vote_weight,
        timestamp: vote.timestamp,
      },
      current_totals: voteCounts,
      message: 'Vote submitted successfully',
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(
      500,
      'INTERNAL_ERROR',
      'Internal server error',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});
