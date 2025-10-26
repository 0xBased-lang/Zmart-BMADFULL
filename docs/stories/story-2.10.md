# Story 2.10: Implement Graduated Bond Refund Logic

Status: Ready

## Story

As a market creator,
I want my bond refund amount to reflect the proposal outcome,
So that there's a penalty for rejected proposals but full refund for success.

## Acceptance Criteria

1. **AC-2.10.1:** Bond refund logic implemented in BondManager program with graduated percentages:
   - Approved proposal → 100% bond refund
   - Rejected proposal → 50% bond refund
   - Cancelled market → 100% bond refund

2. **AC-2.10.2:** `calculate_refund_amount` function implements graduated logic based on proposal outcome

3. **AC-2.10.3:** Refund percentages configurable via ParameterStorage:
   - `approved_refund_bps` (default: 10000 = 100%)
   - `rejected_refund_bps` (default: 5000 = 50%)
   - `cancelled_refund_bps` (default: 10000 = 100%)

4. **AC-2.10.4:** Tests validate all refund scenarios: approval, rejection, cancellation

5. **AC-2.10.5:** Integration tested with proposal approval/rejection (Story 2.5)

## Tasks / Subtasks

- [ ] **Task 1:** Add refund percentage parameters to ParameterStorage (AC: #3)
  - [ ] 1.1: Add `approved_refund_bps`, `rejected_refund_bps`, `cancelled_refund_bps` fields to GlobalParameters
  - [ ] 1.2: Add enum variants to ParameterType
  - [ ] 1.3: Update get/set methods for new parameters
  - [ ] 1.4: Initialize default values (10000, 5000, 10000)

- [ ] **Task 2:** Implement `calculate_refund_amount` function in BondManager (AC: #1, #2)
  - [ ] 2.1: Create helper function that takes outcome and bond amount
  - [ ] 2.2: Query ParameterStorage for refund percentages
  - [ ] 2.3: Calculate refund based on outcome type
  - [ ] 2.4: Add overflow protection for percentage calculations

- [ ] **Task 3:** Update `refund_bond` instruction in BondManager (AC: #1)
  - [ ] 3.1: Call `calculate_refund_amount` with proposal outcome
  - [ ] 3.2: Transfer calculated refund amount to creator
  - [ ] 3.3: Emit BondRefunded event with outcome and amount
  - [ ] 3.4: Update bond escrow status

- [ ] **Task 4:** Add Event Listener support for BondRefunded event (AC: #5)
  - [ ] 4.1: Add `handleBondRefunded` event handler to sync-events
  - [ ] 4.2: Register event in EVENT_HANDLERS
  - [ ] 4.3: Update database with refund details
  - [ ] 4.4: Log to audit trail

- [ ] **Task 5:** Integration testing with Story 2.5 (AC: #5)
  - [ ] 5.1: Test approved proposal → verify 100% refund
  - [ ] 5.2: Test rejected proposal → verify 50% refund
  - [ ] 5.3: Test cancelled market → verify 100% refund
  - [ ] 5.4: Test parameter updates → verify refund percentages change
  - [ ] 5.5: Test Event Listener syncs refund to database

- [ ] **Task 6:** Write Anchor tests (AC: #4)
  - [ ] 6.1: Test calculate_refund_amount with all outcomes
  - [ ] 6.2: Test refund_bond with approved proposal
  - [ ] 6.3: Test refund_bond with rejected proposal
  - [ ] 6.4: Test refund_bond with cancelled market
  - [ ] 6.5: Test parameter updates affect refund amounts

## Dev Notes

### Architecture Patterns

**Bond Manager Pattern** [Source: docs/architecture.md]:
- BondManager program manages escrow for market creator bonds
- Bonds deposited during proposal creation (Story 1.5)
- Refund logic determined by proposal outcome (Story 2.5)
- CPI pattern: ProposalSystem → BondManager for bond operations

**Parameter Flexibility** [Source: docs/architecture.md]:
- All economic parameters configurable via ParameterStorage
- Subject to safety constraints (24h cooldown, max 20% change)
- Refund percentages stored as basis points (bps): 10000 = 100%

**Event-Driven Database Sync** [Source: Stories 1.9, 2.9]:
- Event Listener (sync-events) automatically syncs on-chain events to database
- No manual database updates needed
- BondRefunded event triggers automatic database sync

### Components to Touch

**Programs:**
- `programs/parameter-storage/src/lib.rs` - Add refund percentage parameters
- `programs/bond-manager/src/lib.rs` - Implement graduated refund logic

**Edge Functions:**
- `supabase/functions/sync-events/index.ts` - Add BondRefunded event handler

**Database:**
- No schema changes required (existing bond_escrows table sufficient)

### Testing Standards

[Source: docs/architecture.md - Testing & Infrastructure]:
- **Unit Tests:** Anchor tests for all refund scenarios
- **Integration Tests:** Test with Story 2.5 proposal outcomes
- **Test Coverage:** All refund paths (approved, rejected, cancelled)
- **Event Tests:** Verify Event Listener syncs refund events

### Project Structure Notes

**Alignment with Unified Project Structure:**
- Programs: Follow existing Anchor workspace structure
- Edge Functions: Follow Story 1.9 Event Listener pattern
- Parameters: Follow Story 1.3 ParameterStorage pattern
- Events: Follow Story 2.9 event emission pattern

**No Conflicts Detected:**
- BondManager already exists (Story 1.5)
- ParameterStorage supports adding new parameters
- Event Listener supports adding new event handlers
- Pattern established by previous stories

### References

- [Source: docs/epics.md - Story 2.10] - User story and acceptance criteria
- [Source: docs/architecture.md - Bond Manager Pattern] - Graduated bond economics
- [Source: docs/architecture.md - Parameter Flexibility] - ParameterStorage integration
- [Source: docs/STORY-1.5-COMPLETE.md] - BondManager implementation
- [Source: docs/STORY-2.5-COMPLETE.md] - Proposal approval/rejection outcomes
- [Source: docs/STORY-1.9-COMPLETE.md] - Event Listener pattern
- [Source: supabase/functions/sync-events/index.ts] - Event handler examples

## Dev Agent Record

### Context Reference

- [Story Context 2.10](story-context-2.10.xml) - Generated: 2025-10-26

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

### File List
