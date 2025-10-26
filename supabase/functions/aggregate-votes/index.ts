// BMAD-Zmart Edge Function: Aggregate Votes
// Story 2.3: Vote Aggregation and On-Chain Result Posting
// Purpose: Aggregate off-chain votes and post results to Solana blockchain

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  Keypair,
} from "https://esm.sh/@solana/web3.js@1.87.6";
import { BN, Program, AnchorProvider, Wallet } from "https://esm.sh/@coral-xyz/anchor@0.29.0";
import { generateMerkleRoot, Vote } from "./merkle.ts";

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SOLANA_RPC_URL = Deno.env.get("SOLANA_RPC_URL") || "https://api.devnet.solana.com";
const PLATFORM_ADMIN_PRIVATE_KEY = Deno.env.get("PLATFORM_ADMIN_PRIVATE_KEY")!; // Base58 encoded

// Program IDs
const MARKET_RESOLUTION_PROGRAM_ID = new PublicKey(
  "Hcxxt6W1HmKQmnUvqpgzNEqVG611Yzt2i4DUvwvkLRf2"
);
const PARAMETER_STORAGE_PROGRAM_ID = new PublicKey(
  "J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD"
);

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const connection = new Connection(SOLANA_RPC_URL, "confirmed");

// ============================================================================
// Types
// ============================================================================

interface AggregateVotesRequest {
  market_id: string; // PostgreSQL market_id (BIGINT as string)
}

interface AggregateVotesResponse {
  success: boolean;
  outcome: 'YES' | 'NO' | 'TIE' | 'NO_VOTES';
  yes_weight: number;
  no_weight: number;
  total_votes: number;
  merkle_root: string;
  transaction_signature?: string;
  vote_result_pubkey?: string;
  error?: string;
}

interface VoteData {
  voter_wallet: string;
  vote_choice: 'YES' | 'NO';
  vote_weight: number;
  timestamp: string;
  signature: string;
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  try {
    const { market_id } = await req.json() as AggregateVotesRequest;

    // Validation
    if (!market_id) {
      return new Response(
        JSON.stringify({ success: false, error: "market_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 1: Fetch all votes for market
    const votes = await fetchVotes(market_id);

    // Step 2: Check if voting period has ended
    const market = await fetchMarket(market_id);
    if (!market) {
      return new Response(
        JSON.stringify({ success: false, error: "Market not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const votingEnd = new Date(market.voting_end);
    if (now < votingEnd) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Voting period not ended yet",
          voting_end: market.voting_end,
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 3: Check if result already posted
    const existingResult = await fetchVoteResult(market_id);
    if (existingResult) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Vote result already posted for this market",
          existing_result: existingResult,
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 4: Aggregate votes
    const aggregation = aggregateVotes(votes);

    // Step 5: Generate Merkle root
    const merkleResult = generateMerkleRoot(votes);

    // Step 6: Post result to Solana
    const txResult = await postVoteResultOnChain(
      parseInt(market_id),
      aggregation.outcome,
      aggregation.yes_weight,
      aggregation.no_weight,
      votes.length,
      merkleResult.root
    );

    // Step 7: Return success response
    const response: AggregateVotesResponse = {
      success: true,
      outcome: aggregation.outcome,
      yes_weight: aggregation.yes_weight,
      no_weight: aggregation.no_weight,
      total_votes: votes.length,
      merkle_root: merkleResult.root,
      transaction_signature: txResult.signature,
      vote_result_pubkey: txResult.voteResultPubkey,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Aggregate votes error:", error);

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
// Database Functions
// ============================================================================

async function fetchVotes(marketId: string): Promise<Vote[]> {
  const { data, error } = await supabase
    .from("votes")
    .select("voter_wallet, vote_choice, vote_weight, timestamp, signature")
    .eq("market_id", marketId)
    .order("timestamp", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch votes: ${error.message}`);
  }

  return data as Vote[];
}

async function fetchMarket(marketId: string) {
  const { data, error } = await supabase
    .from("markets")
    .select("market_id, voting_end, status")
    .eq("market_id", marketId)
    .single();

  if (error) {
    console.error("Fetch market error:", error);
    return null;
  }

  return data;
}

async function fetchVoteResult(marketId: string) {
  const { data, error } = await supabase
    .from("vote_results")
    .select("*")
    .eq("market_id", marketId)
    .single();

  if (error) {
    // No existing result (expected)
    return null;
  }

  return data;
}

// ============================================================================
// Vote Aggregation Logic
// ============================================================================

function aggregateVotes(votes: Vote[]): {
  outcome: 'YES' | 'NO' | 'TIE' | 'NO_VOTES';
  yes_weight: number;
  no_weight: number;
} {
  if (votes.length === 0) {
    return {
      outcome: 'NO_VOTES',
      yes_weight: 0,
      no_weight: 0,
    };
  }

  // Sum vote weights by choice
  let yes_weight = 0;
  let no_weight = 0;

  for (const vote of votes) {
    if (vote.vote_choice === 'YES') {
      yes_weight += vote.vote_weight;
    } else if (vote.vote_choice === 'NO') {
      no_weight += vote.vote_weight;
    }
  }

  // Determine outcome (>50% rule)
  const total_weight = yes_weight + no_weight;
  const yes_percentage = yes_weight / total_weight;

  let outcome: 'YES' | 'NO' | 'TIE';
  if (yes_percentage > 0.5) {
    outcome = 'YES';
  } else if (yes_percentage < 0.5) {
    outcome = 'NO';
  } else {
    // Exactly 50/50: tie (default to NO per story requirements)
    outcome = 'TIE';
  }

  return {
    outcome,
    yes_weight,
    no_weight,
  };
}

// ============================================================================
// Solana Transaction Building
// ============================================================================

async function postVoteResultOnChain(
  marketId: number,
  outcome: 'YES' | 'NO' | 'TIE' | 'NO_VOTES',
  yesWeight: number,
  noWeight: number,
  totalVotesCount: number,
  merkleRoot: string
): Promise<{ signature: string; voteResultPubkey: string }> {
  // Decode admin keypair
  const adminKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(PLATFORM_ADMIN_PRIVATE_KEY))
  );

  // Derive VoteResult PDA
  const [voteResultPubkey] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("vote-result"),
      new BN(marketId).toArrayLike(Buffer, "le", 8),
    ],
    MARKET_RESOLUTION_PROGRAM_ID
  );

  // Derive GlobalParameters PDA
  const [globalParamsPubkey] = PublicKey.findProgramAddressSync(
    [Buffer.from("global-parameters")],
    PARAMETER_STORAGE_PROGRAM_ID
  );

  // Convert outcome to enum
  const outcomeEnum = outcomeToEnum(outcome);

  // Convert merkle root (hex string) to 32-byte array
  const merkleRootBytes = hexToBytes(merkleRoot);
  if (merkleRootBytes.length !== 32) {
    throw new Error(`Invalid merkle root length: ${merkleRootBytes.length}`);
  }

  // Build instruction data
  const instructionData = Buffer.concat([
    Buffer.from([0x05]), // Instruction discriminator for post_vote_result
    new BN(marketId).toArrayLike(Buffer, "le", 8),
    Buffer.from([outcomeEnum]), // VoteChoice enum (0=Yes, 1=No, 2=Cancel)
    new BN(yesWeight).toArrayLike(Buffer, "le", 8),
    new BN(noWeight).toArrayLike(Buffer, "le", 8),
    new BN(totalVotesCount).toArrayLike(Buffer, "le", 4),
    Buffer.from(merkleRootBytes),
  ]);

  // Build transaction
  const transaction = new Transaction().add({
    keys: [
      { pubkey: voteResultPubkey, isSigner: false, isWritable: true },
      { pubkey: globalParamsPubkey, isSigner: false, isWritable: false },
      { pubkey: adminKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: PARAMETER_STORAGE_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: MARKET_RESOLUTION_PROGRAM_ID,
    data: instructionData,
  });

  // Send and confirm transaction
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [adminKeypair],
    { commitment: "confirmed" }
  );

  console.log(`Vote result posted: ${signature}`);
  console.log(`VoteResult account: ${voteResultPubkey.toString()}`);

  return {
    signature,
    voteResultPubkey: voteResultPubkey.toString(),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function outcomeToEnum(outcome: 'YES' | 'NO' | 'TIE' | 'NO_VOTES'): number {
  // VoteChoice enum in Rust: Yes=0, No=1, Cancel=2
  // For TIE and NO_VOTES, default to NO (1)
  switch (outcome) {
    case 'YES':
      return 0;
    case 'NO':
    case 'TIE':
    case 'NO_VOTES':
      return 1;
    default:
      return 1; // Default to NO
  }
}

function hexToBytes(hex: string): number[] {
  // Remove 0x prefix if present
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;

  // Convert hex string to byte array
  const bytes: number[] = [];
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes.push(parseInt(cleanHex.substr(i, 2), 16));
  }
  return bytes;
}
