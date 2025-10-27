# Testing Guide - Story 3.6: Proposal Creation Flow

## Overview

This guide covers automated testing for the proposal creation feature including E2E UI tests and Solana integration tests.

---

## 🧪 Test Suite Overview

### 1. **Playwright E2E Tests** (`e2e/proposal-creation.spec.ts`)
- **What it tests:** Complete UI flow, navigation, validation, responsive design
- **Environment:** Local dev server (http://localhost:3000)
- **Duration:** ~2-3 minutes
- **Blockchain:** No real transactions (UI only)

### 2. **Anchor Integration Test** (`../tests/proposal-creation-integration.ts`)
- **What it tests:** Actual Solana transactions on devnet
- **Environment:** Devnet blockchain
- **Duration:** ~1-2 minutes per test
- **Blockchain:** Real transactions with actual SOL

---

## 📋 Prerequisites

### For E2E Tests:
```bash
# Already installed if you followed setup
npm install
```

### For Integration Tests:
```bash
# Ensure devnet is configured
solana config set --url https://api.devnet.solana.com

# Get devnet SOL (need ~1 SOL for testing)
solana airdrop 2

# Verify balance
solana balance
```

---

## 🚀 Running Tests

### Option 1: E2E Tests Only (Recommended First)

This tests the complete UI flow without blockchain transactions:

```bash
# Run in headless mode (CI-style)
npm run test:e2e

# Run with UI (see browser, debug)
npm run test:e2e:headed

# Run with Playwright UI (interactive)
npm run test:e2e:ui
```

**What gets tested:**
- ✅ Step 1: Market Info (title, category)
- ✅ Step 2: Resolution Criteria (description, date picker, markdown preview)
- ✅ Step 3: Bond Selection (slider, tier visualization, fee calculation)
- ✅ Step 4: Preview (data display, edit navigation)
- ✅ Form validation (all fields)
- ✅ Navigation (Next/Previous buttons)
- ✅ Responsive design (mobile viewport)
- ✅ Progress indicator

**Expected result:** All 11 tests should pass in ~2-3 minutes.

### Option 2: Integration Tests (Devnet Transactions)

This tests actual blockchain transactions on devnet:

```bash
# From project root
cd /Users/seman/Desktop/Zmart-BMADFULL

# Run integration test
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
yarn run ts-mocha tests/proposal-creation-integration.ts

```

**What gets tested:**
- ✅ Create proposal transaction on devnet
- ✅ PDA derivation (proposal, globalParameters, bondEscrow)
- ✅ Transaction confirmation
- ✅ Account data verification
- ✅ Cost breakdown (bond + tax + fees)
- ✅ Bond amount validation (minimum 50 ZMart)

**Expected result:** 2 tests pass, 1 transaction created on devnet.

**Cost:** ~0.1 SOL per test run (bond + tax + fees).

### Option 3: Full Test Suite (Both E2E + Integration)

Run complete validation:

```bash
# Terminal 1: Start dev server (for E2E tests)
npm run dev

# Terminal 2: Run E2E tests
npm run test:e2e

# Terminal 3: Run integration test
cd /Users/seman/Desktop/Zmart-BMADFULL && \
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
yarn run ts-mocha tests/proposal-creation-integration.ts
```

---

## 📊 Test Results & Reports

### E2E Test Reports:

After running E2E tests:

```bash
# Open HTML report
npm run test:report
```

Report includes:
- Test execution timeline
- Screenshots on failures
- Traces for debugging
- Mobile vs desktop results

### Integration Test Output:

Console output shows:
```
Testing proposal creation on devnet...
Proposal ID: 1730045678000
Transaction signature: 3xK7...
✅ All assertions passed!

📊 Test Summary:
  - Proposal created on devnet
  - Transaction confirmed
  - Account data verified
  - Cost breakdown validated
```

---

## 🔍 Test Coverage

### Acceptance Criteria Coverage:

| AC | Description | E2E Test | Integration Test |
|----|-------------|----------|------------------|
| AC1 | Multi-step wizard | ✅ | N/A |
| AC2 | Step 1 - Market Info | ✅ | N/A |
| AC3 | Step 2 - Resolution | ✅ | N/A |
| AC4 | Step 3 - Bond Selection | ✅ | ✅ |
| AC5 | Step 4 - Preview | ✅ | N/A |
| AC6 | Validation | ✅ | ✅ |
| AC7 | Submit Transaction | ⏳ | ✅ |
| AC8 | Success State | ⏳ | ✅ |
| AC9 | Devnet Testing | N/A | ✅ |

**Legend:**
- ✅ Fully tested
- ⏳ Partially tested (UI mock, not real wallet)
- N/A Not applicable

---

## 🐛 Debugging Tests

### E2E Test Debugging:

```bash
# Run specific test
npx playwright test -g "should complete Step 1"

# Run in debug mode
npx playwright test --debug

# Show test report
npm run test:report
```

### Integration Test Debugging:

```bash
# Verbose output
yarn run ts-mocha tests/proposal-creation-integration.ts --reporter spec

# Check transaction on Explorer
# Copy signature from output and paste in:
# https://explorer.solana.com/?cluster=devnet
```

---

## ✅ Success Criteria

### E2E Tests:
- ✅ All 11 tests pass
- ✅ No console errors
- ✅ Mobile and desktop views work
- ✅ Form validation catches errors
- ✅ Navigation flows correctly

### Integration Tests:
- ✅ Transaction confirms on devnet
- ✅ Proposal account created
- ✅ Data matches input
- ✅ Cost calculation correct
- ✅ Validation enforced

---

## 🚫 Known Limitations

### E2E Tests:
- **No Wallet Integration**: Cannot test actual wallet popups (would require Phantom/Solflare automation)
- **No Real Transactions**: Submit button interaction is limited without wallet

### Integration Tests:
- **Requires SOL**: Need devnet SOL for each test run
- **Network Dependent**: Fails if devnet is down or slow
- **Sequential Only**: Cannot parallelize (nonce conflicts)

---

## 📝 Next Steps

After all tests pass:

1. ✅ Verify E2E tests pass (11/11)
2. ✅ Verify integration test passes (2/2)
3. ✅ Check transaction on Solana Explorer
4. ✅ Verify proposal data in Supabase
5. ✅ Run `/bmad:bmm:workflows:story-done 3.6` to complete story

---

## 🔗 Related Documentation

- **E2E Test File:** `frontend/e2e/proposal-creation.spec.ts`
- **Integration Test:** `tests/proposal-creation-integration.ts`
- **Playwright Config:** `frontend/playwright.config.ts`
- **Story Documentation:** `docs/stories/story-3.6.md`

---

## 💡 Tips

1. **Run E2E first** - Faster and doesn't cost SOL
2. **Use headed mode** - See what's happening (`npm run test:e2e:headed`)
3. **Check reports** - HTML report shows detailed results
4. **Monitor devnet** - Sometimes slow, be patient
5. **Keep SOL topped up** - Need ~1 SOL for multiple test runs

---

**Questions?** Check the Playwright docs or Anchor testing guide.
