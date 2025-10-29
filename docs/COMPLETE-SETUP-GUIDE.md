# 🎯 COMPLETE DEVNET SETUP - Everything You Need

**The Real Issues:**
1. ✅ Markets exist in database (2 active markets)
2. ❌ Database schema mismatch (missing columns in proposals table)
3. ❌ Need working test data and flows
4. ❌ Need to verify betting actually works

---

## 🚨 ROOT CAUSE ANALYSIS

### Issue #1: Database Schema Mismatch
**Problem:** Supabase local database schema doesn't match TypeScript types

**Evidence:**
- TypeScript types define `market_question`, `market_description`, `market_category`
- Supabase rejects inserts saying these columns don't exist
- Schema drift between migrations and type definitions

**Solution:** Check actual Supabase schema and either:
1. Add missing columns via migration
2. Or simplify inserts to use only existing columns

### Issue #2: No Way to Create Markets from UI
**Problem:** User says "I don't see any proposal where I can create markets"

**Root Cause:**
- Proposals can be created via /propose page
- But there's no visual indication or existing proposals to vote on
- Proposals were empty in database (just populated 0 due to schema issues)

**Solution:**
1. Fix database schema first
2. Then populate test proposals
3. Or add direct market creation UI (bypass proposals)

### Issue #3: Betting May Not Work
**Problem:** User says "I still can't place bets"

**Possible Causes:**
1. Markets exist but UI isn't showing them
2. Markets showing but betting panel has transaction issues
3. Wallet not connected
4. PDA derivation issues

**Next Steps:** Test the full flow step-by-step

---

## ✅ WORKING SOLUTION: Direct SQL Approach

Instead of fighting TypeScript/Supabase mismatch, let's directly insert via SQL:

```sql
-- Insert test proposals (bypassing schema validation)
INSERT INTO proposals (
  proposal_id,
  proposer_wallet,
  proposal_type,
  title,
  description,
  status,
  voting_ends_at,
  created_at,
  updated_at
) VALUES
(1001, '4MkybTASDtmzQnfUWztHmfgyHgBREw74eTKipVADqQLA', 'create_market',
 'Create Market: Will SOL reach $300 by 2025?',
 'Community proposal to create a prediction market for SOL price reaching $300',
 'active', NOW() + INTERVAL '7 days', NOW(), NOW()),

(1002, '4MkybTASDtmzQnfUWztHmfgyHgBREw74eTKipVADqQLA', 'create_market',
 'Create Market: Will ETH gas fees drop below 10 gwei?',
 'Prediction market for Ethereum gas fee reduction',
 'active', NOW() + INTERVAL '7 days', NOW(), NOW()),

(1003, '4MkybTASDtmzQnfUWztHmfgyHgBREw74eTKipVADqQLA', 'create_market',
 'Create Market: SpaceX Mars landing in 2025?',
 'Will SpaceX successfully land on Mars this year?',
 'active', NOW() + INTERVAL '7 days', NOW(), NOW());
```

---

## 🎯 IMMEDIATE ACTION PLAN

### Step 1: Connect to Supabase DB
```bash
# Option A: psql command line
psql postgresql://postgres:postgres@localhost:54322/postgres

# Option B: Supabase Studio
open http://localhost:54323
```

### Step 2: Check Actual Schema
```sql
-- See what columns actually exist in proposals table
\d proposals

-- Or in SQL:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'proposals';
```

### Step 3: Insert Minimal Test Proposals
```sql
-- Use ONLY columns that actually exist
INSERT INTO proposals (
  proposal_id,
  proposer_wallet,
  proposal_type,
  title,
  description,
  status,
  voting_ends_at
) VALUES
(1001, '4MkybTASDtmzQnfUWztHmfgyHgBREw74eTKipVADqQLA', 'create_market',
 'Create SOL Price Market', 'SOL to $300?', 'active', NOW() + INTERVAL '7 days');
```

### Step 4: Verify Data Exists
```bash
curl -s "http://localhost:54321/rest/v1/proposals?select=*" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
```

### Step 5: Test Frontend
1. Open http://localhost:3000
2. Go to /proposals
3. Should see test proposals
4. Vote on one
5. Check if voting works

### Step 6: Test Betting Flow
1. Go to homepage (/)
2. Should see 2 active markets
3. Click on Market ID 1
4. Connect wallet (devnet mode)
5. Try to place a bet
6. Watch for errors in console

---

## 🐛 DEBUGGING BETTING ISSUES

If betting doesn't work, check these in order:

### Check #1: Markets Loading
```javascript
// Open browser console on homepage
// Should see markets data:
console.log('Markets:', markets)
```

### Check #2: Wallet Connection
```javascript
// In console after connecting:
console.log('Wallet:', window.solana || window.solflare)
console.log('Connected:', connected)
console.log('PublicKey:', publicKey?.toString())
```

### Check #3: Transaction Building
```javascript
// Watch console when clicking "Place Bet"
// Should see transaction being built
// Look for errors in program.methods or PDA derivation
```

### Check #4: Program IDs Match
```javascript
// Verify env vars loaded:
console.log('Core Markets:', process.env.NEXT_PUBLIC_CORE_MARKETS_ID)
// Should be: 6BBZWsJZq23k2NX3YnENgXTEPhbVEHXYmPxmamN83eEV
```

---

## 🎯 SIMPLIFIED TESTING PATH

**Skip proposals entirely, test betting directly:**

1. ✅ Markets already exist (checked earlier)
2. Open http://localhost:3000
3. See markets listed
4. Click one
5. Connect wallet
6. Place bet
7. Document what happens

**If betting fails, the error message will tell us exactly what's wrong:**
- "Insufficient balance" → Need more devnet SOL
- "Market not found" → PDA derivation issue
- "Transaction failed" → Check program logs
- Nothing happens → Check console errors

---

## 📋 NEXT IMMEDIATE STEPS

1. **YOU:** Open http://localhost:3000 in browser
2. **YOU:** Tell me what you see (do markets load?)
3. **YOU:** Try connecting wallet
4. **YOU:** Try placing a bet on Market #1
5. **YOU:** Copy any error messages from console
6. **ME:** Fix whatever the actual error is

---

**The best way forward: Test the actual flow and fix real errors, not predicted ones.**

Let's do this step-by-step together! 🚀
