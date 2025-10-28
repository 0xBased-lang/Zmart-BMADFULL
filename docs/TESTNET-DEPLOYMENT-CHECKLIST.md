# 📋 TESTNET DEPLOYMENT CHECKLIST

**Project:** BMAD-Zmart
**Deployment Target:** Solana Testnet
**Story:** 4.7-testnet
**Last Updated:** 2025-10-28

---

## 🔧 PRE-DEPLOYMENT CHECKLIST

### Environment Setup
- [ ] Solana CLI installed and updated to latest version
- [ ] Anchor framework installed (v0.30.0+)
- [ ] Node.js 18+ and npm/yarn installed
- [ ] Git repository clean (no uncommitted changes)
- [ ] All tests passing locally

### Wallet & Keys
- [ ] Deployer wallet created and backed up
- [ ] Wallet funded with testnet SOL (minimum 10 SOL)
- [ ] Program keypairs generated for all 6 programs
- [ ] Keypairs backed up securely

### Configuration Files
- [ ] Anchor.toml configured for testnet
- [ ] Frontend .env.testnet file created
- [ ] All program IDs documented

---

## 🚀 DEPLOYMENT PHASE 1: PROGRAMS

### Step 1: Configure Solana CLI
```bash
□ solana config set --url https://api.testnet.solana.com
□ solana config get (verify testnet URL)
□ solana balance (check deployer wallet)
□ solana airdrop 2 (if balance < 5 SOL)
```

### Step 2: Generate Program Keypairs
```bash
□ mkdir -p keys/testnet
□ Generate parameter-storage keypair
□ Generate program-registry keypair
□ Generate bond-manager keypair
□ Generate proposal-system keypair
□ Generate market-maker keypair
□ Generate market-resolution keypair
□ Document all addresses in TESTNET-ADDRESSES.md
```

### Step 3: Build Programs
```bash
□ anchor clean
□ anchor build -- --features testnet
□ Verify all .so files < 1MB
□ Check for build warnings/errors
```

### Step 4: Deploy Programs (IN ORDER)
```bash
□ Deploy parameter-storage (no deps)
□ Verify: solana program show <address>
□ Deploy program-registry (no deps)
□ Verify: solana program show <address>
□ Deploy bond-manager (deps: parameter-storage)
□ Verify: solana program show <address>
□ Deploy proposal-system (deps: parameter-storage)
□ Verify: solana program show <address>
□ Deploy market-maker (deps: bond-manager, parameter-storage)
□ Verify: solana program show <address>
□ Deploy market-resolution (deps: market-maker)
□ Verify: solana program show <address>
```

### Step 5: Initialize Programs
```bash
□ Run scripts/initialize-testnet.ts
□ Initialize ProgramRegistry
  □ Set admin account
  □ Verify initialization: success
□ Register all 6 programs
  □ bond_manager registered
  □ market_maker registered
  □ market_resolution registered
  □ parameter_storage registered
  □ proposal_system registered
  □ program_registry registered
□ Initialize ParameterStorage
  □ Set admin account
  □ Set testnet parameters:
    □ bondAmount: 1 USDC
    □ disputeWindow: 5 minutes
    □ minMarketDuration: 1 minute
    □ maxMarketDuration: 1 day
    □ platformFeeRate: 2.5%
    □ creatorFeeRate: 1%
  □ Verify parameters set correctly
□ Initialize GlobalFeatureToggles
  □ Enable testing features
  □ Set progressive rollout flags
```

---

## 🌐 DEPLOYMENT PHASE 2: FRONTEND

### Step 1: Frontend Configuration
```bash
□ Create frontend/.env.testnet
□ Set NEXT_PUBLIC_NETWORK=testnet
□ Set NEXT_PUBLIC_RPC_ENDPOINT
□ Add all 6 program IDs
□ Enable testnet feature flags
□ Configure wallet adapters
```

### Step 2: Update Frontend Code
```bash
□ Update lib/constants/program-ids.ts
□ Update wallet provider configuration
□ Update RPC connection settings
□ Verify all hooks use testnet IDs
```

### Step 3: Build & Deploy Frontend
```bash
□ cd frontend
□ npm install
□ npm run build:testnet
□ Check for build errors
□ Deploy to staging (Vercel/custom)
□ Document staging URL
```

---

## ✅ DEPLOYMENT PHASE 3: VERIFICATION

### Program Verification
- [ ] All 6 programs respond to `solana program show`
- [ ] Program sizes within limits (<1MB)
- [ ] Program ownership verified
- [ ] No deployment errors in logs

### Integration Testing
```bash
□ Connect wallet to testnet
□ Frontend loads without errors
□ Can fetch program IDLs
□ Can query program accounts
□ Transaction signing works
```

### User Flow Testing
- [ ] **Market Creation Flow**
  - [ ] Create market form loads
  - [ ] Can submit transaction
  - [ ] Market appears in list
  - [ ] Market detail page works

- [ ] **Betting Flow**
  - [ ] Can select outcome
  - [ ] Bet amount validation works
  - [ ] Transaction submits successfully
  - [ ] Bet appears in user profile

- [ ] **Resolution Flow**
  - [ ] Can resolve market (admin)
  - [ ] Dispute button works
  - [ ] Vote on dispute works
  - [ ] Resolution finalizes correctly

- [ ] **Payout Flow**
  - [ ] Claim button appears for winners
  - [ ] Payout transaction succeeds
  - [ ] Balance updates correctly

- [ ] **Proposal Flow**
  - [ ] Create proposal works
  - [ ] Voting interface loads
  - [ ] Can cast vote
  - [ ] Execution works (if passed)

### Error Handling
- [ ] Network errors show proper messages
- [ ] Transaction failures handled gracefully
- [ ] Wallet disconnection handled
- [ ] Rate limiting works

### Performance Checks
- [ ] Page load time < 3 seconds
- [ ] Transaction confirmation < 30 seconds
- [ ] No console errors
- [ ] Memory usage stable

---

## 📊 POST-DEPLOYMENT VERIFICATION

### Monitoring Setup
```bash
□ Set up monitoring script (scripts/monitor-testnet.ts)
□ Configure log aggregation
□ Set up alerts for errors
□ Monitor transaction success rate
```

### Documentation
```bash
□ Update TESTNET-ADDRESSES.md with all addresses
□ Document any issues encountered
□ Create troubleshooting guide
□ Update README with testnet instructions
```

### Team Communication
- [ ] Notify team of testnet deployment
- [ ] Share staging URL
- [ ] Request testing from team members
- [ ] Collect feedback

---

## 🔄 ROLLBACK PROCEDURES

### If Critical Issues Found:

1. **Document Issues**
   - [ ] Screenshot errors
   - [ ] Save transaction signatures
   - [ ] Export logs

2. **Halt Frontend**
   - [ ] Take staging offline
   - [ ] Display maintenance message

3. **Fix Issues**
   - [ ] Identify root cause
   - [ ] Implement fixes
   - [ ] Test locally

4. **Redeploy**
   - [ ] Redeploy affected programs only
   - [ ] Update frontend if needed
   - [ ] Re-run verification

---

## 📝 SIGN-OFF

### Deployment Complete When:
- [ ] All programs deployed and initialized
- [ ] Frontend deployed and accessible
- [ ] All user flows tested successfully
- [ ] No critical bugs remaining
- [ ] Documentation complete
- [ ] Team notified

### Final Verification:
- [ ] Technical Lead Sign-off: ____________
- [ ] QA Sign-off: ____________
- [ ] Product Owner Sign-off: ____________
- [ ] Date/Time: ____________

---

## 📋 NOTES & ISSUES

### Deployment Notes:
```
[Add any deployment notes here]
```

### Issues Encountered:
```
[Document any issues and resolutions]
```

### Lessons Learned:
```
[Note any improvements for next deployment]
```

---

**REMEMBER:**
- Take your time, don't rush
- Test everything thoroughly
- Document all issues
- Testnet is for finding problems - that's good!
- Better to find issues on testnet than mainnet

**Next Step After Completion:** Story 4.8-frontend (Frontend Integration Testing)