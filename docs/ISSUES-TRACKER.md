# 🐛 ZMART ISSUES TRACKER

**Last Updated:** October 28, 2025, 11:00 PM
**Purpose:** Central tracking document for all system issues
**Status Legend:** 🔴 Critical | 🟡 High | 🟢 Medium | ⚪ Low | ✅ Fixed | 🔄 In Progress

---

## 📊 SUMMARY DASHBOARD

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Betting | 1 | 0 | 0 | 0 | 1 |
| UI/UX | 0 | 0 | 0 | 0 | 0 |
| Data Sync | 0 | 0 | 0 | 0 | 0 |
| Database | 0 | 0 | 0 | 0 | 0 |
| Performance | 0 | 0 | 0 | 0 | 0 |
| **TOTAL** | **1** | **0** | **0** | **0** | **1** |

---

## 🔴 CRITICAL ISSUES (Block Core Functionality)

### ISSUE-001: Betting Transaction Fails
**Status:** 🔄 In Progress
**Priority:** 🔴 Critical
**Category:** Betting
**Discovered:** October 28, 2025
**Affects:** All users trying to place bets

**Description:**
Users cannot place bets through the UI. The betting flow appears to work up to a certain point but fails during transaction.

**Symptoms:**
- User can connect wallet ✅
- User can select YES/NO ✅
- User can enter amount ✅
- User can click "Place Bet" ✅
- Transaction fails at unknown step ❌

**Impact:**
- **Severity:** CRITICAL - Core functionality broken
- **Users Affected:** 100% of betting users
- **Workaround:** None
- **Business Impact:** Platform unusable for primary function

**Investigation Status:**
- [ ] Browser console errors captured
- [ ] Network requests logged
- [ ] Solana transaction logs checked
- [ ] Program account state verified
- [ ] Wallet interaction tested
- [ ] Error messages documented

**Technical Details:**
```
Component: frontend/app/markets/[id]/components/BettingPanel.tsx
Function: confirmBet() → placeBet()
Program: 6BBZWsJZq23k2NX3YnENgXTEPhbVEHXYmPxmamN83eEV
Network: Devnet
```

**Reproduction Steps:**
1. Navigate to market detail page (e.g., /markets/2)
2. Connect Phantom wallet
3. Select YES or NO
4. Enter amount (e.g., 0.1 SOL)
5. Click "Place Bet"
6. Click "Confirm Bet" in modal
7. Observe failure

**Last Known Working State:**
- Previous bet succeeded: October 28, 2025, ~3:00 PM
- Transaction: MWFp6Nbkj7qhTYs3mwYLJYMPC6qB8LKmyXWEJwaJJgh...
- Amount: 0.1 SOL YES on Market #2

**Root Cause:** TBD - Requires systematic diagnosis

**Fix Strategy:**
1. ✅ Set up automated testing
2. ⏳ Capture exact error with Playwright
3. ⏳ Analyze error logs
4. ⏳ Identify root cause
5. ⏳ Implement fix
6. ⏳ Verify with automated test
7. ⏳ Document solution

**Assigned To:** Claude (AI Assistant)
**Target Resolution:** October 29, 2025

---

## 🟡 HIGH PRIORITY ISSUES

*None currently identified - will be populated by automated testing*

---

## 🟢 MEDIUM PRIORITY ISSUES

*None currently identified - will be populated by automated testing*

---

## ⚪ LOW PRIORITY ISSUES

*None currently identified - will be populated by automated testing*

---

## ✅ RECENTLY FIXED ISSUES

### FIXED-001: Old Anchor Imports Breaking Build
**Status:** ✅ Fixed
**Priority:** 🔴 Critical
**Fixed On:** October 28, 2025, 10:45 PM
**Category:** Build System

**Description:**
Old `@project-serum/anchor` imports were breaking Next.js build.

**Fix:**
Replaced all 7 occurrences with `@coral-xyz/anchor`:
- `lib/admin/parameters.ts`
- `lib/admin/toggles.ts`
- `lib/hooks/useProposalSubmit.ts`
- `lib/hooks/useToggles.ts`
- `lib/hooks/useClaimPayouts.ts`
- `lib/hooks/useParameters.ts`
- `app/markets/[id]/components/BettingPanel.tsx`

**Command Used:**
```bash
find lib app -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/@project-serum\/anchor/@coral-xyz\/anchor/g' {} +
```

**Validation:** ✅ Build succeeds, pages load

---

## 📝 ISSUE TEMPLATES

### New Issue Template
```markdown
### ISSUE-XXX: [Short Title]
**Status:** 🔴/🟡/🟢/⚪
**Priority:** Critical/High/Medium/Low
**Category:** Betting/UI/Database/Performance/Other
**Discovered:** [Date]

**Description:**
[What is broken or not working as expected]

**Symptoms:**
- [Observable behavior 1]
- [Observable behavior 2]

**Impact:**
- Severity: [Critical/High/Medium/Low]
- Users Affected: [Percentage or number]
- Workaround: [If any]

**Reproduction Steps:**
1. [Step 1]
2. [Step 2]
3. [Expected vs Actual]

**Technical Details:**
[File paths, function names, error messages]

**Root Cause:** [TBD or explanation]

**Fix Strategy:**
- [ ] Investigation step 1
- [ ] Implementation step 2
- [ ] Validation step 3
```

---

## 🔄 WORKFLOW

### Issue Lifecycle
1. **Discovery** - Issue found through testing or user report
2. **Documentation** - Add to this tracker with full details
3. **Triage** - Assign priority and category
4. **Investigation** - Diagnose root cause
5. **Implementation** - Fix the issue
6. **Validation** - Test the fix works
7. **Closure** - Move to "Fixed" section
8. **Review** - Learn and prevent similar issues

### Priority Definitions
- **🔴 Critical:** Blocks core functionality, affects all users
- **🟡 High:** Major feature broken, affects many users
- **🟢 Medium:** Minor feature issue, affects some users
- **⚪ Low:** Cosmetic or edge case, affects few users

### SLA (Service Level Agreements)
- **Critical:** Fix within 4 hours
- **High:** Fix within 24 hours
- **Medium:** Fix within 3 days
- **Low:** Fix within 1 week

---

## 🎯 NEXT ACTIONS

1. ✅ Create this tracker
2. ⏳ Run automated Playwright diagnostic
3. ⏳ Populate with all discovered issues
4. ⏳ Prioritize issues
5. ⏳ Fix critical issues first
6. ⏳ Validate all fixes
7. ⏳ Update tracker with resolutions

---

**Maintained By:** BMAD Development Team
**Review Frequency:** After every fix, daily during active development
**Archive:** Move fixed issues to separate file monthly
