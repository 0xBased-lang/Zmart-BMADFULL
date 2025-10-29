# 🔄 DEVELOPMENT WORKFLOW

**Purpose:** Systematic approach to development, testing, and issue resolution
**Last Updated:** October 28, 2025
**Status:** Active

---

## 📊 WORKFLOW OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. DISCOVERY → 2. DOCUMENTATION → 3. FIX → 4. VALIDATION  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### The Four Phases

1. **DISCOVERY** - Find all issues automatically
2. **DOCUMENTATION** - Record everything systematically
3. **FIX** - Resolve one issue at a time
4. **VALIDATION** - Verify fix works, no regressions

---

## 🎯 PHASE 1: DISCOVERY

**Goal:** Identify all issues without fixing anything yet

### Tools
- Playwright automated tests
- Browser DevTools
- Console logs
- Network inspection

### Process
```bash
# 1. Run comprehensive diagnostic
cd frontend
npx playwright test e2e/betting-diagnostic.spec.ts --headed

# 2. Review generated report
cat test-results/betting-diagnostic/diagnostic-report.md

# 3. Check for screenshots
open test-results/betting-diagnostic/
```

### Output
- `test-results/betting-diagnostic/diagnostic-report.md` - Human-readable report
- `test-results/betting-diagnostic/diagnostic-report.json` - Machine-readable data
- `test-results/betting-diagnostic/states/` - Screenshots at each step
- Console logs with all errors

### Success Criteria
- ✅ All pages tested
- ✅ All critical flows tested
- ✅ All errors captured
- ✅ All screenshots saved
- ✅ Report generated

---

## 📝 PHASE 2: DOCUMENTATION

**Goal:** Record all findings in structured format

### Update ISSUES-TRACKER.md
```bash
# 1. Open issue tracker
code docs/ISSUES-TRACKER.md

# 2. For each issue found:
#    - Add to appropriate priority section
#    - Fill in all details using template
#    - Link to diagnostic report
#    - Add screenshots as evidence

# 3. Update summary dashboard
#    - Count issues by category
#    - Update totals
```

### Issue Documentation Template
```markdown
### ISSUE-XXX: [Title]
**Status:** 🔴 Critical
**Category:** [Betting/UI/Database/etc]
**Discovered:** [Date from diagnostic]

**Description:**
[Clear explanation of what's broken]

**Evidence:**
- Diagnostic Report: test-results/betting-diagnostic/diagnostic-report.md
- Screenshot: test-results/betting-diagnostic/step-X-failure.png
- Console Error: [Copy from report]

**Root Cause:** [TBD or analysis]

**Fix Strategy:**
- [ ] Step 1
- [ ] Step 2
```

### Success Criteria
- ✅ Every diagnostic finding documented
- ✅ Issues prioritized
- ✅ Evidence linked
- ✅ Summary updated

---

## 🔧 PHASE 3: FIX

**Goal:** Resolve issues one at a time, highest priority first

### Process
```bash
# 1. Select highest priority unfixed issue from tracker
# 2. Read the full issue documentation
# 3. Review diagnostic evidence
# 4. Analyze root cause
# 5. Implement fix
# 6. Run targeted test to verify
```

### Fix Checklist
- [ ] Issue selected from tracker
- [ ] Root cause understood
- [ ] Fix implemented in code
- [ ] Code reviewed (if team)
- [ ] Targeted test passes
- [ ] No new errors introduced
- [ ] Documentation updated

### Example Fix Workflow
```bash
# Working on ISSUE-001: Betting Transaction Fails

# 1. Review issue
cat docs/ISSUES-TRACKER.md | grep -A 20 "ISSUE-001"

# 2. Implement fix
code frontend/lib/solana/betting.ts

# 3. Test the specific fix
npx playwright test e2e/betting-diagnostic.spec.ts

# 4. If passes, run regression
npx playwright test e2e/comprehensive-test.spec.ts

# 5. Update issue tracker
# Change status to ✅ Fixed
# Move to "RECENTLY FIXED" section
# Document the fix
```

### Success Criteria
- ✅ Fix implemented
- ✅ Targeted test passes
- ✅ Regression tests pass
- ✅ Issue tracker updated
- ✅ Fix documented

---

## ✅ PHASE 4: VALIDATION

**Goal:** Confirm fix works and didn't break anything else

### Validation Steps
```bash
# 1. Run targeted test
npx playwright test e2e/betting-diagnostic.spec.ts

# 2. Run full test suite
npx playwright test

# 3. Manual smoke test (if needed)
# - Open browser
# - Try the fixed feature
# - Verify it works

# 4. Check for regressions
# Review any new failures
# Ensure they're not related to your fix
```

### Documentation Updates
```bash
# 1. Update ISSUES-TRACKER.md
# - Move issue to "RECENTLY FIXED" section
# - Add fix date and description
# - Link to commit

# 2. Update TESTING-RESULTS.md (if exists)
# - Record test results
# - Note any changes in coverage

# 3. Create FIXES-LOG.md entry (optional)
# - Document what was fixed
# - How it was fixed
# - Lessons learned
```

### Success Criteria
- ✅ All targeted tests pass
- ✅ No regression failures
- ✅ Manual verification done (if needed)
- ✅ All documentation updated
- ✅ Code committed with good message

---

## 🔁 CONTINUOUS LOOP

After Phase 4, return to Phase 3 and fix the next highest priority issue.

```
┌───────────────────────────────────────┐
│                                       │
│  ┌─────────┐         ┌─────────┐     │
│  │ Phase 3 │────────▶│ Phase 4 │     │
│  │   FIX   │         │ VALIDATE│     │
│  └─────────┘         └─────────┘     │
│      ▲                    │          │
│      │                    │          │
│      └────────────────────┘          │
│           Until all fixed            │
│                                       │
└───────────────────────────────────────┘
```

---

## 📚 DOCUMENTATION SYSTEM

### Core Documents

1. **ISSUES-TRACKER.md** (This is the SOURCE OF TRUTH)
   - All current issues
   - Priority and status
   - Evidence and analysis
   - Fix tracking

2. **TESTING-WORKFLOW.md**
   - How to run tests
   - How to debug
   - Test writing guidelines

3. **DEVELOPMENT-WORKFLOW.md** (This file)
   - Overall process
   - Phase definitions
   - Success criteria

4. **FIXES-LOG.md** (Optional, create if needed)
   - History of fixes
   - Lessons learned
   - Prevention strategies

### Document Relationships
```
ISSUES-TRACKER.md ←── SOURCE OF TRUTH
    ↓
    ├─→ References: Diagnostic reports
    ├─→ References: Screenshots
    ├─→ References: Test files
    └─→ Links to: FIXES-LOG.md

TESTING-WORKFLOW.md
    ↓
    ├─→ Generates: Diagnostic reports
    ├─→ Generates: Screenshots
    └─→ Updates: ISSUES-TRACKER.md

DEVELOPMENT-WORKFLOW.md
    ↓
    └─→ Orchestrates: All other documents
```

---

## 🛠️ TOOLS REFERENCE

### Playwright Commands
```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test e2e/betting-diagnostic.spec.ts

# Run with browser visible
npx playwright test --headed

# Run in debug mode (pause at failures)
npx playwright test --debug

# Generate HTML report
npx playwright test --reporter=html
npx playwright show-report
```

### Diagnostic Commands
```bash
# Run betting diagnostic
npx playwright test e2e/betting-diagnostic.spec.ts --headed

# View diagnostic report
cat test-results/betting-diagnostic/diagnostic-report.md

# View diagnostic report in browser
open test-results/betting-diagnostic/diagnostic-report.md
```

### Issue Tracking Commands
```bash
# View current issues
cat docs/ISSUES-TRACKER.md

# Search for specific issue
grep -A 20 "ISSUE-001" docs/ISSUES-TRACKER.md

# Count issues by priority
grep "🔴 Critical" docs/ISSUES-TRACKER.md | wc -l
```

---

## ⚡ QUICK REFERENCE

### "Something is broken, what do I do?"

```bash
# 1. Run diagnostic
npx playwright test e2e/betting-diagnostic.spec.ts --headed

# 2. Review report
cat test-results/betting-diagnostic/diagnostic-report.md

# 3. Add to issue tracker
code docs/ISSUES-TRACKER.md
# Add new issue using template

# 4. Fix the issue
code [file-that-needs-fixing]

# 5. Verify fix
npx playwright test e2e/betting-diagnostic.spec.ts

# 6. Update tracker
code docs/ISSUES-TRACKER.md
# Mark issue as fixed
```

### "How do I know what to work on next?"

```bash
# 1. Open issue tracker
cat docs/ISSUES-TRACKER.md

# 2. Find highest priority unfixed issue
# Priority order: 🔴 Critical → 🟡 High → 🟢 Medium → ⚪ Low

# 3. Work on that issue following Phase 3 process
```

### "How do I test my fix?"

```bash
# 1. Run targeted test
npx playwright test e2e/[relevant-test].spec.ts

# 2. Run full suite to check for regressions
npx playwright test

# 3. If all pass, update docs
```

---

## 🎯 SUCCESS METRICS

### How do we know the workflow is working?

1. **Issue Tracker is Current**
   - All known issues documented
   - Priorities assigned
   - Status up-to-date

2. **Tests are Passing**
   - Critical flow tests pass
   - Regression tests pass
   - New tests added for fixes

3. **Documentation is Complete**
   - Every issue has evidence
   - Every fix is documented
   - Process is clear

4. **Velocity is Increasing**
   - Issues fixed faster over time
   - Fewer regressions
   - Better predictions

---

## 🚨 TROUBLESHOOTING THE WORKFLOW

### "Tests are flaky"
- Add better waits
- Increase timeouts
- Use more reliable selectors
- Document in TESTING-WORKFLOW.md

### "Losing context between sessions"
- Always update ISSUES-TRACKER.md before ending session
- Review tracker at start of each session
- Add session notes to tracker

### "Too many issues, overwhelming"
- Focus on 🔴 Critical first
- Fix one at a time completely
- Don't context switch

### "Don't know root cause"
- Run diagnostic in --headed mode
- Add more logging
- Use --debug mode
- Ask for help with evidence

---

## 📈 CONTINUOUS IMPROVEMENT

After every 5 fixes, review:
1. What patterns emerged?
2. What could be automated?
3. What documentation helped?
4. What slowed us down?

Update this workflow document with improvements.

---

**CURRENT STATUS:** Ready for Phase 1 (Discovery)

**NEXT ACTION:** Run betting diagnostic and populate issue tracker
