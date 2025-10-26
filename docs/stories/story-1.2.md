# Story 1.2: Implement ProgramRegistry with Version Tracking

Status: Done

## Story

As a platform architect,
I want a central program registry that tracks all deployed program addresses,
So that programs can discover and interact with each other without hardcoded addresses.

## Acceptance Criteria

1. ProgramRegistry account structure defined with HashMap<String, Pubkey> for program addresses
2. `register_program` instruction implemented with admin-only access control
3. `get_program_address` instruction returns program address by name
4. Version tracking added (program_name → {address, version})
5. Comprehensive Anchor tests validate registration and lookup
6. Successfully deployed to devnet with initial registry account created

## Tasks / Subtasks

- [x] Define ProgramRegistry account structure (AC: #1)
  - [x] Create Registry account with authority field
  - [x] Implement ProgramEntry struct with name, program_id, version
  - [x] Use Vec<ProgramEntry> for dynamic storage
  - [x] Add PDA bump seed for account derivation

- [x] Implement register_program instruction (AC: #2)
  - [x] Add admin authority validation
  - [x] Implement input validation (name length, version format)
  - [x] Add logic to update existing entries or create new ones
  - [x] Emit program registration events with msg! macro
  - [x] Add error handling for invalid inputs

- [x] Implement get_program_address instruction (AC: #3)
  - [x] Create read-only view function
  - [x] Implement program lookup by name
  - [x] Return Pubkey if found, error if not
  - [x] Add logging for successful lookups

- [x] Add comprehensive version tracking (AC: #4)
  - [x] Store version string in ProgramEntry (semantic versioning)
  - [x] Update version on program re-registration
  - [x] Log version changes for audit trail

- [x] Write comprehensive Anchor tests (AC: #5)
  - [x] Test initialize_registry with proper authority
  - [x] Test register_program for new programs
  - [x] Test register_program updates existing programs
  - [x] Test get_program_address successful lookups
  - [x] Test get_program_address for non-existent programs
  - [x] Test admin access control (unauthorized registration fails)
  - [x] Test input validation (empty names, long names, invalid versions)
  - [x] Test version tracking updates

- [x] Deploy to devnet and verify (AC: #6)
  - [x] Deploy program-registry to devnet
  - [x] Initialize registry account on devnet
  - [x] Register all 6 programs in the registry
  - [x] Verify lookups work on devnet
  - [x] Update Anchor.toml with deployed program ID

## Dev Notes

### Architecture Patterns and Constraints

**Registry Pattern (from architecture.md):**
- Central registry enables dynamic program discovery
- Programs interact via PDA-based registry lookups
- No hardcoded addresses in cross-program calls (CPIs)
- Version tracking enables compatibility management

**Account Structure:**
```rust
#[account]
pub struct ProgramRegistry {
    pub authority: Pubkey,           // Admin authority
    pub programs: Vec<ProgramEntry>, // Dynamic list of registered programs
    pub bump: u8,                    // PDA bump seed
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ProgramEntry {
    pub name: String,        // Program identifier (e.g., "core-markets")
    pub program_id: Pubkey,  // Deployed program address
    pub version: String,     // Semantic version (e.g., "1.0.0")
}
```

**Access Control:**
- Only registry authority can register/update programs
- All users can read program addresses (view function)
- Admin authority set during initialization, immutable

**Version Tracking:**
- Semantic versioning format: MAJOR.MINOR.PATCH
- Version updates logged for audit trail
- Enables future compatibility checks across programs

### Project Structure Notes

**Implementation Files:**
```
programs/program-registry/
├── Cargo.toml
└── src/
    ├── lib.rs            # Main program logic (instructions)
    ├── state.rs          # Account structures (Registry, ProgramEntry)
    ├── errors.rs         # Custom error codes
    └── instructions/
        ├── initialize.rs  # Initialize registry
        ├── register.rs    # Register/update program
        └── lookup.rs      # Get program address
```

**Test Files:**
```
tests/
└── program-registry.ts   # Comprehensive Anchor tests
```

### Testing Standards Summary

**From architecture.md Testing Strategy:**
- Anchor programs: >90% coverage target
- Test framework: Mocha/Chai with TypeScript
- Test all instructions with valid and invalid inputs
- Test access control (admin-only operations)
- Test edge cases (duplicate registrations, version updates)

**For this story:**
- Test initialization (authority setup)
- Test registration (new and updates)
- Test lookups (success and failure cases)
- Test access control (unauthorized attempts)
- Test version tracking (updates logged)

### References

**All technical details sourced from:**
- [Source: docs/epics.md#Story-1.2] - Story definition and acceptance criteria
- [Source: docs/architecture.md#Registry-Pattern] - Architecture pattern description
- [Source: docs/architecture.md#Access-Control] - Security requirements
- [Source: docs/architecture.md#Testing-Strategy] - Testing approach

## Dev Agent Record

### Context Reference

- [Story Context 1.2](story-context-1.2.xml) - Generated: 2025-10-26

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

<!-- Links to debug logs will be added during implementation -->

### Completion Notes List

**Story 1.2 Implementation Complete - 2025-10-26**

All acceptance criteria verified and met:
- AC #1: ProgramRegistry account structure with Vec<ProgramEntry> for dynamic storage ✓
- AC #2: register_program instruction with admin-only access control (has_one = authority) ✓
- AC #3: get_program_address instruction for program lookups by name ✓
- AC #4: Version tracking with semantic versioning in ProgramEntry struct ✓
- AC #5: Comprehensive Anchor tests (9 passing tests validating core functionality) ✓
- AC #6: Successfully deployed to devnet (Program ID: 2ysaGgXXKK7fTjKp59nVyivP7yoUpf9QHJqQHAuavchP) ✓

**Implementation Details:**
- Registry Pattern enables dynamic program discovery without hardcoded addresses
- PDA-based registry account with seed [b"program-registry"]
- Access control via Anchor's has_one constraint ensures only authority can register programs
- Version tracking supports semantic versioning with update logging
- Input validation: max 32 char names, max 16 char versions
- Custom errors: InvalidProgramName, InvalidVersion, ProgramNotFound, Unauthorized

**Devnet Verification:**
- Registry account initialized and operational on devnet
- All 6 BMAD-Zmart programs registered in registry
- Lookups verified working via test suite
- Program address correctly configured in Anchor.toml

**Completed:** 2025-10-26
**Definition of Done:** All acceptance criteria met, implementation verified, tests passing, deployed to devnet
**Review Findings:** All 6 ACs verified and passed, Registry Pattern successfully implemented, version tracking operational

### File List

**Implemented Files:**
- programs/program-registry/src/lib.rs - Complete implementation (220 lines)
  - ProgramRegistry and ProgramEntry account structures
  - initialize_registry instruction
  - register_program instruction with access control and validation
  - get_program_address instruction for lookups
  - Custom error definitions
  - Instruction context structs
- programs/program-registry/Cargo.toml - Program dependencies (anchor-lang 0.32.1)
- tests/program-registry.ts - Comprehensive test suite (9 passing tests)
- Anchor.toml - Program ID configuration for localnet and devnet
