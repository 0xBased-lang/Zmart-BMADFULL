use anchor_lang::prelude::*;

declare_id!("2ysaGgXXKK7fTjKp59nVyivP7yoUpf9QHJqQHAuavchP");

/// BMAD-Zmart Program Registry
///
/// Central registry for dynamic program address lookup.
/// Enables independent program upgrades without breaking integrations.
///
/// Architecture Pattern: Registry Pattern
/// - Programs discover each other via dynamic lookup
/// - No hardcoded addresses in cross-program calls
/// - Version tracking enables compatibility management
#[program]
pub mod program_registry {
    use super::*;

    /// Initialize the program registry
    ///
    /// Creates a PDA-based registry account with admin authority.
    /// Must be called once before any programs can be registered.
    pub fn initialize_registry(ctx: Context<InitializeRegistry>) -> Result<()> {
        let registry = &mut ctx.accounts.registry;

        registry.authority = ctx.accounts.authority.key();
        registry.programs = Vec::new();
        registry.bump = ctx.bumps.registry;

        msg!("ProgramRegistry initialized with authority: {}", registry.authority);
        Ok(())
    }

    /// Register a program in the registry
    ///
    /// Admin-only instruction to add or update a program entry.
    /// Stores program name, address, and version for lookup.
    ///
    /// # Arguments
    /// * `name` - Unique identifier for the program (e.g., "core-markets")
    /// * `program_id` - The deployed program's public key
    /// * `version` - Semantic version string (e.g., "1.0.0")
    pub fn register_program(
        ctx: Context<RegisterProgram>,
        name: String,
        program_id: Pubkey,
        version: String,
    ) -> Result<()> {
        let registry = &mut ctx.accounts.registry;

        // Validate inputs
        require!(
            !name.is_empty() && name.len() <= 32,
            RegistryError::InvalidProgramName
        );
        require!(
            !version.is_empty() && version.len() <= 16,
            RegistryError::InvalidVersion
        );

        // Check if program already exists
        if let Some(entry) = registry.programs.iter_mut().find(|p| p.name == name) {
            // Update existing entry
            msg!("Updating program '{}' from {} to {}", name, entry.version, version);
            entry.program_id = program_id;
            entry.version = version;
        } else {
            // Add new entry
            msg!("Registering new program '{}' v{} at {}", name, version, program_id);
            registry.programs.push(ProgramEntry {
                name: name.clone(),
                program_id,
                version,
            });
        }

        msg!("Registry now contains {} programs", registry.programs.len());
        Ok(())
    }

    /// Get program address by name
    ///
    /// View function to lookup a registered program.
    /// Returns the program's public key if found.
    ///
    /// Note: This is primarily for off-chain queries.
    /// On-chain programs should use get_program_entry for full info.
    pub fn get_program_address(ctx: Context<GetProgramAddress>, name: String) -> Result<Pubkey> {
        let registry = &ctx.accounts.registry;

        let entry = registry
            .programs
            .iter()
            .find(|p| p.name == name)
            .ok_or(RegistryError::ProgramNotFound)?;

        msg!("Found program '{}' v{} at {}", entry.name, entry.version, entry.program_id);
        Ok(entry.program_id)
    }
}

// ============================================================================
// Account Structures
// ============================================================================

/// Program Registry Account
///
/// PDA-based account storing all registered programs.
///
/// Space calculation:
/// - Discriminator: 8 bytes
/// - authority: 32 bytes
/// - programs Vec length: 4 bytes
/// - bump: 1 byte
/// - programs data: 100 * (4 + 32 + 32 + 4 + 16) = 8,800 bytes (100 programs max)
/// Total: 8,845 bytes (~8.6 KB)
#[account]
pub struct ProgramRegistry {
    /// Authority that can register programs
    pub authority: Pubkey,
    /// Vector of registered programs
    pub programs: Vec<ProgramEntry>,
    /// PDA bump seed
    pub bump: u8,
}

/// Individual program entry in the registry
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ProgramEntry {
    /// Program identifier (e.g., "core-markets")
    pub name: String,
    /// Deployed program address
    pub program_id: Pubkey,
    /// Semantic version (e.g., "1.0.0")
    pub version: String,
}

// ============================================================================
// Instruction Contexts
// ============================================================================

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 4 + 1 + 8800, // discriminator + authority + vec_len + bump + programs
        seeds = [b"program-registry"],
        bump
    )]
    pub registry: Account<'info, ProgramRegistry>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterProgram<'info> {
    #[account(
        mut,
        seeds = [b"program-registry"],
        bump = registry.bump,
        has_one = authority @ RegistryError::Unauthorized
    )]
    pub registry: Account<'info, ProgramRegistry>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetProgramAddress<'info> {
    #[account(
        seeds = [b"program-registry"],
        bump = registry.bump
    )]
    pub registry: Account<'info, ProgramRegistry>,
}

// ============================================================================
// Error Types
// ============================================================================

#[error_code]
pub enum RegistryError {
    #[msg("Unauthorized: Only the registry authority can register programs")]
    Unauthorized,

    #[msg("Program not found in registry")]
    ProgramNotFound,

    #[msg("Invalid program name: must be 1-32 characters")]
    InvalidProgramName,

    #[msg("Invalid version: must be 1-16 characters")]
    InvalidVersion,
}

// ============================================================================
// Helper Functions (for CPI from other programs)
// ============================================================================

impl ProgramRegistry {
    /// Get program entry by name (for on-chain CPI)
    pub fn get_program_entry(&self, name: &str) -> Result<&ProgramEntry> {
        self.programs
            .iter()
            .find(|p| p.name == name)
            .ok_or(RegistryError::ProgramNotFound.into())
    }

    /// Check if a program is registered
    pub fn has_program(&self, name: &str) -> bool {
        self.programs.iter().any(|p| p.name == name)
    }

    /// Get total number of registered programs
    pub fn program_count(&self) -> usize {
        self.programs.len()
    }
}
