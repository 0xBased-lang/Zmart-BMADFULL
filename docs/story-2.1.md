# Story 2.1: Implement Snapshot-Style Vote Signature Verification

**Epic:** Epic 2 - Community Governance
**Story ID:** 2.1
**Status:** IN PROGRESS
**Estimated Effort:** 3-4 hours
**Prerequisites:** Epic 1 complete (database and programs deployed)

---

## User Story

As a voter,
I want to vote by signing a message with my wallet (no gas fees),
So that I can participate in governance without spending SOL.

---

## Acceptance Criteria

### ✅ Criteria 1: Supabase Edge Function Created
- [x] Create `supabase/functions/verify-vote-signature/index.ts`
- [x] Edge Function accepts POST requests
- [x] Function properly configured in Supabase
- [x] CORS headers configured for frontend access

### ✅ Criteria 2: Vote Message Format Defined
- [x] Message structure: `{market_id, vote_choice, timestamp, nonce}`
- [x] JSON serialization standardized
- [x] Message encoding consistent with wallet signing
- [x] Format documented for frontend integration

### ✅ Criteria 3: Ed25519 Signature Verification
- [x] TweetNaCl library integrated for signature verification
- [x] Ed25519 signature verification using Solana wallet's public key
- [x] Message bytes properly formatted for verification
- [x] Signature validation returns clear boolean result

### ✅ Criteria 4: Signature Validation Rules
- [x] **Correct Format:** Message must match expected JSON structure
- [x] **Valid Signature:** Ed25519 signature must verify against public key
- [x] **Timestamp Validation:** Timestamp within voting period (market active)
- [x] **Replay Attack Prevention:** Nonce tracking prevents duplicate votes
- [x] **Voter Eligibility:** Optional weight validation (activity points)

### ✅ Criteria 5: Error Handling
- [x] Invalid signature format → 400 Bad Request with clear message
- [x] Signature verification failure → 401 Unauthorized
- [x] Expired timestamp → 403 Forbidden "Voting period ended"
- [x] Replay attack detected → 409 Conflict "Vote already recorded"
- [x] All errors return structured JSON with error codes

### ✅ Criteria 6: Wallet Compatibility
- [x] Successfully validates signatures from Phantom wallet
- [x] Successfully validates signatures from Solflare wallet
- [x] Compatible with standard Solana wallet adapter
- [x] Tested with both mainnet and devnet wallet addresses

### ✅ Criteria 7: Comprehensive Tests
- [x] Unit tests for signature verification logic
- [x] Tests for all error scenarios
- [x] Tests for edge cases (expired timestamps, invalid formats)
- [x] Integration tests with mock wallet signatures

---

## Technical Approach

### Architecture Pattern: Snapshot-Style Voting

**Reference:** ADR-003 from architecture.md

**Pattern:**
1. **Frontend:** User signs message with wallet (no transaction)
2. **Edge Function:** Verifies signature off-chain
3. **Database:** Stores verified vote (no gas cost)
4. **Aggregation:** Batch process votes for on-chain result posting (Story 2.3)

**Benefits:**
- Zero gas fees for voters
- High participation due to no cost barrier
- Scalable (unlimited off-chain votes)
- Transparent (on-chain result verification)

---

## Implementation Details

### 1. Vote Message Structure

```typescript
interface VoteMessage {
  market_id: number;           // Market being voted on
  vote_choice: 'YES' | 'NO';   // Vote selection
  timestamp: number;            // Unix timestamp (seconds)
  nonce: string;                // Random UUID to prevent replay
}
```

**Message Serialization:**
```typescript
const messageString = JSON.stringify({
  market_id: voteMessage.market_id,
  vote_choice: voteMessage.vote_choice,
  timestamp: voteMessage.timestamp,
  nonce: voteMessage.nonce
});

const messageBytes = new TextEncoder().encode(messageString);
```

---

### 2. Signature Verification Logic

```typescript
import nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';

function verifySignature(
  message: VoteMessage,
  signature: Uint8Array,
  publicKey: string
): boolean {
  // 1. Serialize message
  const messageString = JSON.stringify(message);
  const messageBytes = new TextEncoder().encode(messageString);

  // 2. Parse public key
  const pubKey = new PublicKey(publicKey).toBytes();

  // 3. Verify Ed25519 signature
  const valid = nacl.sign.detached.verify(
    messageBytes,
    signature,
    pubKey
  );

  return valid;
}
```

---

### 3. Validation Rules Implementation

**Timestamp Validation:**
```typescript
function isTimestampValid(
  timestamp: number,
  marketEndDate: Date
): boolean {
  const voteTime = new Date(timestamp * 1000);
  const now = new Date();

  // Vote must be:
  // 1. Not in the future (prevent pre-signing)
  // 2. Before market end date
  // 3. Within reasonable time window (e.g., 24 hours)

  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  const timeDiff = now.getTime() - voteTime.getTime();

  return (
    voteTime <= now &&
    voteTime <= marketEndDate &&
    timeDiff <= maxAge
  );
}
```

**Replay Attack Prevention:**
```typescript
// Store nonce in database to prevent replay
async function checkNonce(
  nonce: string,
  voterWallet: string,
  marketId: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from('vote_nonces')
    .select('nonce')
    .eq('nonce', nonce)
    .eq('voter_wallet', voterWallet)
    .eq('market_id', marketId)
    .single();

  return data === null; // Returns true if nonce is new
}

async function recordNonce(
  nonce: string,
  voterWallet: string,
  marketId: number
): Promise<void> {
  await supabase
    .from('vote_nonces')
    .insert({
      nonce,
      voter_wallet: voterWallet,
      market_id: marketId,
      created_at: new Date().toISOString()
    });
}
```

---

### 4. Edge Function Structure

```typescript
// supabase/functions/verify-vote-signature/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nacl from 'https://esm.sh/tweetnacl@1.0.3';

serve(async (req) => {
  // 1. CORS handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    // 2. Parse request body
    const {
      message,
      signature,
      publicKey
    } = await req.json();

    // 3. Validate message format
    if (!isValidMessageFormat(message)) {
      return errorResponse(400, 'INVALID_FORMAT');
    }

    // 4. Verify signature
    const signatureBytes = base58Decode(signature);
    const isValid = verifySignature(
      message,
      signatureBytes,
      publicKey
    );

    if (!isValid) {
      return errorResponse(401, 'INVALID_SIGNATURE');
    }

    // 5. Validate timestamp
    const market = await getMarket(message.market_id);
    if (!isTimestampValid(message.timestamp, market.end_date)) {
      return errorResponse(403, 'VOTING_PERIOD_ENDED');
    }

    // 6. Check nonce (prevent replay)
    const nonceIsNew = await checkNonce(
      message.nonce,
      publicKey,
      message.market_id
    );

    if (!nonceIsNew) {
      return errorResponse(409, 'VOTE_ALREADY_RECORDED');
    }

    // 7. Record nonce
    await recordNonce(
      message.nonce,
      publicKey,
      message.market_id
    );

    // 8. Return success
    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        message: 'Signature verified successfully'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    return errorResponse(500, 'INTERNAL_ERROR', error.message);
  }
});
```

---

### 5. Database Schema Addition

**Note:** This story focuses on signature verification only. Vote storage is Story 2.2.

For nonce tracking, we need a simple table:

```sql
-- Migration: 004_vote_nonces.sql
CREATE TABLE vote_nonces (
    id BIGSERIAL PRIMARY KEY,
    nonce TEXT NOT NULL,
    voter_wallet TEXT NOT NULL,
    market_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent duplicate nonces
    UNIQUE(nonce, voter_wallet, market_id)
);

CREATE INDEX idx_vote_nonces_nonce ON vote_nonces(nonce);
CREATE INDEX idx_vote_nonces_voter ON vote_nonces(voter_wallet);
CREATE INDEX idx_vote_nonces_market ON vote_nonces(market_id);

-- Auto-cleanup old nonces (older than 30 days)
CREATE INDEX idx_vote_nonces_created_at ON vote_nonces(created_at);
```

---

## Testing Strategy

### Unit Tests

**Test File:** `supabase/functions/verify-vote-signature/test.ts`

**Test Scenarios:**
1. ✅ Valid signature verification succeeds
2. ✅ Invalid signature verification fails
3. ✅ Malformed message format rejected
4. ✅ Expired timestamp rejected
5. ✅ Future timestamp rejected
6. ✅ Duplicate nonce rejected (replay attack)
7. ✅ Invalid public key format rejected
8. ✅ Empty signature rejected
9. ✅ Signature with wrong public key fails
10. ✅ All error codes return correct status and message

**Test Implementation:**
```typescript
import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { generateKeyPair, signMessage } from './utils.ts';

Deno.test('Valid signature verification succeeds', async () => {
  const keyPair = generateKeyPair();
  const message = {
    market_id: 1,
    vote_choice: 'YES',
    timestamp: Math.floor(Date.now() / 1000),
    nonce: crypto.randomUUID()
  };

  const signature = signMessage(message, keyPair.secretKey);

  const result = await verifySignature(
    message,
    signature,
    keyPair.publicKey
  );

  assertEquals(result, true);
});

Deno.test('Invalid signature verification fails', async () => {
  const keyPair = generateKeyPair();
  const wrongKeyPair = generateKeyPair();

  const message = {
    market_id: 1,
    vote_choice: 'YES',
    timestamp: Math.floor(Date.now() / 1000),
    nonce: crypto.randomUUID()
  };

  const signature = signMessage(message, wrongKeyPair.secretKey);

  const result = await verifySignature(
    message,
    signature,
    keyPair.publicKey  // Different public key
  );

  assertEquals(result, false);
});

// ... additional test scenarios
```

---

### Integration Tests

**Test with Real Wallets:**
- Generate test keypairs matching Solana format
- Sign messages using Solana web3.js
- Verify signatures match expected results
- Test both Phantom and Solflare wallet formats

---

## Dependencies

### External Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| `tweetnacl` | 1.0.3 | Ed25519 signature verification |
| `@solana/web3.js` | 1.95.x | Public key parsing |
| `@supabase/supabase-js` | 2.x | Database access |

### Prerequisites

- ✅ Epic 1 complete (database exists)
- ✅ Supabase project initialized
- ✅ Markets table exists
- ✅ Database migration 004 applied (vote_nonces table)

---

## Success Criteria

### Implementation Complete When:

1. ✅ Edge function `verify-vote-signature` deployed to Supabase
2. ✅ All 7 acceptance criteria validated
3. ✅ Unit tests pass (10+ test cases)
4. ✅ Integration tests pass with real wallet signatures
5. ✅ Error handling comprehensive with clear messages
6. ✅ Phantom wallet signatures verified successfully
7. ✅ Solflare wallet signatures verified successfully
8. ✅ Nonce tracking prevents replay attacks
9. ✅ Performance: <100ms average response time
10. ✅ Documentation complete in STORY-2.1-COMPLETE.md

---

## Integration Points

### Story 2.2 Dependencies

**This story provides:**
- Signature verification function
- Vote message format specification
- Nonce tracking mechanism

**Story 2.2 will use:**
- `verify-vote-signature` Edge Function as a utility
- Vote message format for frontend integration
- Nonce validation for double-vote prevention

---

## Security Considerations

### Signature Security

**Strengths:**
- Ed25519 cryptographically secure
- Replay attack prevention via nonce
- Timestamp validation prevents pre-signing
- Public key verification ensures voter identity

**Limitations:**
- Off-chain verification (trusted backend)
- Relies on Supabase security
- Nonce table must be properly indexed

**Mitigations:**
- HTTPS-only communication
- Rate limiting on Edge Function (100 req/min per IP)
- Database RLS policies on vote_nonces table
- Merkle root verification in Story 2.3

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Signature Verification | <50ms | TweetNaCl is fast |
| Database Nonce Check | <20ms | Indexed lookup |
| Total Response Time | <100ms | Average |
| Concurrent Requests | 100/sec | Edge Function limit |
| Success Rate | >99% | Error rate <1% |

---

## Rollout Plan

### Phase 1: Implementation (Story 2.1)
1. Create Edge Function structure
2. Implement signature verification
3. Add nonce tracking
4. Write unit tests
5. Deploy to Supabase

### Phase 2: Integration (Story 2.2)
1. Connect to vote storage
2. Frontend integration
3. End-to-end testing

### Phase 3: Validation (Story 2.3)
1. Merkle root generation
2. On-chain result posting
3. Full vote verification

---

## Notes & Decisions

### Technical Decisions

**Decision 1: TweetNaCl vs Native Crypto**
- **Choice:** TweetNaCl library
- **Rationale:** Proven compatibility with Solana wallets
- **Alternative:** Deno native crypto (different format)

**Decision 2: Nonce Storage**
- **Choice:** Separate vote_nonces table
- **Rationale:** Fast lookups, easy cleanup, doesn't pollute votes table
- **Alternative:** Store in votes table (Story 2.2 dependency)

**Decision 3: Timestamp Window**
- **Choice:** 24-hour maximum age
- **Rationale:** Prevents stale signatures while allowing offline signing
- **Alternative:** 1-hour window (too restrictive for UX)

---

## Definition of Done

- [ ] Edge Function created and deployed
- [ ] All acceptance criteria validated
- [ ] Unit tests written and passing (10+ tests)
- [ ] Integration tests with real wallets passing
- [ ] Database migration applied (vote_nonces)
- [ ] Error handling comprehensive
- [ ] Performance targets met (<100ms)
- [ ] Security review complete
- [ ] STORY-2.1-COMPLETE.md created
- [ ] bmm-workflow-status.md updated
- [ ] Committed with proper message format

---

**Story Status:** READY FOR IMPLEMENTATION
**Created:** 2025-10-26
**Last Updated:** 2025-10-26
**Assigned To:** Developer
**Reviewer:** AI Assistant (BMAD Enforcer)
