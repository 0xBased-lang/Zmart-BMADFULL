// BMAD-Zmart Edge Function: Verify Vote Signature
// Story 2.1: Snapshot-Style Vote Signature Verification
// Purpose: Verify Ed25519 signatures for gas-free off-chain voting
//
// This Edge Function implements Snapshot-style voting where users sign
// messages with their Solana wallet (no transaction, no gas fees) and
// the backend verifies the signature before recording the vote.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nacl from 'https://esm.sh/tweetnacl@1.0.3';
import { decode as base58Decode } from 'https://esm.sh/bs58@5.0.0';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface VoteMessage {
  market_id: number;
  vote_choice: 'YES' | 'NO';
  timestamp: number;  // Unix timestamp in seconds
  nonce: string;      // UUID to prevent replay attacks
}

interface VerifySignatureRequest {
  message: VoteMessage;
  signature: string;  // Base58-encoded signature
  publicKey: string;  // Base58-encoded Solana public key
}

interface SuccessResponse {
  success: true;
  verified: true;
  message: string;
  data?: {
    market_id: number;
    voter_wallet: string;
    vote_choice: string;
    timestamp: number;
  };
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
// Validation Functions
// ============================================================================

/**
 * Validate vote message format
 */
function isValidMessageFormat(message: any): message is VoteMessage {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const { market_id, vote_choice, timestamp, nonce } = message;

  // Check all required fields exist
  if (
    typeof market_id !== 'number' ||
    typeof vote_choice !== 'string' ||
    typeof timestamp !== 'number' ||
    typeof nonce !== 'string'
  ) {
    return false;
  }

  // Validate vote_choice is YES or NO
  if (vote_choice !== 'YES' && vote_choice !== 'NO') {
    return false;
  }

  // Validate market_id is positive
  if (market_id <= 0) {
    return false;
  }

  // Validate timestamp is reasonable (not negative, not too far in future)
  const now = Math.floor(Date.now() / 1000);
  if (timestamp < 0 || timestamp > now + 300) { // Allow 5 min clock skew
    return false;
  }

  // Validate nonce is non-empty
  if (nonce.length === 0 || nonce.length > 128) {
    return false;
  }

  return true;
}

/**
 * Verify Ed25519 signature using TweetNaCl
 */
function verifySignature(
  message: VoteMessage,
  signatureBase58: string,
  publicKeyBase58: string
): boolean {
  try {
    // 1. Serialize message to bytes (must match frontend signing)
    const messageString = JSON.stringify(message);
    const messageBytes = new TextEncoder().encode(messageString);

    // 2. Decode signature from base58
    const signatureBytes = base58Decode(signatureBase58);

    // 3. Decode public key from base58
    const publicKeyBytes = base58Decode(publicKeyBase58);

    // 4. Verify signature is correct length (64 bytes for Ed25519)
    if (signatureBytes.length !== 64) {
      console.error('Invalid signature length:', signatureBytes.length);
      return false;
    }

    // 5. Verify public key is correct length (32 bytes for Ed25519)
    if (publicKeyBytes.length !== 32) {
      console.error('Invalid public key length:', publicKeyBytes.length);
      return false;
    }

    // 6. Verify Ed25519 signature
    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Validate timestamp is within acceptable range
 */
function isTimestampValid(timestamp: number): {
  valid: boolean;
  reason?: string;
} {
  const now = Math.floor(Date.now() / 1000);

  // Check if timestamp is in the future (with 5 min clock skew tolerance)
  if (timestamp > now + 300) {
    return { valid: false, reason: 'Timestamp is in the future' };
  }

  // Check if timestamp is too old (max 24 hours)
  const maxAge = 24 * 60 * 60; // 24 hours in seconds
  if (now - timestamp > maxAge) {
    return { valid: false, reason: 'Timestamp is too old (max 24 hours)' };
  }

  return { valid: true };
}

/**
 * Check if nonce has already been used (replay attack detection)
 */
async function isNonceUsed(
  supabase: any,
  nonce: string,
  voterWallet: string,
  marketId: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from('vote_nonces')
    .select('nonce')
    .eq('nonce', nonce)
    .eq('voter_wallet', voterWallet)
    .eq('market_id', marketId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "not found" error, which is expected for new nonces
    console.error('Error checking nonce:', error);
    throw error;
  }

  // If data exists, nonce has been used
  return data !== null;
}

/**
 * Record nonce in database to prevent future replay
 */
async function recordNonce(
  supabase: any,
  nonce: string,
  voterWallet: string,
  marketId: number
): Promise<void> {
  const { error } = await supabase
    .from('vote_nonces')
    .insert({
      nonce,
      voter_wallet: voterWallet,
      market_id: marketId,
    });

  if (error) {
    console.error('Error recording nonce:', error);
    throw error;
  }
}

/**
 * Validate that market exists and is in voteable state
 */
async function validateMarket(
  supabase: any,
  marketId: number
): Promise<{ valid: boolean; reason?: string; endDate?: Date }> {
  const { data: market, error } = await supabase
    .from('markets')
    .select('market_id, status, end_date')
    .eq('market_id', marketId)
    .single();

  if (error || !market) {
    return { valid: false, reason: 'Market not found' };
  }

  // Market must be ACTIVE to vote
  if (market.status !== 'ACTIVE') {
    return { valid: false, reason: `Market status is ${market.status}, must be ACTIVE` };
  }

  // Voting period must not have ended
  const endDate = new Date(market.end_date);
  const now = new Date();

  if (now > endDate) {
    return { valid: false, reason: 'Voting period has ended' };
  }

  return { valid: true, endDate };
}

// ============================================================================
// Error Response Helpers
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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    let requestBody: VerifySignatureRequest;
    try {
      requestBody = await req.json();
    } catch (error) {
      return errorResponse(400, 'INVALID_JSON', 'Invalid JSON in request body');
    }

    const { message, signature, publicKey } = requestBody;

    // 1. Validate message format
    if (!isValidMessageFormat(message)) {
      return errorResponse(
        400,
        'INVALID_MESSAGE_FORMAT',
        'Invalid vote message format',
        'Message must contain: market_id (number), vote_choice (YES|NO), timestamp (number), nonce (string)'
      );
    }

    // 2. Validate signature and public key are provided
    if (!signature || typeof signature !== 'string') {
      return errorResponse(400, 'MISSING_SIGNATURE', 'Signature is required');
    }

    if (!publicKey || typeof publicKey !== 'string') {
      return errorResponse(400, 'MISSING_PUBLIC_KEY', 'Public key is required');
    }

    // 3. Verify Ed25519 signature
    const isSignatureValid = verifySignature(message, signature, publicKey);
    if (!isSignatureValid) {
      return errorResponse(
        401,
        'INVALID_SIGNATURE',
        'Signature verification failed',
        'The provided signature does not match the message and public key'
      );
    }

    // 4. Validate timestamp
    const timestampCheck = isTimestampValid(message.timestamp);
    if (!timestampCheck.valid) {
      return errorResponse(
        403,
        'INVALID_TIMESTAMP',
        'Timestamp validation failed',
        timestampCheck.reason
      );
    }

    // 5. Validate market exists and is voteable
    const marketCheck = await validateMarket(supabase, message.market_id);
    if (!marketCheck.valid) {
      return errorResponse(
        403,
        'INVALID_MARKET',
        'Market validation failed',
        marketCheck.reason
      );
    }

    // 6. Check nonce hasn't been used (replay attack prevention)
    const nonceUsed = await isNonceUsed(
      supabase,
      message.nonce,
      publicKey,
      message.market_id
    );

    if (nonceUsed) {
      return errorResponse(
        409,
        'NONCE_ALREADY_USED',
        'Vote already recorded',
        'This signature has already been used. Each vote must have a unique nonce.'
      );
    }

    // 7. Record nonce to prevent future replay
    await recordNonce(supabase, message.nonce, publicKey, message.market_id);

    // 8. Return success response
    const response: SuccessResponse = {
      success: true,
      verified: true,
      message: 'Signature verified successfully',
      data: {
        market_id: message.market_id,
        voter_wallet: publicKey,
        vote_choice: message.vote_choice,
        timestamp: message.timestamp,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
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
