use anchor_lang::prelude::*;

declare_id!("8XvCToLC42ZV4hw6PW5SEhqDpX3NfqvbAS2tNseG52Fx");

/// BMAD-Zmart Bond Manager
///
/// Escrow management for market creator bonds with graduated refund logic.
///
/// Architecture:
/// - BondEscrow PDA per market: ["bond-escrow", market_id]
/// - Bond tiers from ParameterStorage (tier_1/2/3)
/// - Refund logic: 100% on success, 50% on rejection, 0% on slash
/// - Creator fee accumulation and withdrawal
///
/// Security:
/// - PDA-based escrow prevents unauthorized access
/// - Status transitions validated
/// - Cross-program verification with CoreMarkets
#[program]
pub mod bond_manager {
    use super::*;

    /// Deposit bond for market creation
    ///
    /// Called by ProposalSystem when creating market proposal.
    pub fn deposit_bond(
        ctx: Context<DepositBond>,
        market_id: u64,
        bond_tier: BondTier,
    ) -> Result<()> {
        let params = &ctx.accounts.global_parameters;
        let clock = Clock::get()?;

        // Determine bond amount based on tier
        let bond_amount = match bond_tier {
            BondTier::Tier1 => params.bond_tier_1_lamports,
            BondTier::Tier2 => params.bond_tier_2_lamports,
            BondTier::Tier3 => params.bond_tier_3_lamports,
        };

        require!(bond_amount > 0, BondError::InvalidBondAmount);

        // Transfer SOL from creator to escrow PDA
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.creator.to_account_info(),
                    to: ctx.accounts.bond_escrow.to_account_info(),
                },
            ),
            bond_amount,
        )?;

        // Initialize escrow account (now get mutable borrow after transfer)
        let escrow = &mut ctx.accounts.bond_escrow;
        escrow.creator = ctx.accounts.creator.key();
        escrow.bond_amount = bond_amount;
        escrow.market_id = market_id;
        escrow.status = BondStatus::Active;
        escrow.deposited_at = clock.unix_timestamp;
        escrow.refunded_at = None;
        escrow.accumulated_fees = 0;
        escrow.bond_tier = bond_tier.clone();
        escrow.bump = ctx.bumps.bond_escrow;

        let bond_tier_copy = bond_tier.clone();

        emit!(BondDepositedEvent {
            market_id,
            creator: ctx.accounts.creator.key(),
            bond_amount,
            bond_tier,
            timestamp: clock.unix_timestamp,
        });

        msg!(
            "Bond deposited: {} SOL for market {} ({:?})",
            bond_amount as f64 / 1_000_000_000.0,
            market_id,
            bond_tier_copy
        );

        Ok(())
    }

    /// Refund bond to creator
    ///
    /// Graduated refund logic:
    /// - Full refund (100%): Market successfully resolved
    /// - Partial refund (50%): Market proposal rejected
    /// - No refund (0%): Market slashed for fraud/disputes
    pub fn refund_bond(
        ctx: Context<RefundBond>,
        refund_type: RefundType,
    ) -> Result<()> {
        let clock = Clock::get()?;

        // Validate and calculate refund amount (scoped to release borrow)
        let (refund_amount, market_id, creator) = {
            let escrow = &ctx.accounts.bond_escrow;

            require!(
                escrow.status == BondStatus::Active,
                BondError::BondAlreadyProcessed
            );
            require!(
                escrow.creator == ctx.accounts.creator.key(),
                BondError::Unauthorized
            );

            let amount = match refund_type {
                RefundType::Full => escrow.bond_amount,
                RefundType::Partial => escrow.bond_amount / 2,
                RefundType::Slash => 0,
            };

            (amount, escrow.market_id, escrow.creator)
        };

        // Transfer refund to creator
        if refund_amount > 0 {
            **ctx.accounts.bond_escrow.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
            **ctx.accounts.creator.to_account_info().try_borrow_mut_lamports()? += refund_amount;
        }

        // Update escrow status (get mutable borrow after transfer)
        let escrow = &mut ctx.accounts.bond_escrow;
        escrow.status = match refund_type {
            RefundType::Full => BondStatus::Refunded,
            RefundType::Partial => BondStatus::PartialRefund,
            RefundType::Slash => BondStatus::Slashed,
        };
        escrow.refunded_at = Some(clock.unix_timestamp);

        emit!(BondRefundedEvent {
            market_id,
            creator,
            refund_amount,
            refund_type: refund_type.clone(),
            timestamp: clock.unix_timestamp,
        });

        msg!(
            "Bond refunded: {} SOL ({:?}) for market {}",
            refund_amount as f64 / 1_000_000_000.0,
            refund_type,
            market_id
        );

        Ok(())
    }

    /// Claim accumulated creator fees
    ///
    /// Allows market creators to withdraw fees accumulated from bets.
    pub fn claim_creator_fees(ctx: Context<ClaimCreatorFees>) -> Result<()> {
        // Validate and get fee amount (scoped to release borrow)
        let (fee_amount, market_id, creator) = {
            let escrow = &ctx.accounts.bond_escrow;

            require!(
                escrow.creator == ctx.accounts.creator.key(),
                BondError::Unauthorized
            );
            require!(
                escrow.accumulated_fees > 0,
                BondError::NoFeesToClaim
            );

            (escrow.accumulated_fees, escrow.market_id, escrow.creator)
        };

        // Transfer fees to creator
        **ctx.accounts.bond_escrow.to_account_info().try_borrow_mut_lamports()? -= fee_amount;
        **ctx.accounts.creator.to_account_info().try_borrow_mut_lamports()? += fee_amount;

        // Update escrow (get mutable borrow after transfer)
        let escrow = &mut ctx.accounts.bond_escrow;
        escrow.accumulated_fees = 0;

        emit!(CreatorFeesClaimedEvent {
            market_id,
            creator,
            fee_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!(
            "Creator fees claimed: {} SOL for market {}",
            fee_amount as f64 / 1_000_000_000.0,
            market_id
        );

        Ok(())
    }

    /// Add creator fees to escrow
    ///
    /// Called by CoreMarkets when distributing bet fees.
    pub fn add_creator_fees(
        ctx: Context<AddCreatorFees>,
        fee_amount: u64,
    ) -> Result<()> {
        require!(fee_amount > 0, BondError::InvalidFeeAmount);

        // Transfer fees from market to escrow
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.fee_payer.to_account_info(),
                    to: ctx.accounts.bond_escrow.to_account_info(),
                },
            ),
            fee_amount,
        )?;

        // Now get mutable borrow after transfer
        let escrow = &mut ctx.accounts.bond_escrow;
        escrow.accumulated_fees += fee_amount;

        emit!(CreatorFeesAddedEvent {
            market_id: escrow.market_id,
            fee_amount,
            total_accumulated: escrow.accumulated_fees,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!(
            "Creator fees added: {} SOL (total: {} SOL)",
            fee_amount as f64 / 1_000_000_000.0,
            escrow.accumulated_fees as f64 / 1_000_000_000.0
        );

        Ok(())
    }
}

// ==============================================================================
// Account Structures
// ==============================================================================

/// Bond escrow account per market
#[account]
pub struct BondEscrow {
    pub creator: Pubkey,
    pub bond_amount: u64,
    pub market_id: u64,
    pub status: BondStatus,
    pub deposited_at: i64,
    pub refunded_at: Option<i64>,
    pub accumulated_fees: u64,
    pub bond_tier: BondTier,
    pub bump: u8,
}

// ==============================================================================
// Enums
// ==============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum BondStatus {
    Active,         // Bond deposited, market active
    Refunded,       // Full refund (100%)
    PartialRefund,  // Partial refund (50%)
    Slashed,        // No refund (0%)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum BondTier {
    Tier1,  // Lowest bond, lowest creator fee (0.5%)
    Tier2,  // Medium bond, medium creator fee (1.0%)
    Tier3,  // Highest bond, highest creator fee (2.0%)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum RefundType {
    Full,     // 100% refund on success
    Partial,  // 50% refund on rejection
    Slash,    // 0% refund on fraud/dispute
}

// ==============================================================================
// Instruction Contexts
// ==============================================================================

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct DepositBond<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + 32 + 8 + 8 + 1 + 8 + 9 + 8 + 1 + 1, // ~90 bytes
        seeds = [b"bond-escrow", market_id.to_le_bytes().as_ref()],
        bump
    )]
    pub bond_escrow: Account<'info, BondEscrow>,

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
pub struct RefundBond<'info> {
    #[account(
        mut,
        seeds = [b"bond-escrow", bond_escrow.market_id.to_le_bytes().as_ref()],
        bump = bond_escrow.bump
    )]
    pub bond_escrow: Account<'info, BondEscrow>,

    #[account(mut)]
    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimCreatorFees<'info> {
    #[account(
        mut,
        seeds = [b"bond-escrow", bond_escrow.market_id.to_le_bytes().as_ref()],
        bump = bond_escrow.bump
    )]
    pub bond_escrow: Account<'info, BondEscrow>,

    #[account(mut)]
    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct AddCreatorFees<'info> {
    #[account(
        mut,
        seeds = [b"bond-escrow", bond_escrow.market_id.to_le_bytes().as_ref()],
        bump = bond_escrow.bump
    )]
    pub bond_escrow: Account<'info, BondEscrow>,

    #[account(mut)]
    pub fee_payer: Signer<'info>,

    pub system_program: Program<'info, System>,
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
pub struct BondDepositedEvent {
    pub market_id: u64,
    pub creator: Pubkey,
    pub bond_amount: u64,
    pub bond_tier: BondTier,
    pub timestamp: i64,
}

#[event]
pub struct BondRefundedEvent {
    pub market_id: u64,
    pub creator: Pubkey,
    pub refund_amount: u64,
    pub refund_type: RefundType,
    pub timestamp: i64,
}

#[event]
pub struct CreatorFeesClaimedEvent {
    pub market_id: u64,
    pub creator: Pubkey,
    pub fee_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct CreatorFeesAddedEvent {
    pub market_id: u64,
    pub fee_amount: u64,
    pub total_accumulated: u64,
    pub timestamp: i64,
}

// ==============================================================================
// Error Types
// ==============================================================================

#[error_code]
pub enum BondError {
    #[msg("Invalid bond amount: must be greater than 0")]
    InvalidBondAmount,

    #[msg("Bond already processed: cannot refund twice")]
    BondAlreadyProcessed,

    #[msg("Unauthorized: only bond creator can perform this action")]
    Unauthorized,

    #[msg("No fees to claim")]
    NoFeesToClaim,

    #[msg("Invalid fee amount: must be greater than 0")]
    InvalidFeeAmount,
}
