use anchor_lang::prelude::*;

declare_id!("Hcxxt6W1HmKQmnUvqpgzNEqVG611Yzt2i4DUvwvkLRf2");

/// BMAD-Zmart Market Resolution
///
/// Community voting system for determining market outcomes.
///
/// Architecture:
/// - VoteRecord per voter per market: ["vote-record", market_id, voter]
/// - ResolutionState per market: ["resolution-state", market_id]
/// - 48-hour dispute window enforcement
/// - Vote aggregation and outcome determination
/// - Admin override for progressive decentralization (Epic 1)
///
/// Security:
/// - One vote per wallet per market
/// - Dispute window validation
/// - Admin-only override during MVP phase
/// - Cross-program resolution of CoreMarkets
#[program]
pub mod market_resolution {
    use super::*;

    /// Submit a vote on market outcome
    ///
    /// Each wallet can vote once per market. Epic 2 adds weighted voting.
    pub fn submit_vote(
        ctx: Context<SubmitVote>,
        vote_choice: VoteChoice,
        vote_weight: u64,
    ) -> Result<()> {
        let vote_record = &mut ctx.accounts.vote_record;
        let resolution_state = &mut ctx.accounts.resolution_state;
        let clock = Clock::get()?;

        // Validate market hasn't been finalized
        require!(
            !resolution_state.is_finalized,
            ResolutionError::MarketAlreadyFinalized
        );

        // Initialize vote record
        vote_record.market_id = resolution_state.market_id;
        vote_record.voter = ctx.accounts.voter.key();
        vote_record.vote_choice = vote_choice.clone();
        vote_record.vote_weight = vote_weight;
        vote_record.timestamp = clock.unix_timestamp;
        vote_record.bump = ctx.bumps.vote_record;

        // Update resolution state vote counts
        match vote_choice {
            VoteChoice::Yes => resolution_state.yes_votes += vote_weight,
            VoteChoice::No => resolution_state.no_votes += vote_weight,
            VoteChoice::Cancel => resolution_state.cancel_votes += vote_weight,
        }

        resolution_state.total_voters += 1;

        emit!(VoteSubmittedEvent {
            market_id: resolution_state.market_id,
            voter: ctx.accounts.voter.key(),
            vote_choice,
            vote_weight,
            timestamp: clock.unix_timestamp,
        });

        msg!(
            "Vote submitted: {:?} with weight {} for market {}",
            vote_record.vote_choice,
            vote_weight,
            resolution_state.market_id
        );

        Ok(())
    }

    /// Initialize resolution state for a market
    ///
    /// Called when market ends and voting period begins.
    pub fn initialize_resolution(
        ctx: Context<InitializeResolution>,
        market_id: u64,
    ) -> Result<()> {
        let resolution_state = &mut ctx.accounts.resolution_state;
        let params = &ctx.accounts.global_parameters;
        let clock = Clock::get()?;

        // Initialize resolution state
        resolution_state.market_id = market_id;
        resolution_state.yes_votes = 0;
        resolution_state.no_votes = 0;
        resolution_state.cancel_votes = 0;
        resolution_state.total_voters = 0;
        resolution_state.is_finalized = false;
        resolution_state.outcome = None;
        resolution_state.voting_started_at = clock.unix_timestamp;
        resolution_state.dispute_window_ends_at =
            clock.unix_timestamp + params.dispute_window_seconds;
        resolution_state.finalized_at = None;
        resolution_state.bump = ctx.bumps.resolution_state;

        emit!(ResolutionInitializedEvent {
            market_id,
            voting_started_at: clock.unix_timestamp,
            dispute_window_ends_at: resolution_state.dispute_window_ends_at,
        });

        msg!("Resolution initialized for market {}", market_id);

        Ok(())
    }

    /// Finalize market resolution
    ///
    /// Aggregates votes and determines outcome after dispute window.
    pub fn finalize_resolution(ctx: Context<FinalizeResolution>) -> Result<()> {
        let resolution_state = &mut ctx.accounts.resolution_state;
        let clock = Clock::get()?;

        // Validate not already finalized
        require!(
            !resolution_state.is_finalized,
            ResolutionError::MarketAlreadyFinalized
        );

        // Validate dispute window has passed
        require!(
            clock.unix_timestamp >= resolution_state.dispute_window_ends_at,
            ResolutionError::DisputeWindowNotEnded
        );

        // Determine outcome by majority vote
        let outcome = determine_outcome(
            resolution_state.yes_votes,
            resolution_state.no_votes,
            resolution_state.cancel_votes,
        );

        // Update resolution state
        resolution_state.is_finalized = true;
        resolution_state.outcome = Some(outcome.clone());
        resolution_state.finalized_at = Some(clock.unix_timestamp);

        emit!(ResolutionFinalizedEvent {
            market_id: resolution_state.market_id,
            outcome: outcome.clone(),
            yes_votes: resolution_state.yes_votes,
            no_votes: resolution_state.no_votes,
            cancel_votes: resolution_state.cancel_votes,
            total_voters: resolution_state.total_voters,
            timestamp: clock.unix_timestamp,
        });

        msg!(
            "Market {} finalized: {:?} (Y:{} N:{} C:{})",
            resolution_state.market_id,
            outcome,
            resolution_state.yes_votes,
            resolution_state.no_votes,
            resolution_state.cancel_votes
        );

        Ok(())
    }

    /// Admin override resolution
    ///
    /// Progressive decentralization: admin can override during Epic 1 MVP.
    /// Epic 2 removes this and fully decentralizes to community voting.
    pub fn admin_override_resolution(
        ctx: Context<AdminOverrideResolution>,
        outcome: VoteChoice,
    ) -> Result<()> {
        let resolution_state = &mut ctx.accounts.resolution_state;
        let params = &ctx.accounts.global_parameters;
        let clock = Clock::get()?;

        // Validate admin authority
        require!(
            ctx.accounts.admin.key() == params.authority,
            ResolutionError::Unauthorized
        );

        // Override outcome
        resolution_state.is_finalized = true;
        resolution_state.outcome = Some(outcome.clone());
        resolution_state.finalized_at = Some(clock.unix_timestamp);

        emit!(AdminOverrideEvent {
            market_id: resolution_state.market_id,
            admin: ctx.accounts.admin.key(),
            outcome: outcome.clone(),
            timestamp: clock.unix_timestamp,
        });

        msg!(
            "Admin override for market {}: {:?}",
            resolution_state.market_id,
            outcome
        );

        Ok(())
    }

    /// Post aggregated vote result (Snapshot-style voting - Story 2.3)
    ///
    /// Epic 2 Snapshot-style voting:
    /// - Users vote off-chain (gas-free) with signed messages
    /// - Platform aggregates votes in PostgreSQL
    /// - This instruction posts final aggregated result on-chain
    /// - Includes Merkle root for cryptographic verification
    pub fn post_vote_result(
        ctx: Context<PostVoteResult>,
        data: PostVoteResultData,
    ) -> Result<()> {
        let vote_result = &mut ctx.accounts.vote_result;
        let params = &ctx.accounts.global_parameters;
        let clock = Clock::get()?;

        // Validate admin authority (platform posts aggregated results)
        require!(
            ctx.accounts.authority.key() == params.authority,
            ResolutionError::Unauthorized
        );

        // Initialize VoteResult account
        vote_result.market_id = data.market_id;
        vote_result.outcome = data.outcome.clone();
        vote_result.yes_vote_weight = data.yes_vote_weight;
        vote_result.no_vote_weight = data.no_vote_weight;
        vote_result.total_votes_count = data.total_votes_count;
        vote_result.merkle_root = data.merkle_root;
        vote_result.posted_at = clock.unix_timestamp;
        vote_result.posted_by = ctx.accounts.authority.key();
        vote_result.dispute_window_end = clock.unix_timestamp + params.dispute_window_seconds;
        vote_result.bump = ctx.bumps.vote_result;

        emit!(VoteResultPostedEvent {
            market_id: vote_result.market_id,
            outcome: vote_result.outcome.clone(),
            yes_vote_weight: vote_result.yes_vote_weight,
            no_vote_weight: vote_result.no_vote_weight,
            total_votes_count: vote_result.total_votes_count,
            merkle_root: vote_result.merkle_root,
            dispute_window_end: vote_result.dispute_window_end,
            timestamp: clock.unix_timestamp,
        });

        msg!(
            "Vote result posted for market {}: {:?} (YES:{} NO:{} Total:{})",
            vote_result.market_id,
            vote_result.outcome,
            vote_result.yes_vote_weight,
            vote_result.no_vote_weight,
            vote_result.total_votes_count
        );

        Ok(())
    }
}

// ==============================================================================
// Helper Functions
// ==============================================================================

/// Determine outcome by majority vote
fn determine_outcome(yes_votes: u64, no_votes: u64, cancel_votes: u64) -> VoteChoice {
    if cancel_votes > yes_votes && cancel_votes > no_votes {
        VoteChoice::Cancel
    } else if yes_votes > no_votes {
        VoteChoice::Yes
    } else if no_votes > yes_votes {
        VoteChoice::No
    } else {
        // Tie: default to Cancel
        VoteChoice::Cancel
    }
}

// ==============================================================================
// Account Structures
// ==============================================================================

/// Individual vote record per voter per market
#[account]
pub struct VoteRecord {
    pub market_id: u64,
    pub voter: Pubkey,
    pub vote_choice: VoteChoice,
    pub vote_weight: u64,
    pub timestamp: i64,
    pub bump: u8,
}

/// Resolution state per market
#[account]
pub struct ResolutionState {
    pub market_id: u64,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub cancel_votes: u64,
    pub total_voters: u32,
    pub is_finalized: bool,
    pub outcome: Option<VoteChoice>,
    pub voting_started_at: i64,
    pub dispute_window_ends_at: i64,
    pub finalized_at: Option<i64>,
    pub bump: u8,
}

/// Vote result from Snapshot-style off-chain voting (Story 2.3)
///
/// Stores aggregated vote result posted on-chain after off-chain voting.
/// Includes Merkle root for cryptographic verification.
#[account]
pub struct VoteResult {
    pub market_id: u64,           // Reference to market
    pub outcome: VoteChoice,       // Final outcome (YES/NO/TIE)
    pub yes_vote_weight: u64,      // Total YES vote weight
    pub no_vote_weight: u64,       // Total NO vote weight
    pub total_votes_count: u32,    // Number of unique voters
    pub merkle_root: [u8; 32],     // Merkle root of all votes
    pub posted_at: i64,            // Timestamp when result posted
    pub posted_by: Pubkey,         // Platform admin who posted
    pub dispute_window_end: i64,   // When disputes close (48h)
    pub bump: u8,                  // PDA bump seed
}

impl VoteResult {
    pub const LEN: usize = 8 + // discriminator
        8 + // market_id
        1 + // outcome (enum)
        8 + // yes_vote_weight
        8 + // no_vote_weight
        4 + // total_votes_count
        32 + // merkle_root
        8 + // posted_at
        32 + // posted_by
        8 + // dispute_window_end
        1; // bump
}

// ==============================================================================
// Instruction Data Structures
// ==============================================================================

/// Data for post_vote_result instruction (Story 2.3)
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PostVoteResultData {
    pub market_id: u64,
    pub outcome: VoteChoice,
    pub yes_vote_weight: u64,
    pub no_vote_weight: u64,
    pub total_votes_count: u32,
    pub merkle_root: [u8; 32],
}

// ==============================================================================
// Enums
// ==============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum VoteChoice {
    Yes,
    No,
    Cancel,
}

// ==============================================================================
// Instruction Contexts
// ==============================================================================

#[derive(Accounts)]
pub struct SubmitVote<'info> {
    #[account(
        init,
        payer = voter,
        space = 8 + 8 + 32 + 1 + 8 + 8 + 1, // ~70 bytes
        seeds = [
            b"vote-record",
            resolution_state.market_id.to_le_bytes().as_ref(),
            voter.key().as_ref()
        ],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(
        mut,
        seeds = [b"resolution-state", resolution_state.market_id.to_le_bytes().as_ref()],
        bump = resolution_state.bump
    )]
    pub resolution_state: Account<'info, ResolutionState>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct InitializeResolution<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 8 + 8*3 + 4 + 1 + 33 + 8*2 + 9 + 1, // ~100 bytes
        seeds = [b"resolution-state", market_id.to_le_bytes().as_ref()],
        bump
    )]
    pub resolution_state: Account<'info, ResolutionState>,

    /// Global parameters from ParameterStorage
    #[account(
        seeds = [b"global-parameters"],
        bump,
        seeds::program = parameter_storage_program.key()
    )]
    pub global_parameters: Account<'info, GlobalParameters>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: ParameterStorage program ID
    pub parameter_storage_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct FinalizeResolution<'info> {
    #[account(
        mut,
        seeds = [b"resolution-state", resolution_state.market_id.to_le_bytes().as_ref()],
        bump = resolution_state.bump
    )]
    pub resolution_state: Account<'info, ResolutionState>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminOverrideResolution<'info> {
    #[account(
        mut,
        seeds = [b"resolution-state", resolution_state.market_id.to_le_bytes().as_ref()],
        bump = resolution_state.bump
    )]
    pub resolution_state: Account<'info, ResolutionState>,

    /// Global parameters from ParameterStorage
    #[account(
        seeds = [b"global-parameters"],
        bump,
        seeds::program = parameter_storage_program.key()
    )]
    pub global_parameters: Account<'info, GlobalParameters>,

    pub admin: Signer<'info>,

    /// CHECK: ParameterStorage program ID
    pub parameter_storage_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(data: PostVoteResultData)]
pub struct PostVoteResult<'info> {
    /// VoteResult account (PDA)
    #[account(
        init,
        payer = authority,
        space = 8 + VoteResult::LEN,
        seeds = [b"vote-result", data.market_id.to_le_bytes().as_ref()],
        bump
    )]
    pub vote_result: Account<'info, VoteResult>,

    /// Global parameters from ParameterStorage
    #[account(
        seeds = [b"global-parameters"],
        bump,
        seeds::program = parameter_storage_program.key()
    )]
    pub global_parameters: Account<'info, GlobalParameters>,

    /// Platform admin authority (posts aggregated results)
    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: ParameterStorage program ID
    pub parameter_storage_program: AccountInfo<'info>,
}

// ==============================================================================
// External Account Structures (from ParameterStorage)
// ==============================================================================

#[account]
pub struct GlobalParameters {
    pub authority: Pubkey,
    pub creation_bond_lamports: u64,
    pub platform_fee_bps: u16,
    pub creator_fee_bps: u16,
    pub min_bet_lamports: u64,
    pub max_bet_lamports: u64,
    pub max_market_size_lamports: u64,
    pub min_duration_seconds: i64,
    pub max_duration_seconds: i64,
    pub dispute_window_seconds: i64,
    pub bond_tier_1_lamports: u64,
    pub bond_tier_2_lamports: u64,
    pub bond_tier_3_lamports: u64,
    pub update_cooldown_seconds: i64,
    pub max_change_bps: u16,
    pub last_updated: i64,
    pub cooldown_until: i64,
    pub version: u32,
    pub bump: u8,
}

// ==============================================================================
// Events
// ==============================================================================

#[event]
pub struct VoteSubmittedEvent {
    pub market_id: u64,
    pub voter: Pubkey,
    pub vote_choice: VoteChoice,
    pub vote_weight: u64,
    pub timestamp: i64,
}

#[event]
pub struct ResolutionInitializedEvent {
    pub market_id: u64,
    pub voting_started_at: i64,
    pub dispute_window_ends_at: i64,
}

#[event]
pub struct ResolutionFinalizedEvent {
    pub market_id: u64,
    pub outcome: VoteChoice,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub cancel_votes: u64,
    pub total_voters: u32,
    pub timestamp: i64,
}

#[event]
pub struct AdminOverrideEvent {
    pub market_id: u64,
    pub admin: Pubkey,
    pub outcome: VoteChoice,
    pub timestamp: i64,
}

#[event]
pub struct VoteResultPostedEvent {
    pub market_id: u64,
    pub outcome: VoteChoice,
    pub yes_vote_weight: u64,
    pub no_vote_weight: u64,
    pub total_votes_count: u32,
    pub merkle_root: [u8; 32],
    pub dispute_window_end: i64,
    pub timestamp: i64,
}

// ==============================================================================
// Error Types
// ==============================================================================

#[error_code]
pub enum ResolutionError {
    #[msg("Market resolution already finalized")]
    MarketAlreadyFinalized,

    #[msg("Dispute window has not ended yet")]
    DisputeWindowNotEnded,

    #[msg("Unauthorized: only admin can perform this action")]
    Unauthorized,
}
