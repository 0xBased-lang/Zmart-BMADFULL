# 🧪 BMAD-Zmart Devnet Testing Guide

**Quick Start Guide for Testing Frontend on Devnet**

Last Updated: 2025-10-28
Story: 4.8 - Frontend Integration Testing

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Start the Development Server

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
▲ Next.js 16.0.0
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.3s
```

### Step 2: Configure Your Wallet

1. **Open Phantom or Solflare wallet extension**
2. **Switch to Devnet:**
   - Phantom: Settings → Developer Settings → Toggle "Testnet Mode" → Select "Devnet"
   - Solflare: Settings → Network → Select "Devnet"

3. **Get Devnet SOL:**
   ```bash
   # Option 1: Command line (may be rate-limited)
   solana airdrop 2

   # Option 2: Web faucet (more reliable)
   # Visit: https://faucet.solana.com/
   # Paste your wallet address
   # Click "Send Airdrop"
   ```

### Step 3: Open and Connect

1. **Open browser:** http://localhost:3000
2. **Click "Connect Wallet"**
3. **Select your wallet (Phantom/Solflare)**
4. **Approve the connection**
5. **Verify:** Your wallet address should appear in the UI

---

## ✅ Quick Test Checklist

### 5-Minute Smoke Test

Run these tests to verify everything works:

- [ ] **Wallet Connection**
  - Connect wallet → See address in UI ✅
  - Disconnect wallet → See "Connect" button ✅

- [ ] **Navigation**
  - Visit /markets → Page loads ✅
  - Visit /leaderboard → Page loads ✅
  - Visit /proposals → Page loads ✅
  - Visit /dashboard → Page loads ✅

- [ ] **Console Check**
  - Open browser DevTools (F12)
  - Check Console tab
  - Should see no red errors ✅

---

## 🧪 Detailed Testing (30-60 Minutes)

### Test 1: Market Creation

**Goal:** Create a test market on devnet

**Steps:**
1. Navigate to "Create Market" (or /propose)
2. Fill in the form:
   - **Title:** "Test Market - Devnet"
   - **Description:** "Testing market creation flow"
   - **Outcome A:** "Yes"
   - **Outcome B:** "No"
   - **End Date:** Tomorrow
3. Click "Create Market"
4. Approve transaction in wallet
5. Wait for confirmation (~30 seconds)

**Expected Results:**
- ✅ Transaction succeeds
- ✅ Market appears in markets list
- ✅ Can navigate to market detail page
- ✅ Transaction signature is visible
- ✅ Wallet balance decreases (for transaction fee)

**If It Fails:**
- Check console for errors
- Verify wallet is on devnet
- Verify you have enough SOL
- Check transaction in [Solana Explorer](https://explorer.solana.com/?cluster=devnet)

---

### Test 2: Place a Bet

**Goal:** Place a bet on a market

**Steps:**
1. Navigate to a market detail page
2. Select an outcome (e.g., "Yes")
3. Enter bet amount (try 0.1 SOL)
4. Click "Place Bet"
5. Approve transaction
6. Wait for confirmation

**Expected Results:**
- ✅ Transaction succeeds
- ✅ Bet appears in "My Bets" section
- ✅ Market odds update
- ✅ Wallet balance decreases by bet amount + fee

**Common Issues:**
- "Insufficient balance" → Get more devnet SOL
- "Market ended" → Try a different market
- "Invalid amount" → Check minimum bet amount (usually 0.01 SOL)

---

### Test 3: Market Resolution (Admin Only)

**Goal:** Resolve a market and claim payout

**Steps:**
1. Connect with **admin wallet** (4MkybTASDtmzQnfUWztHmfgyHgBREw74eTKipVADqQLA)
2. Navigate to a market that has ended
3. Click "Resolve Market"
4. Select winning outcome
5. Approve transaction
6. **As winning bettor**, click "Claim Payout"
7. Approve claim transaction

**Expected Results:**
- ✅ Market status changes to "Resolved"
- ✅ Winning bettors can claim
- ✅ Payout received in wallet
- ✅ Bet marked as "Claimed"

---

### Test 4: Proposal Creation

**Goal:** Create a governance proposal

**Steps:**
1. Navigate to "Create Proposal" (or /propose)
2. Fill in the form:
   - **Title:** "Test Proposal"
   - **Description:** "Testing proposal system"
   - **Bond Amount:** 50 (or minimum required)
   - **Duration:** 7 days
3. Submit transaction
4. Approve in wallet

**Expected Results:**
- ✅ Proposal created
- ✅ Appears in proposals list
- ✅ Can view proposal detail
- ✅ Bond deducted from wallet

---

### Test 5: Vote on Proposal

**Goal:** Vote on a governance proposal

**Steps:**
1. Navigate to a proposal detail page
2. Select vote: "For" or "Against"
3. Click "Submit Vote"
4. Approve transaction

**Expected Results:**
- ✅ Vote recorded
- ✅ Vote tally updates
- ✅ Your vote is visible
- ✅ Cannot vote twice on same proposal

---

## 🐛 Common Issues & Solutions

### Issue: "Wallet not connected"
**Solution:**
- Refresh the page
- Try disconnecting and reconnecting
- Verify wallet extension is unlocked
- Check wallet is on devnet

### Issue: "Transaction failed"
**Solution:**
- Check devnet SOL balance
- Verify network connection
- Try again (devnet can be slow)
- Check Solana Explorer for error details

### Issue: "Program not found"
**Solution:**
- Verify `.env.local` has correct program IDs
- Restart development server
- Check programs are deployed: see `docs/DEVNET-ADDRESSES.md`

### Issue: "Market not found"
**Solution:**
- Market might not exist yet
- Try creating a new market
- Check Supabase database connection

### Issue: Page won't load
**Solution:**
- Check console for errors
- Verify `npm run dev` is running
- Try clearing browser cache
- Restart development server

---

## 📊 What to Test

### Critical Flows (Must Work)
1. ✅ Wallet connection
2. ✅ Market creation
3. ✅ Betting
4. ✅ Market resolution
5. ✅ Payout claims
6. ✅ Proposal creation
7. ✅ Proposal voting

### Secondary Flows (Should Work)
- User profile page
- Leaderboard
- Activity history
- Admin dashboard (admin wallet only)
- Comments on markets
- Dispute system

### Nice-to-Have (Test if Time)
- Mobile responsive design
- Wallet switching
- Multiple bets on same market
- Proposal execution
- Parameter updates (admin)

---

## 📝 Recording Your Tests

### Test Log Template

```markdown
## Test Session: [Date/Time]
**Tester:** [Your Name]
**Wallet:** [Your Wallet Address]
**Network:** Devnet

### Tests Completed:
- [x] Wallet Connection - ✅ Passed
- [x] Market Creation - ✅ Passed
- [x] Betting - ✅ Passed
- [x] Market Resolution - ❌ Failed (see issues below)
- [x] Proposal Creation - ⏸️ Skipped

### Issues Found:
1. **Market resolution shows wrong winner**
   - Severity: High
   - Steps: [...]
   - Screenshot: [...]

2. **Payout claim button not visible**
   - Severity: Medium
   - Steps: [...]

### Performance Notes:
- Page load time: ~2 seconds ✅
- Transaction confirmation: ~25 seconds ✅
- UI responsiveness: Good ✅

### Suggestions:
- Add loading indicator for transactions
- Improve error messages
- Show transaction progress
```

---

## 🎯 Success Criteria

**Testing is successful when:**
- ✅ All 7 critical flows work end-to-end
- ✅ No critical bugs found
- ✅ Transaction times <30 seconds
- ✅ No console errors during normal use
- ✅ UI is responsive and clear

---

## 📚 Helpful Resources

### Solana Devnet
- **Explorer:** https://explorer.solana.com/?cluster=devnet
- **Faucet:** https://faucet.solana.com/
- **RPC:** https://api.devnet.solana.com

### Program Addresses
- See: `docs/DEVNET-ADDRESSES.md`

### Documentation
- **Story 4.8:** `docs/stories/story-4.8.md`
- **Deployment:** `docs/stories/STORY-4.7-DEVNET-COMPLETE.md`

### Getting Help
- Check console errors (F12 → Console)
- Check Network tab for failed requests
- Look at transaction in Solana Explorer
- Review `.env.local` configuration

---

## 🚦 Next Steps After Testing

### If Testing Goes Well:
1. Document successful flows
2. Create test report
3. Move to comprehensive testing (Story 4.9)
4. Prepare for beta testing

### If Issues Found:
1. Document all issues clearly
2. Prioritize by severity
3. Create bug fix tasks
4. Fix and re-test
5. Repeat until stable

---

## ⚡ Quick Commands Reference

```bash
# Start development server
cd frontend && npm run dev

# Build production version
npm run build

# Check for TypeScript errors
npm run type-check

# Request devnet SOL
solana airdrop 2

# Check Solana CLI config
solana config get

# Check wallet balance
solana balance

# View program on Explorer
# https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet
```

---

**Ready to start testing!** 🚀

Open http://localhost:3000 and begin with the 5-minute smoke test above!

**Questions?** Check the resources section or review the full testing plan in `docs/stories/story-4.8.md`
