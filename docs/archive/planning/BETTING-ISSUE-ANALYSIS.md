# 🔍 BETTING ISSUE ROOT CAUSE ANALYSIS

**Date:** October 28, 2025, 11:20 PM
**Status:** ⚠️ CRITICAL ISSUE FOUND - Account Mismatch

---

## 🎯 THE PROBLEM

**Betting transactions are failing because the frontend code is passing accounts that don't match the Solana program's IDL.**

---

## 📊 EVIDENCE

### What the IDL Says (Source of Truth)
The `place_bet` instruction in the Solana program expects these accounts:

```javascript
// From core_markets.json IDL
{
  accounts: [
    1. market (PDA)
    2. user_bet (PDA)
    3. global_parameters (PDA from parameter_storage_program)
    4. bettor (signer)
    5. system_program
    6. parameter_storage_program
  ]
}
```

### What the Frontend Code Does
The `betting.ts` file is passing these accounts:

```javascript
// From lib/solana/betting.ts lines 123-132
.accounts({
  market: marketPda,
  userBet: userBetPda,
  globalParameters: globalParametersPda,
  bondEscrow: bondEscrowPda,              // ❌ NOT IN IDL
  bettor: publicKey,
  systemProgram: SystemProgram.programId,
  parameterStorageProgram: PARAMETER_STORAGE_PROGRAM_ID,
  bondManagerProgram: BOND_MANAGER_PROGRAM_ID  // ❌ NOT IN IDL
})
```

### The Mismatch

**EXTRA accounts in frontend code:**
- ❌ `bondEscrow` - Not required by IDL
- ❌ `bondManagerProgram` - Not required by IDL

**Result:** Solana rejects the transaction because account structure doesn't match the program!

---

## 🔍 WHY THIS HAPPENED

Looking at the code history, it appears:

1. The Solana program was updated (bond escrow removed or not yet implemented)
2. The IDL was regenerated from the updated program
3. BUT the frontend `betting.ts` still has old code that includes bond escrow
4. This creates a mismatch

**Evidence:**
- IDL is dated recently and doesn't include bond accounts
- Frontend code has bond escrow logic (lines 106-112 in betting.ts)
- Bond manager program ID is defined but not used by current program

---

## ✅ THE FIX

**Simple:** Remove the extra accounts from frontend code to match the IDL exactly.

### Changes Required in `lib/solana/betting.ts`

**BEFORE (lines 106-112):**
```typescript
const [bondEscrowPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('bond-escrow'),
    new BN(marketId).toArrayLike(Buffer, 'le', 8)
  ],
  BOND_MANAGER_PROGRAM_ID
)
```

**AFTER:**
```typescript
// Remove bondEscrowPda derivation - not needed in current program
```

**BEFORE (lines 123-132):**
```typescript
.accounts({
  market: marketPda,
  userBet: userBetPda,
  globalParameters: globalParametersPda,
  bondEscrow: bondEscrowPda,              // REMOVE
  bettor: publicKey,
  systemProgram: SystemProgram.programId,
  parameterStorageProgram: PARAMETER_STORAGE_PROGRAM_ID,
  bondManagerProgram: BOND_MANAGER_PROGRAM_ID  // REMOVE
})
```

**AFTER:**
```typescript
.accounts({
  market: marketPda,
  userBet: userBetPda,
  globalParameters: globalParametersPda,
  bettor: publicKey,
  systemProgram: SystemProgram.programId,
  parameterStorageProgram: PARAMETER_STORAGE_PROGRAM_ID
})
```

---

## 🎯 VALIDATION PLAN

After fixing:

1. **Code Change** - Remove bond escrow references
2. **Test Locally** - Try placing a 0.01 SOL bet
3. **Check Transaction** - Should succeed on devnet
4. **Verify Database** - Bet should appear in database
5. **Regression Test** - Ensure no other features broke

---

## 📝 ADDITIONAL NOTES

### Bond Manager Future
If bond escrow is needed in the future (Epic 2+):
1. Update the Solana program first
2. Regenerate IDL
3. Then update frontend code
4. Always keep frontend in sync with IDL

### Prevention
- **Always regenerate frontend code from IDL after program changes**
- **Run anchor build && anchor run generate-idl after program updates**
- **Test betting immediately after any program changes**

---

## 🚀 CONFIDENCE LEVEL

**95% confident this is the issue** because:
- ✅ IDL and code have clear mismatch
- ✅ Extra accounts would cause Solana to reject transaction
- ✅ Error would be "invalid account structure" or similar
- ✅ This explains why previous bet worked (if it was before program update)

---

## ⏭️ NEXT STEPS

1. ✅ Analysis complete
2. ⏳ Implement fix (remove bond escrow accounts)
3. ⏳ Test with manual browser
4. ⏳ Verify success
5. ⏳ Update ISSUES-TRACKER.md
6. ⏳ Document fix

---

**Ready to fix now!**
