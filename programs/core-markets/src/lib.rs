use anchor_lang::prelude::*;

declare_id!("6BBZWsJZq23k2NX3YnENgXTEPhbVEHXYmPxmamN83eEV");

/// BMAD-Zmart Core Markets
///
/// Central betting mechanics with fee distribution and odds calculation.
///
/// Architecture:
/// - Market accounts track liquidity pools (yes_pool, no_pool)
/// - UserBet accounts track individual positions
/// - Fees distributed: platform, creator, treasury
/// - Real-time odds: yes% = yes_pool / (yes_pool + no_pool)
#[program]
pub mod core_markets {
    use super::*;

    /// Create a new prediction market
    ///
    /// Admin-only for Epic 1. Epic 2 adds proposal governance.
    pub fn create_market(
        ctx: Context<CreateMarket>,
        market_id: u64,
        title: String,
        description: String,
        end_date: i64,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let clock = Clock::get()?;

        // Validate inputs
        require!(
            !title.is_empty() && title.len() <= 128,
            MarketError::InvalidTitle
        );
        require!(
            !description.is_empty() && description.len() <= 512,
            MarketError::InvalidDescription
        );
        require!(
            end_date > clock.unix_timestamp,
            MarketError::InvalidEndDate
        );

        // Initialize market
        market.market_id = market_id;
        market.creator = ctx.accounts.creator.key();
        market.title = title.clone();
        market.description = description;
        market.end_date = end_date;

        // Initial pools (empty)
        market.yes_pool = 0;
        market.no_pool = 0;
        market.total_volume = 0;

        // Fee tracking (initially zero)
        market.total_platform_fees = 0;
        market.total_creator_fees = 0;

        // Payout tracking (initially zero)
        market.total_claimed = 0;

        // Status
        market.status = MarketStatus::Active;
        market.created_at = clock.unix_timestamp;
        market.resolved_outcome = None;

        // Tracking
        market.total_bets = 0;
        market.unique_bettors = 0;
        market.bump = ctx.bumps.market;

        let title_copy = title.clone();

        emit!(MarketCreatedEvent {
            market_id,
            creator: ctx.accounts.creator.key(),
            title,
            end_date,
            timestamp: clock.unix_timestamp,
        });

        msg!("Market {} created: {}", market_id, title_copy);
        Ok(())
    }

    /// Place a bet on a market
    ///
    /// Transfers SOL, updates pools, calculates fees, creates UserBet account.
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        bet_side: BetSide,
        amount: u64,
    ) -> Result<()> {
        // Deserialize global_parameters from parameter_storage program
        let global_params_data = ctx.accounts.global_parameters.try_borrow_data()?;
        let params = GlobalParameters::try_deserialize(&mut &global_params_data[..])?;
        let clock = Clock::get()?;

        // Validate market status
        {
            let market = &ctx.accounts.market;
            require!(
                market.status == MarketStatus::Active,
                MarketError::MarketNotActive
            );
            require!(
                clock.unix_timestamp < market.end_date,
                MarketError::MarketEnded
            );
        }

        // Validate bet amount against parameters
        require!(
            amount >= params.min_bet_lamports,
            MarketError::BetTooSmall
        );
        require!(
            amount <= params.max_bet_lamports,
            MarketError::BetTooLarge
        );

        // Calculate fees (in basis points)
        let platform_fee = (amount as u128 * params.platform_fee_bps as u128) / 10000;
        let creator_fee = (amount as u128 * params.creator_fee_bps as u128) / 10000;
        let total_fees = platform_fee + creator_fee;
        let amount_to_pool = amount - total_fees as u64;

        // Transfer SOL from bettor to market PDA
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.bettor.to_account_info(),
                    to: ctx.accounts.market.to_account_info(),
                },
            ),
            amount,
        )?;

        // Now get mutable references after the transfer is complete
        let market = &mut ctx.accounts.market;
        let user_bet = &mut ctx.accounts.user_bet;

        // Update pools with overflow protection
        match bet_side {
            BetSide::Yes => {
                market.yes_pool = market.yes_pool
                    .checked_add(amount_to_pool)
                    .ok_or(MarketError::PoolOverflow)?;
            }
            BetSide::No => {
                market.no_pool = market.no_pool
                    .checked_add(amount_to_pool)
                    .ok_or(MarketError::PoolOverflow)?;
            }
        }

        // Update market stats with overflow protection
        market.total_volume = market.total_volume
            .checked_add(amount)
            .ok_or(MarketError::TotalVolumeOverflow)?;
        market.total_bets = market.total_bets
            .checked_add(1)
            .ok_or(MarketError::TotalBetsOverflow)?;

        // Track accumulated fees (for distribution on resolution)
        market.total_platform_fees = market.total_platform_fees
            .checked_add(platform_fee as u64)
            .ok_or(MarketError::FeeOverflow)?;
        market.total_creator_fees = market.total_creator_fees
            .checked_add(creator_fee as u64)
            .ok_or(MarketError::FeeOverflow)?;

        // Calculate current odds
        let yes_odds = calculate_odds(market.yes_pool, market.no_pool);

        // Initialize UserBet account
        user_bet.market_id = market.market_id;
        user_bet.bettor = ctx.accounts.bettor.key();
        user_bet.bet_side = bet_side.clone();
        user_bet.amount = amount;
        user_bet.amount_to_pool = amount_to_pool;
        user_bet.platform_fee = platform_fee as u64;
        user_bet.creator_fee = creator_fee as u64;
        user_bet.timestamp = clock.unix_timestamp;
        user_bet.claimed = false;
        user_bet.odds_at_bet = yes_odds;
        user_bet.bump = ctx.bumps.user_bet;

        let bet_side_copy = bet_side.clone();

        emit!(BetPlacedEvent {
            market_id: market.market_id,
            bettor: ctx.accounts.bettor.key(),
            bet_side,
            amount,
            amount_to_pool,
            platform_fee: platform_fee as u64,
            creator_fee: creator_fee as u64,
            yes_pool: market.yes_pool,
            no_pool: market.no_pool,
            yes_odds,
            timestamp: clock.unix_timestamp,
        });

        msg!(
            "Bet placed: {} SOL on {:?}, odds: {}%",
            amount as f64 / 1_000_000_000.0,
            bet_side_copy,
            yes_odds
        );

        Ok(())
    }

    /// Resolve a market (placeholder for Epic 2 integration)
    ///
    /// Will be called by MarketResolution program after voting.
    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        outcome: BetSide,
    ) -> Result<()> {
        // Get global parameters for platform wallet validation
        let global_params_data = ctx.accounts.global_parameters.try_borrow_data()?;
        let params = GlobalParameters::try_deserialize(&mut &global_params_data[..])?;
        let clock = Clock::get()?;

        let market = &mut ctx.accounts.market;

        // PROTECTION 1: Only creator can resolve (authorization)
        require!(
            ctx.accounts.authority.key() == market.creator,
            MarketError::Unauthorized
        );

        // PROTECTION 2: Validate platform wallet matches global parameters
        require!(
            ctx.accounts.platform_wallet.key() == params.authority,
            MarketError::Unauthorized
        );

        // PROTECTION 3: Market must be active
        require!(
            market.status == MarketStatus::Active,
            MarketError::MarketAlreadyResolved
        );

        // PROTECTION 4: Cannot resolve before end date
        require!(
            clock.unix_timestamp >= market.end_date,
            MarketError::MarketNotEnded
        );

        // Update market status and outcome
        market.status = MarketStatus::Resolved;
        market.resolved_outcome = Some(outcome.clone());

        // Copy fee amounts before transfers
        let platform_fees = market.total_platform_fees;
        let creator_fees = market.total_creator_fees;
        let market_id = market.market_id;
        let yes_pool = market.yes_pool;
        let no_pool = market.no_pool;

        // Distribute accumulated fees
        if platform_fees > 0 {
            **ctx.accounts.market.to_account_info().try_borrow_mut_lamports()? -= platform_fees;
            **ctx.accounts.platform_wallet.try_borrow_mut_lamports()? += platform_fees;
        }

        if creator_fees > 0 {
            **ctx.accounts.market.to_account_info().try_borrow_mut_lamports()? -= creator_fees;
            **ctx.accounts.creator_wallet.try_borrow_mut_lamports()? += creator_fees;
        }

        let outcome_copy = outcome.clone();

        emit!(MarketResolvedEvent {
            market_id,
            outcome,
            yes_pool,
            no_pool,
            timestamp: clock.unix_timestamp,
        });

        msg!(
            "Market {} resolved: {:?} | Platform fees: {} | Creator fees: {}",
            market_id,
            outcome_copy,
            platform_fees,
            creator_fees
        );

        Ok(())
    }

    /// Claim winnings after market resolution
    pub fn claim_payout(ctx: Context<ClaimPayout>) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let user_bet = &mut ctx.accounts.user_bet;

        // Validation checks
        require!(
            market.status == MarketStatus::Resolved,
            MarketError::MarketNotResolved
        );
        require!(!user_bet.claimed, MarketError::AlreadyClaimed);
        require!(
            user_bet.bettor == ctx.accounts.bettor.key(),
            MarketError::Unauthorized
        );

        // Check if user won
        let won = match (&user_bet.bet_side, &market.resolved_outcome) {
            (BetSide::Yes, Some(BetSide::Yes)) => true,
            (BetSide::No, Some(BetSide::No)) => true,
            _ => false,
        };

        require!(won, MarketError::BetLost);

        // Get winning and losing pools
        let winning_pool = match user_bet.bet_side {
            BetSide::Yes => market.yes_pool,
            BetSide::No => market.no_pool,
        };
        let losing_pool = match user_bet.bet_side {
            BetSide::Yes => market.no_pool,
            BetSide::No => market.yes_pool,
        };

        // PROTECTION 1: Division by zero - check winning_pool > 0
        require!(
            winning_pool > 0,
            MarketError::NoWinnersCannotClaim
        );

        // Calculate total pool (for conservation)
        let total_pool = winning_pool
            .checked_add(losing_pool)
            .ok_or(MarketError::PoolOverflow)?;

        // PROTECTION 2: Calculate payout with overflow protection (use u128)
        let share_of_winnings = (user_bet.amount_to_pool as u128)
            .checked_mul(losing_pool as u128)
            .ok_or(MarketError::PayoutCalculationOverflow)?
            .checked_div(winning_pool as u128)
            .ok_or(MarketError::PayoutCalculationOverflow)?;

        let calculated_payout = (user_bet.amount_to_pool as u128)
            .checked_add(share_of_winnings)
            .ok_or(MarketError::PayoutCalculationOverflow)?;

        // PROTECTION 3: Prevent over-claiming with total_claimed tracking
        let remaining_pool = total_pool
            .checked_sub(market.total_claimed)
            .ok_or(MarketError::TotalClaimedOverflow)?;

        // Cap payout to remaining pool (last claimer gets remainder)
        let actual_payout = std::cmp::min(calculated_payout as u64, remaining_pool);

        // Update total_claimed BEFORE transfer (reentrancy protection)
        market.total_claimed = market.total_claimed
            .checked_add(actual_payout)
            .ok_or(MarketError::TotalClaimedOverflow)?;

        // Copy values for event/logging before transfer
        let market_id = market.market_id;

        // Mark as claimed BEFORE transfer (reentrancy protection)
        user_bet.claimed = true;

        // Transfer from market PDA to bettor
        **ctx.accounts.market.to_account_info().try_borrow_mut_lamports()? -= actual_payout;
        **ctx.accounts.bettor.to_account_info().try_borrow_mut_lamports()? += actual_payout;

        emit!(PayoutClaimedEvent {
            market_id,
            bettor: ctx.accounts.bettor.key(),
            amount: actual_payout,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!(
            "Payout claimed: {} SOL (calculated: {} SOL, remaining: {} SOL)",
            actual_payout as f64 / 1_000_000_000.0,
            calculated_payout as f64 / 1_000_000_000.0,
            remaining_pool as f64 / 1_000_000_000.0
        );

        Ok(())
    }

    /// Cancel a stale market (Story 2.9: Stale Market Auto-Cancellation)
    ///
    /// Authority-only instruction to mark a market as cancelled.
    /// Used by the check-stale-markets cron job to cancel markets that:
    /// - Have status ENDED (from Story 2.3)
    /// - Have exceeded the stale_market_threshold (default 30 days after end_date)
    ///
    /// After cancellation, all bettors can claim 100% refunds via claim_refund.
    pub fn cancel_market(ctx: Context<CancelMarket>) -> Result<()> {
        // Get global parameters for authority validation
        let global_params_data = ctx.accounts.global_parameters.try_borrow_data()?;
        let params = GlobalParameters::try_deserialize(&mut &global_params_data[..])?;
        let clock = Clock::get()?;

        let market = &mut ctx.accounts.market;

        // PROTECTION 1: Only platform authority can cancel (authorization)
        require!(
            ctx.accounts.authority.key() == params.authority,
            MarketError::Unauthorized
        );

        // PROTECTION 2: Market must be Active (cannot cancel resolved markets)
        require!(
            market.status == MarketStatus::Active,
            MarketError::CannotCancelResolvedMarket
        );

        // PROTECTION 3: Market must be past end date (safety: only cancel ended markets)
        require!(
            clock.unix_timestamp >= market.end_date,
            MarketError::CannotCancelBeforeEndDate
        );

        // Copy values for event before mutation
        let market_id = market.market_id;
        let yes_pool = market.yes_pool;
        let no_pool = market.no_pool;
        let total_bets = market.total_bets;

        // Update market status to Cancelled
        market.status = MarketStatus::Cancelled;

        emit!(MarketCancelledEvent {
            market_id,
            yes_pool,
            no_pool,
            total_bets,
            timestamp: clock.unix_timestamp,
        });

        msg!(
            "Market {} cancelled: {} bets, {} SOL yes pool, {} SOL no pool",
            market_id,
            total_bets,
            yes_pool as f64 / 1_000_000_000.0,
            no_pool as f64 / 1_000_000_000.0
        );

        Ok(())
    }

    /// Claim full refund for a bet on a cancelled market (Story 2.9)
    ///
    /// After a market is cancelled, all bettors can claim 100% refunds of their original bet.
    /// Refund amount = amount_to_pool + platform_fee + creator_fee (full original amount).
    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let user_bet = &mut ctx.accounts.user_bet;

        // Validation checks
        require!(
            market.status == MarketStatus::Cancelled,
            MarketError::MarketNotCancelled
        );
        require!(!user_bet.claimed, MarketError::AlreadyClaimed);
        require!(
            user_bet.bettor == ctx.accounts.bettor.key(),
            MarketError::Unauthorized
        );

        // Calculate 100% refund (original bet amount)
        let refund_amount = user_bet.amount;

        // Update total_claimed BEFORE transfer (reentrancy protection)
        market.total_claimed = market.total_claimed
            .checked_add(refund_amount)
            .ok_or(MarketError::TotalClaimedOverflow)?;

        // Copy values for event/logging before transfer
        let market_id = market.market_id;

        // Mark as claimed BEFORE transfer (reentrancy protection)
        user_bet.claimed = true;

        // Transfer from market PDA to bettor (full refund)
        **ctx.accounts.market.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
        **ctx.accounts.bettor.to_account_info().try_borrow_mut_lamports()? += refund_amount;

        emit!(RefundClaimedEvent {
            market_id,
            bettor: ctx.accounts.bettor.key(),
            amount: refund_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!(
            "Refund claimed: {} SOL (100% of original bet)",
            refund_amount as f64 / 1_000_000_000.0
        );

        Ok(())
    }
}

// ============================================================================
// Account Structures
// ============================================================================

/// Prediction market account
#[account]
pub struct Market {
    pub market_id: u64,
    pub creator: Pubkey,
    pub title: String,
    pub description: String,
    pub end_date: i64,

    // Liquidity pools (lamports)
    pub yes_pool: u64,
    pub no_pool: u64,
    pub total_volume: u64,

    // Fee tracking (for resolution distribution)
    pub total_platform_fees: u64,
    pub total_creator_fees: u64,

    // Payout tracking (prevents over-claiming)
    pub total_claimed: u64,

    // Status
    pub status: MarketStatus,
    pub resolved_outcome: Option<BetSide>,

    // Tracking
    pub created_at: i64,
    pub total_bets: u64,
    pub unique_bettors: u32,
    pub bump: u8,
}

/// Individual bet position
#[account]
pub struct UserBet {
    pub market_id: u64,
    pub bettor: Pubkey,
    pub bet_side: BetSide,
    pub amount: u64,
    pub amount_to_pool: u64,
    pub platform_fee: u64,
    pub creator_fee: u64,
    pub timestamp: i64,
    pub claimed: bool,
    pub odds_at_bet: u16, // Basis points (5000 = 50%)
    pub bump: u8,
}

// ============================================================================
// Enums
// ============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum MarketStatus {
    Active,
    Resolved,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum BetSide {
    Yes,
    No,
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Calculate YES odds in basis points
fn calculate_odds(yes_pool: u64, no_pool: u64) -> u16 {
    let total = yes_pool + no_pool;
    if total == 0 {
        return 5000; // 50% if no bets yet
    }
    ((yes_pool as u128 * 10000) / total as u128) as u16
}

// ============================================================================
// Instruction Contexts
// ============================================================================

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct CreateMarket<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + 8 + 32 + 132 + 516 + 8 + 8*3 + 1 + 33 + 8 + 8 + 4 + 1, // ~800 bytes
        seeds = [b"market", market_id.to_le_bytes().as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,

    #[account(
        init,
        payer = bettor,
        space = 8 + 8 + 32 + 1 + 8*5 + 8 + 1 + 2 + 1, // ~140 bytes
        seeds = [
            b"user-bet",
            market.key().as_ref(),
            bettor.key().as_ref(),
            &market.total_bets.to_le_bytes()
        ],
        bump
    )]
    pub user_bet: Account<'info, UserBet>,

    /// CHECK: Global parameters from ParameterStorage program - validated via seeds
    #[account(
        seeds = [b"global-parameters"],
        bump,
        seeds::program = parameter_storage_program.key()
    )]
    pub global_parameters: AccountInfo<'info>,

    #[account(mut)]
    pub bettor: Signer<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: ParameterStorage program ID
    pub parameter_storage_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,

    /// CHECK: Global parameters from ParameterStorage program - validated via seeds
    #[account(
        seeds = [b"global-parameters"],
        bump,
        seeds::program = parameter_storage_program.key()
    )]
    pub global_parameters: AccountInfo<'info>,

    /// CHECK: Platform wallet from GlobalParameters.authority
    #[account(mut)]
    pub platform_wallet: AccountInfo<'info>,

    /// CHECK: Market creator wallet (validated against market.creator)
    #[account(
        mut,
        constraint = creator_wallet.key() == market.creator @ MarketError::Unauthorized
    )]
    pub creator_wallet: AccountInfo<'info>,

    pub authority: Signer<'info>,

    /// CHECK: ParameterStorage program ID
    pub parameter_storage_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimPayout<'info> {
    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [
            b"user-bet",
            market.key().as_ref(),
            bettor.key().as_ref(),
            &user_bet.market_id.to_le_bytes() // Using market_id as bet counter
        ],
        bump = user_bet.bump
    )]
    pub user_bet: Account<'info, UserBet>,

    #[account(mut)]
    pub bettor: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelMarket<'info> {
    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,

    /// CHECK: Global parameters from ParameterStorage program - validated via seeds
    #[account(
        seeds = [b"global-parameters"],
        bump,
        seeds::program = parameter_storage_program.key()
    )]
    pub global_parameters: AccountInfo<'info>,

    pub authority: Signer<'info>,

    /// CHECK: ParameterStorage program ID
    pub parameter_storage_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ClaimRefund<'info> {
    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [
            b"user-bet",
            market.key().as_ref(),
            bettor.key().as_ref(),
            &user_bet.market_id.to_le_bytes()
        ],
        bump = user_bet.bump
    )]
    pub user_bet: Account<'info, UserBet>,

    #[account(mut)]
    pub bettor: Signer<'info>,
}

// ============================================================================
// External Account Structures (from ParameterStorage)
// ============================================================================

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

// ============================================================================
// Events
// ============================================================================

#[event]
pub struct MarketCreatedEvent {
    pub market_id: u64,
    pub creator: Pubkey,
    pub title: String,
    pub end_date: i64,
    pub timestamp: i64,
}

#[event]
pub struct BetPlacedEvent {
    pub market_id: u64,
    pub bettor: Pubkey,
    pub bet_side: BetSide,
    pub amount: u64,
    pub amount_to_pool: u64,
    pub platform_fee: u64,
    pub creator_fee: u64,
    pub yes_pool: u64,
    pub no_pool: u64,
    pub yes_odds: u16,
    pub timestamp: i64,
}

#[event]
pub struct MarketResolvedEvent {
    pub market_id: u64,
    pub outcome: BetSide,
    pub yes_pool: u64,
    pub no_pool: u64,
    pub timestamp: i64,
}

#[event]
pub struct PayoutClaimedEvent {
    pub market_id: u64,
    pub bettor: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct MarketCancelledEvent {
    pub market_id: u64,
    pub yes_pool: u64,
    pub no_pool: u64,
    pub total_bets: u64,
    pub timestamp: i64,
}

#[event]
pub struct RefundClaimedEvent {
    pub market_id: u64,
    pub bettor: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

// ============================================================================
// Error Types
// ============================================================================

#[error_code]
pub enum MarketError {
    #[msg("Invalid market title: must be 1-128 characters")]
    InvalidTitle,

    #[msg("Invalid market description: must be 1-512 characters")]
    InvalidDescription,

    #[msg("Invalid end date: must be in the future")]
    InvalidEndDate,

    #[msg("Market is not active")]
    MarketNotActive,

    #[msg("Market has ended")]
    MarketEnded,

    #[msg("Bet amount is below minimum")]
    BetTooSmall,

    #[msg("Bet amount exceeds maximum")]
    BetTooLarge,

    #[msg("Market is not resolved yet")]
    MarketNotResolved,

    #[msg("Market is already resolved")]
    MarketAlreadyResolved,

    #[msg("Payout already claimed")]
    AlreadyClaimed,

    #[msg("Bet lost - no payout available")]
    BetLost,

    #[msg("Unauthorized")]
    Unauthorized,

    #[msg("Pool overflow: bet would exceed maximum pool size")]
    PoolOverflow,

    #[msg("Total volume overflow")]
    TotalVolumeOverflow,

    #[msg("Total bets counter overflow")]
    TotalBetsOverflow,

    #[msg("Fee accumulation overflow")]
    FeeOverflow,

    #[msg("Cannot resolve market before end date")]
    MarketNotEnded,

    #[msg("No winners - cannot claim payout (winning pool is zero)")]
    NoWinnersCannotClaim,

    #[msg("Payout calculation overflow")]
    PayoutCalculationOverflow,

    #[msg("Total claimed amount overflow")]
    TotalClaimedOverflow,

    #[msg("Market is not cancelled")]
    MarketNotCancelled,

    #[msg("Cannot cancel resolved market")]
    CannotCancelResolvedMarket,

    #[msg("Cannot cancel market before end date")]
    CannotCancelBeforeEndDate,
}
