use anchor_lang::prelude::*;

declare_id!("J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD");

/// BMAD-Zmart Parameter Storage
///
/// Global configuration management with safety constraints.
/// Provides adjustable parameters and feature toggles without redeployment.
///
/// Safety Features:
/// - Admin-only access control
/// - 24-hour cooldown between updates
/// - Maximum 20% change per update
/// - Event emission for audit trail
#[program]
pub mod parameter_storage {
    use super::*;

    /// Initialize global parameters and feature toggles
    ///
    /// Creates both PDA accounts with secure default values.
    /// Can only be called once per deployment.
    pub fn initialize_parameters(ctx: Context<InitializeParameters>) -> Result<()> {
        let params = &mut ctx.accounts.parameters;
        let toggles = &mut ctx.accounts.toggles;
        let clock = Clock::get()?;

        // Set authority
        params.authority = ctx.accounts.authority.key();
        toggles.authority = ctx.accounts.authority.key();

        // Market fee parameters (basis points: 100 = 1%)
        params.creation_bond_lamports = 100_000_000; // 0.1 SOL
        params.platform_fee_bps = 200;               // 2%
        params.creator_fee_bps = 100;                // 1%

        // Betting limits (lamports)
        params.min_bet_lamports = 10_000_000;  // 0.01 SOL
        params.max_bet_lamports = 100_000_000_000; // 100 SOL
        params.max_market_size_lamports = 1_000_000_000_000; // 1,000 SOL

        // Time limits (seconds)
        params.min_duration_seconds = 3600;      // 1 hour
        params.max_duration_seconds = 31_536_000; // 1 year
        params.dispute_window_seconds = 172_800;  // 48 hours

        // Bond tier thresholds (graduated economics)
        params.bond_tier_1_lamports = 100_000_000;   // 0.1 SOL
        params.bond_tier_2_lamports = 500_000_000;   // 0.5 SOL
        params.bond_tier_3_lamports = 1_000_000_000; // 1 SOL

        // Stale market auto-cancellation (Story 2.9)
        params.stale_market_threshold_days = 30; // 30 days after end_date

        // Voting weight mode (Story 2.8): 0 = DEMOCRATIC, 1 = ACTIVITY_WEIGHTED
        params.voting_weight_mode = 0; // Default: DEMOCRATIC

        // Graduated bond refund percentages (Story 2.10) - in basis points
        params.approved_refund_bps = 10000;  // 100% refund for approved proposals
        params.rejected_refund_bps = 5000;   // 50% refund for rejected proposals
        params.cancelled_refund_bps = 10000; // 100% refund for cancelled markets

        // Safety constraints
        params.update_cooldown_seconds = 86_400; // 24 hours
        params.max_change_bps = 2000;            // 20%

        // Tracking
        params.last_updated = clock.unix_timestamp;
        params.cooldown_until = 0; // No cooldown on init
        params.version = 1;
        params.bump = ctx.bumps.parameters;

        // Feature toggles (all enabled by default except emergency pause)
        toggles.market_creation_enabled = true;
        toggles.betting_enabled = true;
        toggles.resolution_enabled = true;
        toggles.proposals_enabled = true;
        toggles.emergency_pause = false;

        toggles.last_updated = clock.unix_timestamp;
        toggles.version = 1;
        toggles.bump = ctx.bumps.toggles;

        msg!("Parameters initialized with authority: {}", params.authority);
        Ok(())
    }

    /// Update a numeric parameter with safety checks
    ///
    /// Enforces cooldown period and maximum change percentage.
    /// Emits event for audit trail.
    pub fn update_parameter(
        ctx: Context<UpdateParameter>,
        param_type: ParameterType,
        new_value: u64,
    ) -> Result<()> {
        let params = &mut ctx.accounts.parameters;
        let clock = Clock::get()?;

        // Check cooldown
        require!(
            clock.unix_timestamp >= params.cooldown_until,
            ParameterError::CooldownNotExpired
        );

        // Get current value and validate change
        let current_value = params.get_parameter_value(&param_type);
        validate_parameter_change(current_value, new_value, params.max_change_bps)?;

        // Update parameter
        params.set_parameter_value(&param_type, new_value)?;

        // Update tracking
        params.last_updated = clock.unix_timestamp;
        params.cooldown_until = clock.unix_timestamp + params.update_cooldown_seconds;

        // Emit event
        emit!(ParameterUpdatedEvent {
            authority: ctx.accounts.authority.key(),
            param_type: param_type.clone(),
            old_value: current_value,
            new_value,
            timestamp: clock.unix_timestamp,
        });

        msg!("Parameter {:?} updated from {} to {}", param_type, current_value, new_value);
        Ok(())
    }

    /// Update a feature toggle
    ///
    /// Immediate effect, no cooldown (for emergency response).
    /// Emits event for audit trail.
    pub fn update_toggle(
        ctx: Context<UpdateToggle>,
        toggle_type: ToggleType,
        enabled: bool,
    ) -> Result<()> {
        let toggles = &mut ctx.accounts.toggles;
        let clock = Clock::get()?;

        // Get current value
        let old_value = toggles.get_toggle_value(&toggle_type);

        // Update toggle
        toggles.set_toggle_value(&toggle_type, enabled)?;

        // Update tracking
        toggles.last_updated = clock.unix_timestamp;

        // Emit event
        emit!(ToggleUpdatedEvent {
            authority: ctx.accounts.authority.key(),
            toggle_type: toggle_type.clone(),
            old_value,
            new_value: enabled,
            timestamp: clock.unix_timestamp,
        });

        msg!("Toggle {:?} updated from {} to {}", toggle_type, old_value, enabled);
        Ok(())
    }
}

// ============================================================================
// Account Structures
// ============================================================================

/// Global numeric parameters
#[account]
pub struct GlobalParameters {
    /// Authority that can update parameters
    pub authority: Pubkey,

    // Market fees
    pub creation_bond_lamports: u64,
    pub platform_fee_bps: u16,
    pub creator_fee_bps: u16,

    // Betting limits
    pub min_bet_lamports: u64,
    pub max_bet_lamports: u64,
    pub max_market_size_lamports: u64,

    // Time limits
    pub min_duration_seconds: i64,
    pub max_duration_seconds: i64,
    pub dispute_window_seconds: i64,

    // Bond tiers
    pub bond_tier_1_lamports: u64,
    pub bond_tier_2_lamports: u64,
    pub bond_tier_3_lamports: u64,

    // Stale market auto-cancellation (Story 2.9)
    pub stale_market_threshold_days: i64,

    // Voting weight mode (Story 2.8): 0 = DEMOCRATIC, 1 = ACTIVITY_WEIGHTED
    pub voting_weight_mode: u8,

    // Graduated bond refund percentages (Story 2.10) - in basis points
    pub approved_refund_bps: u16,  // 100% = 10000
    pub rejected_refund_bps: u16,  // 50% = 5000 (default)
    pub cancelled_refund_bps: u16, // 100% = 10000

    // Safety constraints
    pub update_cooldown_seconds: i64,
    pub max_change_bps: u16,

    // Tracking
    pub last_updated: i64,
    pub cooldown_until: i64,
    pub version: u32,
    pub bump: u8,
}

/// Global feature toggles
#[account]
pub struct GlobalFeatureToggles {
    /// Authority that can update toggles
    pub authority: Pubkey,

    // Feature flags
    pub market_creation_enabled: bool,
    pub betting_enabled: bool,
    pub resolution_enabled: bool,
    pub proposals_enabled: bool,
    pub emergency_pause: bool,

    // Tracking
    pub last_updated: i64,
    pub version: u32,
    pub bump: u8,
}

// ============================================================================
// Parameter and Toggle Enums
// ============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum ParameterType {
    CreationBond,
    PlatformFee,
    CreatorFee,
    MinBet,
    MaxBet,
    MaxMarketSize,
    MinDuration,
    MaxDuration,
    DisputeWindow,
    BondTier1,
    BondTier2,
    BondTier3,
    StaleMarketThreshold, // Story 2.9
    VotingWeightMode, // Story 2.8: 0 = DEMOCRATIC, 1 = ACTIVITY_WEIGHTED
    ApprovedRefund, // Story 2.10: Refund % for approved proposals (basis points)
    RejectedRefund, // Story 2.10: Refund % for rejected proposals (basis points)
    CancelledRefund, // Story 2.10: Refund % for cancelled markets (basis points)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum ToggleType {
    MarketCreation,
    Betting,
    Resolution,
    Proposals,
    EmergencyPause,
}

// ============================================================================
// Helper Implementations
// ============================================================================

impl GlobalParameters {
    pub fn get_parameter_value(&self, param_type: &ParameterType) -> u64 {
        match param_type {
            ParameterType::CreationBond => self.creation_bond_lamports,
            ParameterType::PlatformFee => self.platform_fee_bps as u64,
            ParameterType::CreatorFee => self.creator_fee_bps as u64,
            ParameterType::MinBet => self.min_bet_lamports,
            ParameterType::MaxBet => self.max_bet_lamports,
            ParameterType::MaxMarketSize => self.max_market_size_lamports,
            ParameterType::MinDuration => self.min_duration_seconds as u64,
            ParameterType::MaxDuration => self.max_duration_seconds as u64,
            ParameterType::DisputeWindow => self.dispute_window_seconds as u64,
            ParameterType::BondTier1 => self.bond_tier_1_lamports,
            ParameterType::BondTier2 => self.bond_tier_2_lamports,
            ParameterType::BondTier3 => self.bond_tier_3_lamports,
            ParameterType::StaleMarketThreshold => self.stale_market_threshold_days as u64,
            ParameterType::VotingWeightMode => self.voting_weight_mode as u64,
            ParameterType::ApprovedRefund => self.approved_refund_bps as u64,
            ParameterType::RejectedRefund => self.rejected_refund_bps as u64,
            ParameterType::CancelledRefund => self.cancelled_refund_bps as u64,
        }
    }

    pub fn set_parameter_value(&mut self, param_type: &ParameterType, value: u64) -> Result<()> {
        match param_type {
            ParameterType::CreationBond => self.creation_bond_lamports = value,
            ParameterType::PlatformFee => {
                require!(value <= 10000, ParameterError::InvalidValue);
                self.platform_fee_bps = value as u16;
            }
            ParameterType::CreatorFee => {
                require!(value <= 10000, ParameterError::InvalidValue);
                self.creator_fee_bps = value as u16;
            }
            ParameterType::MinBet => self.min_bet_lamports = value,
            ParameterType::MaxBet => self.max_bet_lamports = value,
            ParameterType::MaxMarketSize => self.max_market_size_lamports = value,
            ParameterType::MinDuration => self.min_duration_seconds = value as i64,
            ParameterType::MaxDuration => self.max_duration_seconds = value as i64,
            ParameterType::DisputeWindow => self.dispute_window_seconds = value as i64,
            ParameterType::BondTier1 => self.bond_tier_1_lamports = value,
            ParameterType::BondTier2 => self.bond_tier_2_lamports = value,
            ParameterType::BondTier3 => self.bond_tier_3_lamports = value,
            ParameterType::StaleMarketThreshold => self.stale_market_threshold_days = value as i64,
            ParameterType::VotingWeightMode => {
                require!(value <= 1, ParameterError::InvalidValue);
                self.voting_weight_mode = value as u8;
            }
            ParameterType::ApprovedRefund => {
                require!(value <= 10000, ParameterError::InvalidValue);
                self.approved_refund_bps = value as u16;
            }
            ParameterType::RejectedRefund => {
                require!(value <= 10000, ParameterError::InvalidValue);
                self.rejected_refund_bps = value as u16;
            }
            ParameterType::CancelledRefund => {
                require!(value <= 10000, ParameterError::InvalidValue);
                self.cancelled_refund_bps = value as u16;
            }
        }
        Ok(())
    }
}

impl GlobalFeatureToggles {
    pub fn get_toggle_value(&self, toggle_type: &ToggleType) -> bool {
        match toggle_type {
            ToggleType::MarketCreation => self.market_creation_enabled,
            ToggleType::Betting => self.betting_enabled,
            ToggleType::Resolution => self.resolution_enabled,
            ToggleType::Proposals => self.proposals_enabled,
            ToggleType::EmergencyPause => self.emergency_pause,
        }
    }

    pub fn set_toggle_value(&mut self, toggle_type: &ToggleType, enabled: bool) -> Result<()> {
        match toggle_type {
            ToggleType::MarketCreation => self.market_creation_enabled = enabled,
            ToggleType::Betting => self.betting_enabled = enabled,
            ToggleType::Resolution => self.resolution_enabled = enabled,
            ToggleType::Proposals => self.proposals_enabled = enabled,
            ToggleType::EmergencyPause => self.emergency_pause = enabled,
        }
        Ok(())
    }
}

// ============================================================================
// Validation Functions
// ============================================================================

fn validate_parameter_change(old_value: u64, new_value: u64, max_change_bps: u16) -> Result<()> {
    if old_value == 0 {
        // Allow any change from 0
        return Ok(());
    }

    let diff = if new_value > old_value {
        new_value - old_value
    } else {
        old_value - new_value
    };

    let max_allowed_change = (old_value as u128 * max_change_bps as u128) / 10000;

    require!(
        diff as u128 <= max_allowed_change,
        ParameterError::ChangeExceedsLimit
    );

    Ok(())
}

// ============================================================================
// Instruction Contexts
// ============================================================================

#[derive(Accounts)]
pub struct InitializeParameters<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8*9 + 2*2 + 8*3 + 8 + 1 + 2*3 + 8 + 2 + 8*2 + 4 + 1, // ~223 bytes (added 6 for 3x u16 refund percentages)
        seeds = [b"global-parameters"],
        bump
    )]
    pub parameters: Account<'info, GlobalParameters>,

    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 5 + 8 + 4 + 1, // ~60 bytes
        seeds = [b"global-toggles"],
        bump
    )]
    pub toggles: Account<'info, GlobalFeatureToggles>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateParameter<'info> {
    #[account(
        mut,
        seeds = [b"global-parameters"],
        bump = parameters.bump,
        has_one = authority @ ParameterError::Unauthorized
    )]
    pub parameters: Account<'info, GlobalParameters>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateToggle<'info> {
    #[account(
        mut,
        seeds = [b"global-toggles"],
        bump = toggles.bump,
        has_one = authority @ ParameterError::Unauthorized
    )]
    pub toggles: Account<'info, GlobalFeatureToggles>,

    pub authority: Signer<'info>,
}

// ============================================================================
// Events
// ============================================================================

#[event]
pub struct ParameterUpdatedEvent {
    pub authority: Pubkey,
    pub param_type: ParameterType,
    pub old_value: u64,
    pub new_value: u64,
    pub timestamp: i64,
}

#[event]
pub struct ToggleUpdatedEvent {
    pub authority: Pubkey,
    pub toggle_type: ToggleType,
    pub old_value: bool,
    pub new_value: bool,
    pub timestamp: i64,
}

// ============================================================================
// Error Types
// ============================================================================

#[error_code]
pub enum ParameterError {
    #[msg("Unauthorized: Only the authority can update parameters")]
    Unauthorized,

    #[msg("Cooldown period has not expired yet")]
    CooldownNotExpired,

    #[msg("Parameter change exceeds maximum allowed percentage")]
    ChangeExceedsLimit,

    #[msg("Invalid parameter value")]
    InvalidValue,
}
