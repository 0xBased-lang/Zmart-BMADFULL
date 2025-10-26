// BMAD-Zmart Edge Function: Finalize Proposal Vote
// Story 2.5: Implement Proposal Approval/Rejection Logic
// Purpose: Aggregate proposal votes and execute on-chain approval or rejection

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
import { BN } from "https://esm.sh/@coral-xyz/anchor@0.29.0";

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SOLANA_RPC_URL = Deno.env.get("SOLANA_RPC_URL") || "https://api.devnet.solana.com";
const PLATFORM_ADMIN_PRIVATE_KEY = Deno.env.get("PLATFORM_ADMIN_PRIVATE_KEY")!; // Base58 encoded

// Program IDs (from Story 1.7 ProposalSystem deployment)
const PROPOSAL_SYSTEM_PROGRAM_ID = new PublicKey(
  "Cmte6rbx9oScyN5QX3HZCGKpSHLu7PipP4U4V84K2mjh"
);

// Parameter Storage for threshold configuration
const PARAMETER_STORAGE_PROGRAM_ID = new PublicKey(
  "J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD"
);

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const connection = new Connection(SOLANA_RPC_URL, "confirmed");

// ============================================================================
// Types
// ============================================================================

interface FinalizeProposalVoteRequest {
  proposal_id: string; // PostgreSQL proposal_id (BIGINT as string)
}

interface FinalizeProposalVoteResponse {
  success: boolean;
  proposal_id: string;
  outcome: 'APPROVED' | 'REJECTED';
  yes_weight: number;
  no_weight: number;
  total_votes: number;
  yes_percentage: number;
  threshold_met: boolean;
  transaction_signature?: string;
  market_id?: number; // If approved, market ID created
  refund_amount?: number; // If rejected, 50% bond refund
  error?: string;
}

interface ProposalData {
  proposal_id: string;
  on_chain_proposal_id: number; // Solana program proposal ID
  creator_wallet: string;
  status: string;
  voting_start: string | null;
  voting_end: string | null;
  bond_amount: number;
  bond_tier: string;
}

interface ProposalVoteData {
  proposal_id: string;
  voter_wallet: string;
  vote_choice: 'YES' | 'NO';
  vote_weight: number;
  timestamp: string;
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  try {
    const { proposal_id } = await req.json() as FinalizeProposalVoteRequest;

    // Step 1: Validate request
    if (!proposal_id) {
      return new Response(
        JSON.stringify({ success: false, error: "proposal_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 2: Fetch proposal from database
    const proposal = await fetchProposal(proposal_id);
    if (!proposal) {
      return new Response(
        JSON.stringify({ success: false, error: "Proposal not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 3: Validate proposal state
    const stateError = validateProposalState(proposal);
    if (stateError) {
      return new Response(
        JSON.stringify({ success: false, error: stateError }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 4: Check if already finalized (idempotency)
    if (proposal.status === 'APPROVED' || proposal.status === 'REJECTED') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Proposal already finalized with status: ${proposal.status}`,
          existing_outcome: proposal.status,
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 5: Fetch and aggregate votes
    const votes = await fetchProposalVotes(proposal_id);
    const aggregation = aggregateProposalVotes(votes);

    // Step 6: Determine approval threshold (≥60% YES)
    const APPROVAL_THRESHOLD = 60; // Configurable via ParameterStorage in future
    const threshold_met = aggregation.yes_percentage >= APPROVAL_THRESHOLD;
    const outcome = threshold_met ? 'APPROVED' as const : 'REJECTED' as const;

    // Step 7: Execute on-chain instruction
    let txResult;
    if (outcome === 'APPROVED') {
      txResult = await executeApproveProposal(proposal);
    } else {
      txResult = await executeRejectProposal(proposal);
    }

    // Step 8: Update database (event listener will sync from on-chain events)
    await updateProposalStatus(proposal_id, outcome);

    // Step 9: Return success response
    const response: FinalizeProposalVoteResponse = {
      success: true,
      proposal_id,
      outcome,
      yes_weight: aggregation.yes_weight,
      no_weight: aggregation.no_weight,
      total_votes: votes.length,
      yes_percentage: aggregation.yes_percentage,
      threshold_met,
      transaction_signature: txResult.signature,
      ...(outcome === 'APPROVED' && txResult.market_id ? { market_id: txResult.market_id } : {}),
      ...(outcome === 'REJECTED' && txResult.refund_amount ? { refund_amount: txResult.refund_amount } : {}),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Finalize proposal vote error:", error);

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

async function fetchProposal(proposalId: string): Promise<ProposalData | null> {
  const { data, error } = await supabase
    .from("proposals")
    .select(`
      proposal_id,
      on_chain_proposal_id,
      creator_wallet,
      status,
      voting_start,
      voting_end,
      bond_amount,
      bond_tier
    `)
    .eq("proposal_id", proposalId)
    .single();

  if (error) {
    console.error("Fetch proposal error:", error);
    return null;
  }

  return data as ProposalData;
}

async function fetchProposalVotes(proposalId: string): Promise<ProposalVoteData[]> {
  const { data, error } = await supabase
    .from("proposal_votes")
    .select("proposal_id, voter_wallet, vote_choice, vote_weight, timestamp")
    .eq("proposal_id", proposalId)
    .order("timestamp", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch proposal votes: ${error.message}`);
  }

  return data as ProposalVoteData[];
}

async function updateProposalStatus(
  proposalId: string,
  outcome: 'APPROVED' | 'REJECTED'
): Promise<void> {
  const { error } = await supabase
    .from("proposals")
    .update({
      status: outcome,
      finalized_at: new Date().toISOString(),
    })
    .eq("proposal_id", proposalId);

  if (error) {
    console.error("Update proposal status error:", error);
    // Non-fatal: event listener will sync from on-chain
  }
}

// ============================================================================
// Validation Functions
// ============================================================================

function validateProposalState(proposal: ProposalData): string | null {
  // Check status
  if (proposal.status !== 'VOTING' && proposal.status !== 'VOTE_COMPLETE') {
    return `Proposal is not ready for finalization (status: ${proposal.status})`;
  }

  // Check voting period ended
  if (proposal.voting_end) {
    const now = new Date();
    const votingEnd = new Date(proposal.voting_end);
    if (now < votingEnd) {
      return `Voting period not ended yet (ends: ${proposal.voting_end})`;
    }
  }

  return null;
}

// ============================================================================
// Vote Aggregation Logic
// ============================================================================

function aggregateProposalVotes(votes: ProposalVoteData[]): {
  yes_weight: number;
  no_weight: number;
  yes_percentage: number;
} {
  // Handle edge case: no votes
  if (votes.length === 0) {
    return {
      yes_weight: 0,
      no_weight: 0,
      yes_percentage: 0, // 0% YES = REJECTED
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

  // Calculate YES percentage
  const total_weight = yes_weight + no_weight;
  const yes_percentage = total_weight > 0
    ? (yes_weight / total_weight) * 100
    : 0;

  return {
    yes_weight,
    no_weight,
    yes_percentage,
  };
}

// ============================================================================
// Solana Transaction Functions
// ============================================================================

async function executeApproveProposal(proposal: ProposalData): Promise<{
  signature: string;
  market_id?: number;
}> {
  console.log(`Executing approve_proposal for proposal ${proposal.on_chain_proposal_id}`);

  // Decode admin keypair
  const adminKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(PLATFORM_ADMIN_PRIVATE_KEY))
  );

  // Derive Proposal PDA
  const [proposalPubkey] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("proposal"),
      new BN(proposal.on_chain_proposal_id).toArrayLike(Buffer, "le", 8),
    ],
    PROPOSAL_SYSTEM_PROGRAM_ID
  );

  // Build instruction data for approve_proposal
  // Instruction discriminator for approve_proposal (index 2 in program)
  const instructionData = Buffer.from([0x02]);

  // Build transaction
  const transaction = new Transaction().add({
    keys: [
      { pubkey: proposalPubkey, isSigner: false, isWritable: true },
      { pubkey: adminKeypair.publicKey, isSigner: true, isWritable: false },
    ],
    programId: PROPOSAL_SYSTEM_PROGRAM_ID,
    data: instructionData,
  });

  // Send and confirm transaction
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [adminKeypair],
    { commitment: "confirmed" }
  );

  console.log(`Proposal approved on-chain: ${signature}`);
  console.log(`Proposal PDA: ${proposalPubkey.toString()}`);

  // Note: Story 2.5 AC says "creates market in CoreMarkets"
  // However, Epic 1 Story 1.7 notes indicate CPI to CoreMarkets is deferred
  // Market creation will be handled separately or in later story
  // For now, we just approve the proposal

  return {
    signature,
    // market_id will be assigned when CoreMarkets CPI is implemented
  };
}

async function executeRejectProposal(proposal: ProposalData): Promise<{
  signature: string;
  refund_amount: number;
}> {
  console.log(`Executing reject_proposal for proposal ${proposal.on_chain_proposal_id}`);

  // Decode admin keypair
  const adminKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(PLATFORM_ADMIN_PRIVATE_KEY))
  );

  // Derive Proposal PDA
  const [proposalPubkey] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("proposal"),
      new BN(proposal.on_chain_proposal_id).toArrayLike(Buffer, "le", 8),
    ],
    PROPOSAL_SYSTEM_PROGRAM_ID
  );

  // Creator public key (receives 50% refund)
  const creatorPubkey = new PublicKey(proposal.creator_wallet);

  // Build instruction data for reject_proposal
  // Instruction discriminator for reject_proposal (index 3 in program)
  const instructionData = Buffer.from([0x03]);

  // Build transaction
  const transaction = new Transaction().add({
    keys: [
      { pubkey: proposalPubkey, isSigner: false, isWritable: true },
      { pubkey: creatorPubkey, isSigner: false, isWritable: true }, // Receives 50% refund
      { pubkey: adminKeypair.publicKey, isSigner: true, isWritable: false },
    ],
    programId: PROPOSAL_SYSTEM_PROGRAM_ID,
    data: instructionData,
  });

  // Send and confirm transaction
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [adminKeypair],
    { commitment: "confirmed" }
  );

  // Calculate 50% refund amount
  const refund_amount = proposal.bond_amount / 2;

  console.log(`Proposal rejected on-chain: ${signature}`);
  console.log(`50% refund (${refund_amount} lamports) sent to creator`);

  return {
    signature,
    refund_amount,
  };
}

// ============================================================================
// Edge Cases Handled
// ============================================================================
// 1. No votes: yes_percentage = 0% → REJECTED
// 2. Exactly 60% YES: threshold_met = true → APPROVED
// 3. Tie (50/50): yes_percentage = 50% → REJECTED (<60%)
// 4. Already finalized: Returns 409 conflict error (idempotency)
// 5. Voting not ended: Returns 409 conflict error
// 6. Proposal tax: Already collected at creation (Story 1.7), never refunded
// 7. Creator bond refund: 100% on approval, 50% on rejection (in on-chain program)
