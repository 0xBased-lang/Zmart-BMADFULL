# Story 2.8: Implement Voting Weight Modes (Democratic vs. Activity-Based)

Status: Ready

## Story

As a platform admin,
I want to toggle between democratic and activity-weighted voting,
So that we can experiment with governance models.

## Acceptance Criteria

1. `voting_weight_mode` parameter in ParameterStorage: DEMOCRATIC or ACTIVITY_WEIGHTED
2. Democratic mode: all votes have weight = 1
3. Activity-weighted mode: vote weight = user's activity_points balance
4. Vote weight calculation updated in both resolution voting (Story 2.2) and proposal voting (Story 2.4)
5. Admin can toggle mode via parameter update instruction
6. Frontend displays vote weight mode and user's weight on voting UI
7. Tests validate correct weight calculations in both modes

## Tasks / Subtasks

- [ ] Add voting_weight_mode parameter to ParameterStorage (AC: #1, #5)
  - [ ] Define parameter in ParameterStorage program state
  - [ ] Add default value: DEMOCRATIC
  - [ ] Create set_voting_weight_mode instruction
  - [ ] Restrict parameter updates to admins only

- [ ] Implement democratic voting weight calculation (AC: #2)
  - [ ] Create get_vote_weight helper function
  - [ ] Democratic mode: return weight = 1 for all users
  - [ ] Add unit tests for democratic weight calculation

- [ ] Implement activity-weighted voting calculation (AC: #3)
  - [ ] Query user's activity_points balance from database
  - [ ] Activity-weighted mode: return weight = activity_points
  - [ ] Handle users with zero activity points (default to weight = 1)
  - [ ] Add unit tests for activity-weighted calculation

- [ ] Update resolution voting to use weight modes (AC: #4)
  - [ ] Modify submit-vote Edge Function (Story 2.2)
  - [ ] Fetch voting_weight_mode from ParameterStorage
  - [ ] Calculate vote weight based on mode
  - [ ] Store vote with calculated weight
  - [ ] Update aggregate-votes to respect weights

- [ ] Update proposal voting to use weight modes (AC: #4)
  - [ ] Modify submit-proposal-vote Edge Function (Story 2.4)
  - [ ] Fetch voting_weight_mode from ParameterStorage
  - [ ] Calculate vote weight based on mode
  - [ ] Store proposal vote with calculated weight
  - [ ] Update finalize-proposal-vote to respect weights

- [ ] Create helper function to fetch current voting mode (AC: #4)
  - [ ] Query ParameterStorage for voting_weight_mode
  - [ ] Cache mode value to reduce database queries
  - [ ] Return default (DEMOCRATIC) if parameter not set
  - [ ] Handle errors gracefully

- [ ] Write comprehensive tests (AC: #7)
  - [ ] Test democratic mode: all votes weight = 1
  - [ ] Test activity-weighted mode: weight = activity_points
  - [ ] Test mode toggling between DEMOCRATIC and ACTIVITY_WEIGHTED
  - [ ] Test vote aggregation with different weight modes
  - [ ] Test edge case: user with zero activity points

## Dev Notes

### Architecture Context

**Epic 2 Focus:** Community Governance with gas-free voting and dispute resolution

**Story 2.8 Position:** Implements flexible voting weight modes to experiment with governance models. Allows platform to toggle between one-person-one-vote (democratic) and stake-weighted (activity-based) voting systems.

**Key Components:**
- **ParameterStorage:** voting_weight_mode parameter (DEMOCRATIC or ACTIVITY_WEIGHTED)
- **Vote Weight Calculation:** Helper function to determine vote weight based on mode
- **Resolution Voting:** Updated submit-vote and aggregate-votes functions
- **Proposal Voting:** Updated submit-proposal-vote and finalize-proposal-vote functions

### Integration Points

**Dependencies:**
- Story 2.2: Vote Collection and Storage (resolution voting Edge Functions)
- Story 2.4: Proposal Voting via Snapshot (proposal voting Edge Functions)
- Epic 1 Story 1.11: Activity Point Tracking System (activity_points data)
- Epic 1 Story 1.3: ParameterStorage (parameter storage infrastructure)

**Data Flow:**
```
Admin sets voting_weight_mode parameter
    ↓
User submits vote (resolution or proposal)
    ↓
Edge Function fetches voting_weight_mode
    ↓
Democratic mode: weight = 1
OR Activity-weighted mode: query activity_points, weight = activity_points
    ↓
Store vote with calculated weight
    ↓
Vote aggregation uses weighted sum
    ↓
Result determined by weighted majority
```

### Project Structure Notes

**Modified Files:**
- `supabase/functions/submit-vote/index.ts` - Add weight calculation (Story 2.2)
- `supabase/functions/aggregate-votes/index.ts` - Use weighted sum (Story 2.3)
- `supabase/functions/submit-proposal-vote/index.ts` - Add weight calculation (Story 2.4)
- `supabase/functions/finalize-proposal-vote/index.ts` - Use weighted sum (Story 2.5)

**New Files:**
- None - This story modifies existing functions

**Database Schema:**
```sql
-- ParameterStorage: Add voting_weight_mode parameter
-- Possible values: 'DEMOCRATIC', 'ACTIVITY_WEIGHTED'
-- Default: 'DEMOCRATIC'

-- No new tables needed
-- activity_points data already exists from Story 1.11
-- votes and proposal_votes tables already store weights
```

**Alignment with Architecture:**
- Uses ParameterStorage for global configuration (established pattern)
- Modifies existing Edge Functions (Stories 2.2, 2.4) to support weight modes
- Activity points system from Epic 1 Story 1.11 provides weighted voting data
- Maintains gas-free voting pattern (off-chain weight calculation)

### Testing Strategy

**Unit Tests:**
- Vote weight calculation: democratic mode returns 1
- Vote weight calculation: activity-weighted mode returns activity_points
- Edge case: activity-weighted mode with zero points defaults to 1
- Parameter fetch: correct mode returned from ParameterStorage

**Integration Tests:**
- Full resolution voting flow with democratic mode
- Full resolution voting flow with activity-weighted mode
- Full proposal voting flow with democratic mode
- Full proposal voting flow with activity-weighted mode
- Mode toggle: switch from DEMOCRATIC → ACTIVITY_WEIGHTED → verify weight changes

**Edge Cases:**
- User with zero activity points in activity-weighted mode
- ParameterStorage parameter not set (default to DEMOCRATIC)
- Vote aggregation with mixed weights
- Proposal finalization with weighted votes

**End-to-End Tests:**
- Complete governance flow with different weight modes (deferred to Story 2.12 or Epic 4)

### Voting Weight Mode Strategy

**Democratic Mode (Default):**
- One person, one vote
- Weight = 1 for all users
- Simple, easy to understand
- Fair for small communities

**Activity-Weighted Mode:**
- Vote weight proportional to user engagement
- Weight = user's activity_points balance
- Rewards active participants
- Prevents Sybil attacks (creating fake accounts)
- Users with zero points default to weight = 1 (minimum participation)

**Admin Control:**
- Platform can toggle between modes via ParameterStorage
- Allows experimentation with different governance models
- Mode applies globally to all voting (resolution and proposal)
- Frontend displays current mode and user's weight (Epic 3)

### Implementation Notes

**Vote Weight Calculation:**
```typescript
async function getVoteWeight(
  userWallet: string,
  mode: 'DEMOCRATIC' | 'ACTIVITY_WEIGHTED'
): Promise<number> {
  if (mode === 'DEMOCRATIC') {
    return 1;
  }

  // Activity-weighted mode
  const activityPoints = await fetchUserActivityPoints(userWallet);
  return activityPoints > 0 ? activityPoints : 1; // Minimum weight = 1
}
```

**Parameter Storage:**
- ParameterStorage program state includes voting_weight_mode
- Default value: DEMOCRATIC
- Admin-only updates via set_parameter instruction
- Edge Functions query parameter before calculating weights

**Vote Storage:**
- votes table already has weight column (from Story 2.2)
- proposal_votes table already has weight column (from Story 2.4)
- No schema changes needed

**Vote Aggregation:**
- Resolution voting: weighted sum of YES/NO votes
- Proposal voting: weighted sum of APPROVE/REJECT votes
- Majority determined by weighted vote count

### References

- [Source: docs/epics.md - Story 2.8: Acceptance Criteria and Prerequisites]
- [Source: docs/stories/story-2.2.md - Vote Collection and Storage implementation]
- [Source: docs/stories/story-2.4.md - Proposal Voting implementation]
- [Source: supabase/functions/submit-vote/index.ts - Resolution voting Edge Function]
- [Source: supabase/functions/submit-proposal-vote/index.ts - Proposal voting Edge Function]

## Dev Agent Record

### Context Reference

- [Story Context 2.8](story-context-2.8.xml) - Generated: 2025-10-26

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

### File List
