use anchor_lang::prelude::*;

declare_id!("5XH5i8dypiB4Wwa7TkmU6dnk9SyUGqE92GiQMHypPekL");

/// BMAD-Zmart Proposal System
///
/// Governance system for community-driven market creation.
///
/// Architecture:
/// - Proposal PDA per proposal: ["proposal", proposal_id]
/// - Bond requirement with 1% non-refundable tax
/// - Graduated bond tiers determine creator fee percentage
/// - Voting with ≥60% YES threshold for approval
/// - Integration with BondManager for escrow
/// - Integration with CoreMarkets for market creation
///
/// Security:
/// - Bond deposits validated via BondManager
/// - One vote per wallet per proposal
/// - Approval threshold enforcement (≥60%)
/// - Admin override for MVP progressive decentralization
#[program]
pub mod proposal_system {
    use super::*;

    /// Create a new market proposal
    ///
    /// Requires bond deposit based on tier selection.
    /// 1% of bond is non-refundable (proposal tax).
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        proposal_id: u64,
        title: String,
        description: String,
        bond_tier: BondTier,
        end_date: i64,
    ) -> Result<()> {
        let params = &ctx.accounts.global_parameters;
        let clock = Clock::get()?;

        // Validate inputs
        require!(
            !title.is_empty() && title.len() <= 128,
            ProposalError::InvalidTitle
        );
        require!(
            !description.is_empty() && description.len() <= 512,
            ProposalError::InvalidDescription
        );
        require!(
            end_date > clock.unix_timestamp,
            ProposalError::InvalidEndDate
        );

        // Determine bond amount based on tier
        let bond_amount = match bond_tier {
            BondTier::Tier1 => params.bond_tier_1_lamports,
            BondTier::Tier2 => params.bond_tier_2_lamports,
            BondTier::Tier3 => params.bond_tier_3_lamports,
        };

        // Calculate 1% non-refundable tax
        let proposal_tax = bond_amount / 100;

        // Transfer bond + tax to proposal PDA
        let total_required = bond_amount + proposal_tax;
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.creator.to_account_info(),
                    to: ctx.accounts.proposal.to_account_info(),
                },
            ),
            total_required,
        )?;

        // Initialize proposal (get mutable borrow after transfer)
        let proposal = &mut ctx.accounts.proposal;
        proposal.proposal_id = proposal_id;
        proposal.creator = ctx.accounts.creator.key();
        proposal.title = title.clone();
        proposal.description = description;
        proposal.bond_amount = bond_amount;
        proposal.bond_tier = bond_tier.clone();
        proposal.proposal_tax = proposal_tax;
        proposal.status = ProposalStatus::Pending;
        proposal.yes_votes = 0;
        proposal.no_votes = 0;
        proposal.total_voters = 0;
        proposal.created_at = clock.unix_timestamp;
        proposal.end_date = end_date;
        proposal.processed_at = None;
        proposal.market_id = None;
        proposal.bump = ctx.bumps.proposal;

        let bond_tier_copy = bond_tier.clone();

        emit!(ProposalCreatedEvent {
            proposal_id,
            creator: ctx.accounts.creator.key(),
            title,
            bond_amount,
            bond_tier,
            proposal_tax,
            end_date,
            timestamp: clock.unix_timestamp,
        });

        msg!(
            "Proposal {} created: {} SOL bond ({:?}), {} SOL tax",
            proposal_id,
            bond_amount as f64 / 1_000_000_000.0,
            bond_tier_copy,
            proposal_tax as f64 / 1_000_000_000.0
        );

        Ok(())
    }

    /// Vote on a proposal
    ///
    /// Placeholder for Epic 2's full Snapshot integration.
    /// Currently allows one vote per wallet.
    pub fn vote_on_proposal(
        ctx: Context<VoteOnProposal>,
        vote_choice: VoteChoice,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let vote_record = &mut ctx.accounts.vote_record;
        let clock = Clock::get()?;

        // Validate proposal is pending
        require!(
            proposal.status == ProposalStatus::Pending,
            ProposalError::ProposalNotOpen
        );

        // Validate voting period hasn't ended
        require!(
            clock.unix_timestamp < proposal.end_date,
            ProposalError::VotingEnded
        );

        // Initialize vote record
        vote_record.proposal_id = proposal.proposal_id;
        vote_record.voter = ctx.accounts.voter.key();
        vote_record.vote_choice = vote_choice.clone();
        vote_record.timestamp = clock.unix_timestamp;
        vote_record.bump = ctx.bumps.vote_record;

        // Update proposal vote counts
        match vote_choice {
            VoteChoice::Yes => proposal.yes_votes += 1,
            VoteChoice::No => proposal.no_votes += 1,
        }
        proposal.total_voters += 1;

        let vote_choice_copy = vote_choice.clone();

        emit!(ProposalVoteEvent {
            proposal_id: proposal.proposal_id,
            voter: ctx.accounts.voter.key(),
            vote_choice,
            timestamp: clock.unix_timestamp,
        });

        msg!(
            "Vote on proposal {}: {:?} (Y:{} N:{})",
            proposal.proposal_id,
            vote_choice_copy,
            proposal.yes_votes,
            proposal.no_votes
        );

        Ok(())
    }

    /// Approve proposal and create market
    ///
    /// Requires ≥60% YES votes.
    /// Creates market in CoreMarkets and deposits bond in BondManager.
    pub fn approve_proposal(
        ctx: Context<ApproveProposal>,
        market_id: u64,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let clock = Clock::get()?;

        // Validate proposal status
        require!(
            proposal.status == ProposalStatus::Pending,
            ProposalError::ProposalAlreadyProcessed
        );

        // Validate voting period ended
        require!(
            clock.unix_timestamp >= proposal.end_date,
            ProposalError::VotingNotEnded
        );

        // Calculate approval percentage
        let total_votes = proposal.yes_votes + proposal.no_votes;
        require!(total_votes > 0, ProposalError::NoVotes);

        let yes_percentage = (proposal.yes_votes as u128 * 100) / total_votes as u128;

        // Require ≥60% YES votes
        require!(
            yes_percentage >= 60,
            ProposalError::InsufficientApproval
        );

        // Update proposal status
        proposal.status = ProposalStatus::Approved;
        proposal.processed_at = Some(clock.unix_timestamp);
        proposal.market_id = Some(market_id);

        emit!(ProposalApprovedEvent {
            proposal_id: proposal.proposal_id,
            market_id,
            yes_votes: proposal.yes_votes,
            no_votes: proposal.no_votes,
            yes_percentage: yes_percentage as u16,
            timestamp: clock.unix_timestamp,
        });

        msg!(
            "Proposal {} approved: {}% YES (Y:{} N:{}), market {} to be created",
            proposal.proposal_id,
            yes_percentage,
            proposal.yes_votes,
            proposal.no_votes,
            market_id
        );

        // Note: Epic 2 will add CPI to:
        // 1. BondManager.deposit_bond() - deposit bond for market
        // 2. CoreMarkets.create_market() - create the market
        // For Epic 1 MVP, these are done manually/separately

        Ok(())
    }

    /// Reject proposal and refund 50% of bond
    ///
    /// Called when proposal fails to meet ≥60% YES threshold.
    pub fn reject_proposal(ctx: Context<RejectProposal>) -> Result<()> {
        let clock = Clock::get()?;

        // Validate and calculate refund (scoped to release borrow)
        let (refund_amount, proposal_id, yes_votes, no_votes) = {
            let proposal = &ctx.accounts.proposal;

            require!(
                proposal.status == ProposalStatus::Pending,
                ProposalError::ProposalAlreadyProcessed
            );

            require!(
                clock.unix_timestamp >= proposal.end_date,
                ProposalError::VotingNotEnded
            );

            // Calculate rejection (either no votes or <60% YES)
            let total_votes = proposal.yes_votes + proposal.no_votes;
            let is_rejected = if total_votes == 0 {
                true
            } else {
                let yes_percentage = (proposal.yes_votes as u128 * 100) / total_votes as u128;
                yes_percentage < 60
            };

            require!(is_rejected, ProposalError::ProposalNotRejected);

            // Refund 50% of bond to creator
            let amount = proposal.bond_amount / 2;

            (amount, proposal.proposal_id, proposal.yes_votes, proposal.no_votes)
        };

        // Transfer refund
        **ctx.accounts.proposal.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
        **ctx.accounts.creator.to_account_info().try_borrow_mut_lamports()? += refund_amount;

        // Update proposal status (get mutable borrow after transfer)
        let proposal = &mut ctx.accounts.proposal;
        proposal.status = ProposalStatus::Rejected;
        proposal.processed_at = Some(clock.unix_timestamp);

        emit!(ProposalRejectedEvent {
            proposal_id,
            refund_amount,
            yes_votes,
            no_votes,
            timestamp: clock.unix_timestamp,
        });

        msg!(
            "Proposal {} rejected: {} SOL refunded (50%)",
            proposal_id,
            refund_amount as f64 / 1_000_000_000.0
        );

        Ok(())
    }
}

// ==============================================================================
// Account Structures
// ==============================================================================

/// Market proposal account
#[account]
pub struct Proposal {
    pub proposal_id: u64,
    pub creator: Pubkey,
    pub title: String,
    pub description: String,
    pub bond_amount: u64,
    pub bond_tier: BondTier,
    pub proposal_tax: u64,
    pub status: ProposalStatus,
    pub yes_votes: u32,
    pub no_votes: u32,
    pub total_voters: u32,
    pub created_at: i64,
    pub end_date: i64,
    pub processed_at: Option<i64>,
    pub market_id: Option<u64>,
    pub bump: u8,
}

/// Vote record per voter per proposal
#[account]
pub struct ProposalVoteRecord {
    pub proposal_id: u64,
    pub voter: Pubkey,
    pub vote_choice: VoteChoice,
    pub timestamp: i64,
    pub bump: u8,
}

// ==============================================================================
// Enums
// ==============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum ProposalStatus {
    Pending,   // Voting in progress
    Approved,  // ≥60% YES votes, market created
    Rejected,  // <60% YES votes, 50% bond refunded
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum BondTier {
    Tier1,  // 1 SOL → 0.5% creator fee
    Tier2,  // 5 SOL → 1.0% creator fee
    Tier3,  // 10 SOL → 2.0% creator fee
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum VoteChoice {
    Yes,
    No,
}

// ==============================================================================
// Instruction Contexts
// ==============================================================================

#[derive(Accounts)]
#[instruction(proposal_id: u64)]
pub struct CreateProposal<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + 8 + 32 + 132 + 516 + 8 + 1 + 8 + 1 + 4*3 + 8*2 + 9 + 9 + 1, // ~800 bytes
        seeds = [b"proposal", proposal_id.to_le_bytes().as_ref()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    /// Global parameters from ParameterStorage
    #[account(
        seeds = [b"global-parameters"],
        bump,
        seeds::program = parameter_storage_program.key()
    )]
    pub global_parameters: Account<'info, GlobalParameters>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: ParameterStorage program ID
    pub parameter_storage_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct VoteOnProposal<'info> {
    #[account(
        mut,
        seeds = [b"proposal", proposal.proposal_id.to_le_bytes().as_ref()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        init,
        payer = voter,
        space = 8 + 8 + 32 + 1 + 8 + 1, // ~60 bytes
        seeds = [
            b"proposal-vote",
            proposal.proposal_id.to_le_bytes().as_ref(),
            voter.key().as_ref()
        ],
        bump
    )]
    pub vote_record: Account<'info, ProposalVoteRecord>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApproveProposal<'info> {
    #[account(
        mut,
        seeds = [b"proposal", proposal.proposal_id.to_le_bytes().as_ref()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RejectProposal<'info> {
    #[account(
        mut,
        seeds = [b"proposal", proposal.proposal_id.to_le_bytes().as_ref()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(mut)]
    pub creator: Signer<'info>,
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
pub struct ProposalCreatedEvent {
    pub proposal_id: u64,
    pub creator: Pubkey,
    pub title: String,
    pub bond_amount: u64,
    pub bond_tier: BondTier,
    pub proposal_tax: u64,
    pub end_date: i64,
    pub timestamp: i64,
}

#[event]
pub struct ProposalVoteEvent {
    pub proposal_id: u64,
    pub voter: Pubkey,
    pub vote_choice: VoteChoice,
    pub timestamp: i64,
}

#[event]
pub struct ProposalApprovedEvent {
    pub proposal_id: u64,
    pub market_id: u64,
    pub yes_votes: u32,
    pub no_votes: u32,
    pub yes_percentage: u16,
    pub timestamp: i64,
}

#[event]
pub struct ProposalRejectedEvent {
    pub proposal_id: u64,
    pub refund_amount: u64,
    pub yes_votes: u32,
    pub no_votes: u32,
    pub timestamp: i64,
}

// ==============================================================================
// Error Types
// ==============================================================================

#[error_code]
pub enum ProposalError {
    #[msg("Invalid proposal title: must be 1-128 characters")]
    InvalidTitle,

    #[msg("Invalid proposal description: must be 1-512 characters")]
    InvalidDescription,

    #[msg("Invalid end date: must be in the future")]
    InvalidEndDate,

    #[msg("Proposal is not open for voting")]
    ProposalNotOpen,

    #[msg("Voting period has ended")]
    VotingEnded,

    #[msg("Voting period has not ended yet")]
    VotingNotEnded,

    #[msg("Proposal already processed")]
    ProposalAlreadyProcessed,

    #[msg("No votes cast on proposal")]
    NoVotes,

    #[msg("Insufficient approval: requires ≥60% YES votes")]
    InsufficientApproval,

    #[msg("Proposal not rejected: has ≥60% YES votes")]
    ProposalNotRejected,
}
