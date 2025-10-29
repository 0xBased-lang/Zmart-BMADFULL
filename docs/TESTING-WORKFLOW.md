# 🧪 AUTOMATED TESTING WORKFLOW

**Purpose:** Systematic approach to testing and diagnosing issues
**Tools:** Playwright, Chrome DevTools, Solana Explorer
**Last Updated:** October 28, 2025

---

## 🎯 TESTING PHILOSOPHY

### Core Principles
1. **Automate Everything** - No manual testing unless absolutely necessary
2. **Test in Production Conditions** - Use real devnet, real wallets
3. **Capture All Evidence** - Screenshots, logs, network traces
4. **Systematic Approach** - Test features in dependency order
5. **Document Findings** - Update issue tracker immediately

### Testing Pyramid
```
        /\
       /  \    E2E Tests (Playwright)
      /____\   - Full user workflows
     /      \  - Real browser, real wallet
    /________\ - Captures all interactions

   /          \ Integration Tests
  /____________\ - API + Database
                 - Component interactions

 /______________\ Unit Tests
                  - Pure functions
                  - Business logic
```

---

## 🚀 QUICK START

### Run All Tests
```bash
cd frontend
npm run test:e2e
```

### Run Specific Test Suite
```bash
# Betting flow only
npx playwright test e2e/betting.spec.ts

# Dashboard only
npx playwright test e2e/dashboard.spec.ts

# Full diagnostic
npx playwright test e2e/diagnostic.spec.ts --headed
```

### Run Tests in Debug Mode
```bash
# Interactive debugging with browser open
npx playwright test --headed --debug

# Specific test with browser
npx playwright test e2e/betting.spec.ts --headed
```

---

## 📊 TEST SUITES

### 1. Diagnostic Suite (`e2e/diagnostic.spec.ts`)
**Purpose:** Comprehensive system health check
**Duration:** ~5 minutes
**Runs:** On-demand, before major changes

**What It Tests:**
- ✅ All pages load without errors
- ✅ Database connections work
- ✅ Navigation functions properly
- ✅ No console errors
- ✅ Performance within limits

**Output:**
- HTML report with screenshots
- Console logs
- Network requests
- Performance metrics

### 2. Betting Flow Suite (`e2e/betting-flow.spec.ts`)
**Purpose:** Test complete betting workflow
**Duration:** ~2 minutes
**Runs:** After betting-related changes

**What It Tests:**
- ✅ Wallet connection
- ✅ Market selection
- ✅ Amount validation
- ✅ Transaction submission
- ✅ Transaction confirmation
- ✅ Database sync
- ✅ UI updates

**Output:**
- Transaction hashes
- Error messages
- Screenshots at each step
- Detailed failure analysis

### 3. Dashboard Suite (`e2e/dashboard.spec.ts`)
**Purpose:** Test user dashboard
**Duration:** ~1 minute
**Runs:** After UI or data changes

**What It Tests:**
- ✅ Bet history displays
- ✅ Stats calculations
- ✅ Real-time updates
- ✅ Empty states

### 4. Regression Suite (`e2e/regression.spec.ts`)
**Purpose:** Ensure fixes don't break existing features
**Duration:** ~10 minutes
**Runs:** Before deployments

**What It Tests:**
- Everything from all other suites
- Edge cases
- Performance benchmarks

---

## 🔍 DIAGNOSTIC WORKFLOW

### Phase 1: Initial Discovery
**Goal:** Identify all issues without fixing anything

```bash
# Run comprehensive diagnostic
npx playwright test e2e/diagnostic.spec.ts --reporter=html

# Review HTML report
npx playwright show-report
```

**Actions:**
1. Run test suite
2. Capture all failures
3. Take screenshots
4. Save console logs
5. Document in ISSUES-TRACKER.md

**Output:** Updated ISSUES-TRACKER.md with all findings

### Phase 2: Deep Dive on Critical Issues
**Goal:** Understand exact failure point for each critical issue

```bash
# Run specific test in headed mode (browser visible)
npx playwright test e2e/betting-flow.spec.ts --headed --debug
```

**Actions:**
1. Run test with browser visible
2. Pause at failure point
3. Inspect page state
4. Check network tab
5. Review console
6. Document root cause

**Output:** Root cause analysis in ISSUES-TRACKER.md

### Phase 3: Fix Implementation
**Goal:** Fix one issue at a time, verify immediately

```bash
# Fix code
# ...

# Re-run specific test
npx playwright test e2e/betting-flow.spec.ts

# If passes, run full suite to check for regressions
npx playwright test e2e/regression.spec.ts
```

**Actions:**
1. Implement fix
2. Run targeted test
3. Verify fix works
4. Run regression tests
5. Update ISSUES-TRACKER.md

**Output:** Fixed issue marked as ✅ in tracker

### Phase 4: Final Validation
**Goal:** Confirm entire system is healthy

```bash
# Run all tests
npm run test:e2e

# Generate report
npx playwright show-report
```

**Actions:**
1. Run complete test suite
2. Review all results
3. Update all documentation
4. Create final report

**Output:** TESTING-RESULTS.md with final state

---

## 🛠️ DEBUGGING TECHNIQUES

### Technique 1: Headed Mode
**When:** Investigating unknown failures
**Command:** `npx playwright test --headed`
**Benefit:** See exactly what's happening in real browser

### Technique 2: Debug Mode
**When:** Need to pause and inspect at specific points
**Command:** `npx playwright test --debug`
**Benefit:** Step through test, inspect DOM, run commands

### Technique 3: Trace Recording
**When:** Need to share findings or review later
**Command:** `npx playwright test --trace on`
**Benefit:** Complete recording of test execution

### Technique 4: Console Logs
**When:** Need to understand application behavior
**Code:**
```typescript
page.on('console', msg => console.log('Browser:', msg.text()))
```
**Benefit:** See all console.log from application

### Technique 5: Network Interception
**When:** Debugging API or blockchain calls
**Code:**
```typescript
page.on('request', request => {
  console.log('Request:', request.url())
})
page.on('response', response => {
  console.log('Response:', response.status(), response.url())
})
```
**Benefit:** See all network activity

### Technique 6: Screenshots on Failure
**When:** Documenting issues
**Code:**
```typescript
await page.screenshot({
  path: `failure-${Date.now()}.png`,
  fullPage: true
})
```
**Benefit:** Visual evidence of failure state

---

## 📝 TEST WRITING GUIDELINES

### Good Test Structure
```typescript
test('feature description', async ({ page }) => {
  // ARRANGE - Set up test conditions
  await page.goto('/markets/2')

  // ACT - Perform the action
  await page.click('button:has-text("YES")')

  // ASSERT - Verify expected outcome
  await expect(page.locator('.selected')).toContainText('YES')
})
```

### Best Practices
1. **Descriptive Names** - Test name should explain what it tests
2. **One Assertion** - Each test should test one thing
3. **Independent Tests** - Tests should not depend on each other
4. **Cleanup** - Reset state after each test
5. **Timeouts** - Set appropriate waits for blockchain operations

### Selectors Priority
1. **data-testid** - Best (add to components)
2. **role** - Good for accessibility
3. **text** - OK for unique text
4. **CSS classes** - Avoid (can change)
5. **XPath** - Last resort

---

## 🎯 CURRENT TESTING GOALS

### Immediate (Next 30 Minutes)
- [x] Create testing workflow documentation
- [ ] Run diagnostic suite and capture all issues
- [ ] Create targeted betting flow test
- [ ] Identify exact betting failure point

### Short Term (Next 2 Hours)
- [ ] Fix critical betting issue
- [ ] Verify fix with automated test
- [ ] Run regression suite
- [ ] Update all documentation

### Medium Term (Next Day)
- [ ] Achieve 80% test coverage on critical flows
- [ ] Set up CI/CD integration
- [ ] Create test data factories
- [ ] Document all test scenarios

---

## 📊 TEST METRICS

### Coverage Goals
- **Critical Flows:** 100% (betting, wallet, claims)
- **Major Features:** 80% (markets, dashboard, leaderboard)
- **Edge Cases:** 60% (error states, validations)

### Performance Targets
- **Page Load:** < 3 seconds
- **Test Suite:** < 10 minutes total
- **Feedback Loop:** < 30 seconds (run single test)

### Quality Metrics
- **Flaky Tests:** 0% (tests must be deterministic)
- **False Positives:** < 1%
- **Documentation:** 100% (every test explained)

---

## 🔗 INTEGRATION

### With Issue Tracker
- Every test failure → New issue in ISSUES-TRACKER.md
- Every test pass → Update issue status
- Every fix → Reference test that validates it

### With Development Workflow
1. Write feature code
2. Write test for feature
3. Run test (should fail - red)
4. Implement feature (test passes - green)
5. Refactor (test still passes)
6. Commit with test

### With Documentation
- Test results → Update IMPLEMENTATION-STATUS.md
- Test failures → Update ISSUES-TRACKER.md
- Test coverage → Update TESTING-RESULTS.md

---

## 🚨 TROUBLESHOOTING

### Tests Timing Out
**Cause:** Network slow, blockchain slow
**Fix:** Increase timeout in playwright.config.ts

### Tests Flaking
**Cause:** Race conditions, network issues
**Fix:** Add proper waits, use waitForLoadState

### Can't Click Element
**Cause:** Element not visible, covered, disabled
**Fix:** Add wait, check visibility, debug mode

### Wallet Not Connecting
**Cause:** Extension not installed, wrong network
**Fix:** Use test wallet, mock in CI environment

---

**Next Step:** Run comprehensive diagnostic to populate ISSUES-TRACKER.md
