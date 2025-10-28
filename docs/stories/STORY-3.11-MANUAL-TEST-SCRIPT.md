# Story 3.11 - Manual Testing Script
## Comments and Discussion System - P0 Fixes Validation

**Test Date**: ____________
**Tester Name**: ____________
**Environment**: Local Development
**Test Duration**: ~15-30 minutes

---

## 📋 PRE-TESTING CHECKLIST

### Prerequisites

- [ ] Development environment set up and running
- [ ] Supabase instance running and accessible
- [ ] Database migrations applied (004_comments_tables.sql)
- [ ] Wallet adapter configured (from Story 3.1)
- [ ] Test wallet with some SOL for transactions
- [ ] Browser DevTools open (Console tab visible)

### Setup Instructions

```bash
# 1. Navigate to project directory
cd /Users/seman/Desktop/Zmart-BMADFULL

# 2. Ensure database is running (if using local Supabase)
# Check Supabase status
supabase status

# If not running:
supabase start

# 3. Start the development server
cd frontend
npm run dev

# 4. Open browser to development server
# URL: http://localhost:3000
```

**Expected Output**:
```
  ▲ Next.js 15.x
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

  ✓ Ready in 2.5s
```

**Verify Setup**:
- [ ] Server started without errors
- [ ] No compilation errors in terminal
- [ ] Browser loads homepage successfully
- [ ] Console shows no critical errors

---

## 🧪 TEST SUITE 1: COMMENTS SECTION VISIBILITY (AC #1)

### Objective
Verify CommentsSection component is integrated and visible on market detail page.

### Test 1.1: Navigate to Market Detail Page

**Steps**:
1. From homepage, click on any market card
2. OR navigate directly to: `http://localhost:3000/markets/1`

**Expected Results**:
- [ ] Market detail page loads successfully
- [ ] Page shows market information, betting interface
- [ ] Page scrolls down to reveal comments section
- [ ] Comments section appears AFTER betting panel

**Visual Verification**:
- [ ] Section title "Discussion" is visible
- [ ] Comment submission form is visible (if wallet connected) OR
- [ ] "Connect your wallet to comment" message visible (if wallet disconnected)

**Screenshot Location**: Take screenshot and note issues if any
```
Issue #___: ____________________________________________
```

### Test 1.2: Verify Empty State Display

**Prerequisites**: Ensure market has no comments (use fresh market ID or clear test data)

**Steps**:
1. Navigate to market with no comments
2. Scroll to comments section

**Expected Results**:
- [ ] Empty state message displays: "No comments yet"
- [ ] Subtext displays: "Be the first to share your thoughts!"
- [ ] Message is centered with proper styling
- [ ] No errors in console

**Pass Criteria**: ✅ Empty state renders correctly

---

## 🧪 TEST SUITE 2: COMMENT SUBMISSION (AC #3, #4)

### Test 2.1: Wallet Connection Gate

**Prerequisites**: Wallet NOT connected

**Steps**:
1. Ensure wallet is disconnected
2. Scroll to comments section

**Expected Results**:
- [ ] Form shows: "Connect your wallet to comment"
- [ ] Submit button is NOT visible
- [ ] Cannot enter text in comment form

**Pass Criteria**: ✅ Wallet gate prevents commenting

### Test 2.2: Comment Submission - Valid Input

**Prerequisites**: Wallet connected

**Steps**:
1. Connect wallet using wallet adapter button
2. Click in comment textarea
3. Type: "This is a test comment to validate the submission flow."
4. Observe character counter

**Expected Results**:
- [ ] Textarea accepts input
- [ ] Character counter updates: "54/2000"
- [ ] Submit button is enabled
- [ ] Submit button shows "Post Comment"

**Steps** (continued):
5. Click "Post Comment" button

**Expected Results**:
- [ ] Button shows "Posting..." briefly
- [ ] Success toast appears: "Comment posted!"
- [ ] Textarea clears automatically
- [ ] Character counter resets: "0/2000"
- [ ] Comment appears in comments list immediately
- [ ] Comment shows correct text
- [ ] Comment shows formatted wallet address (e.g., "5Eyc...9xKq")
- [ ] Comment shows timestamp (e.g., "a few seconds ago")
- [ ] Comment shows upvote count: 0
- [ ] No errors in console

**Console Check**:
```bash
# Should NOT see:
❌ Error: Failed to submit comment
❌ TypeError: ...
❌ 400/500 status errors

# May see (normal):
ℹ POST /api/submit-comment 200
```

**Pass Criteria**: ✅ Comment submits and displays correctly

### Test 2.3: Character Counter Validation

**Steps**:
1. Click in comment textarea
2. Type or paste exactly 2000 characters

**Tip**: Use this test string:
```
Lorem ipsum dolor sit amet, consectetur adipiscing elit. [repeat until 2000 chars]
```

**Expected Results**:
- [ ] Counter shows: "2000/2000"
- [ ] Submit button is ENABLED
- [ ] Cannot type additional characters (max enforced)

**Steps** (continued):
3. Try to type one more character

**Expected Results**:
- [ ] Character is NOT added (prevented by maxLength)
- [ ] Counter stays at "2000/2000"

**Pass Criteria**: ✅ Character limit enforced at 2000

### Test 2.4: Empty Comment Validation

**Steps**:
1. Click in comment textarea
2. Type several spaces: "     "
3. Try to submit

**Expected Results**:
- [ ] Submit button is DISABLED (no non-whitespace text)
- [ ] Cannot submit empty/whitespace-only comment

**Steps** (continued):
4. Type "Test" then delete it
5. Observe submit button

**Expected Results**:
- [ ] Submit button disables when text is empty

**Pass Criteria**: ✅ Empty/whitespace-only comments rejected

### Test 2.5: Comment Display Format

**Steps**:
1. Review the comment you posted earlier
2. Check all displayed fields

**Expected Results**:
- [ ] Wallet address formatted: First 4 chars + "..." + Last 4 chars
  - Example: "5Eyc...9xKq" (NOT full address)
- [ ] Timestamp shows relative time:
  - "a few seconds ago" OR
  - "2 minutes ago" OR
  - "1 hour ago" etc.
- [ ] Comment text displays correctly (no HTML escaping visible)
- [ ] Upvote count displays (default: 0)
- [ ] Flag button (⚑) visible in top-right corner

**Pass Criteria**: ✅ All comment fields display correctly

---

## 🧪 TEST SUITE 3: UPVOTE FUNCTIONALITY (AC #5)

### Test 3.1: Upvote Toggle - Add Upvote

**Prerequisites**: At least one comment exists

**Steps**:
1. Locate the upvote button (↑) with count
2. Note current upvote count (e.g., 0)
3. Click the upvote button

**Expected Results**:
- [ ] Button briefly shows disabled state
- [ ] Success toast appears: "Upvoted!"
- [ ] Upvote count increments by 1 (e.g., 0 → 1)
- [ ] Count updates immediately (no page refresh needed)
- [ ] No console errors

**Console Check**:
```bash
# Should see:
ℹ POST /api/upvote-comment 200

# Should NOT see:
❌ function increment() does not exist
❌ 500 Internal Server Error
```

**Pass Criteria**: ✅ Upvote adds successfully

### Test 3.2: Upvote Toggle - Remove Upvote

**Prerequisites**: Comment has your upvote from Test 3.1

**Steps**:
1. Click the SAME upvote button again

**Expected Results**:
- [ ] Button briefly shows disabled state
- [ ] Success toast appears: "Upvote removed"
- [ ] Upvote count decrements by 1 (e.g., 1 → 0)
- [ ] Count updates immediately
- [ ] No console errors

**Pass Criteria**: ✅ Upvote removes successfully (toggle works)

### Test 3.3: Multiple Upvotes (Same User)

**Steps**:
1. Upvote a comment (count: 0 → 1)
2. Remove upvote (count: 1 → 0)
3. Upvote again (count: 0 → 1)
4. Remove upvote again (count: 1 → 0)

**Expected Results**:
- [ ] Toggle works consistently multiple times
- [ ] Count never goes negative (Math.max prevents)
- [ ] Each operation succeeds

**Pass Criteria**: ✅ Upvote toggle reliable across multiple operations

### Test 3.4: Upvote Without Wallet

**Prerequisites**: Wallet disconnected

**Steps**:
1. Disconnect wallet
2. Try to click upvote button

**Expected Results**:
- [ ] Error toast appears: "Connect wallet to upvote"
- [ ] Upvote count does NOT change
- [ ] No API call made (check console)

**Pass Criteria**: ✅ Wallet gate prevents unauthorized upvoting

---

## 🧪 TEST SUITE 4: COMMENT FLAGGING (AC #6)

### Test 4.1: Flag Comment - UI Flow

**Prerequisites**: Wallet connected, at least one comment exists

**Steps**:
1. Locate flag button (⚑) in top-right of comment card
2. Click the flag button

**Expected Results**:
- [ ] Modal/dialog appears with title "Flag Comment"
- [ ] Message: "Flag this comment as inappropriate?"
- [ ] Textarea for "Reason (optional)" is visible
- [ ] Two buttons visible: "Flag Comment" and "Cancel"
- [ ] Dialog overlays page with dark background

**Pass Criteria**: ✅ Flag dialog opens correctly

### Test 4.2: Flag Comment - Submission

**Steps** (continued from 4.1):
3. Type optional reason: "Testing flag functionality"
4. Click "Flag Comment" button

**Expected Results**:
- [ ] Button shows "Flagging..." briefly
- [ ] Success toast appears: "Comment flagged for review"
- [ ] Dialog closes automatically
- [ ] Reason field clears
- [ ] No console errors

**Console Check**:
```bash
# Should see:
ℹ POST /api/flag-comment 200

# Should NOT see:
❌ TODO: Implement flag API call
❌ Failed to flag comment
```

**Pass Criteria**: ✅ Flag submits successfully

### Test 4.3: Flag Comment - Duplicate Prevention

**Steps**:
1. Try to flag the SAME comment again
2. Click flag button (⚑)
3. Click "Flag Comment"

**Expected Results**:
- [ ] Error toast appears: "You have already flagged this comment" OR
- [ ] Error toast: "Failed to flag comment"
- [ ] Comment NOT flagged again (duplicate prevented)

**Pass Criteria**: ✅ Duplicate flags prevented

### Test 4.4: Flag Comment - Cancel Action

**Steps**:
1. Click flag button on a different comment
2. Type some text in reason field
3. Click "Cancel" button

**Expected Results**:
- [ ] Dialog closes
- [ ] No API call made
- [ ] No toast notification
- [ ] Comment NOT flagged

**Pass Criteria**: ✅ Cancel action works correctly

### Test 4.5: Flag Without Wallet

**Prerequisites**: Wallet disconnected

**Steps**:
1. Disconnect wallet
2. Try to click flag button

**Expected Results**:
- [ ] Error toast: "Connect wallet to flag comments"
- [ ] Dialog does NOT open
- [ ] No API call made

**Pass Criteria**: ✅ Wallet gate prevents unauthorized flagging

---

## 🧪 TEST SUITE 5: REAL-TIME UPDATES (AC #4, #7)

### Test 5.1: Real-Time Comment Appears

**Prerequisites**: Two browser windows/tabs open to same market

**Setup**:
1. Open browser window #1 → Navigate to market detail page
2. Open browser window #2 → Navigate to SAME market detail page
3. Arrange windows side-by-side

**Steps**:
1. In window #1, connect wallet and post comment: "Real-time test"
2. Observe window #2 WITHOUT refreshing

**Expected Results**:
- [ ] Comment appears in window #2 automatically
- [ ] No page refresh required in window #2
- [ ] Comment appears within 1-2 seconds
- [ ] Comment displays correct text and metadata
- [ ] Console shows Supabase subscription activity

**Console Check (Window #2)**:
```bash
# May see:
ℹ Realtime subscription: INSERT event
```

**Pass Criteria**: ✅ Real-time updates work across browser instances

### Test 5.2: Real-Time Upvote Updates

**Prerequisites**: Same two-window setup from 5.1

**Steps**:
1. In window #1, upvote a comment
2. Observe window #2 WITHOUT refreshing

**Expected Results**:
- [ ] Upvote count updates in window #2 automatically
- [ ] Count increments within 1-2 seconds
- [ ] No page refresh required

**Pass Criteria**: ✅ Real-time upvote updates work

### Test 5.3: Subscription Cleanup

**Steps**:
1. Open DevTools → Console
2. Navigate to market detail page (comments section loads)
3. Navigate AWAY from market page (go to homepage)
4. Check console for errors

**Expected Results**:
- [ ] No subscription leak errors
- [ ] No "removeChannel" errors
- [ ] Console clean when navigating away

**Pass Criteria**: ✅ Subscriptions properly cleaned up

---

## 🧪 TEST SUITE 6: ERROR HANDLING & EDGE CASES

### Test 6.1: Network Error Simulation

**Steps**:
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to post a comment

**Expected Results**:
- [ ] Error toast appears with user-friendly message
- [ ] Loading state clears
- [ ] Form remains usable (not stuck in loading state)
- [ ] User can retry after enabling network

**Pass Criteria**: ✅ Graceful error handling for network failures

### Test 6.2: Invalid Market ID

**Steps**:
1. Navigate to: `http://localhost:3000/markets/999999`
2. Observe comments section

**Expected Results**:
- [ ] Comments section loads (shows empty state)
- [ ] OR error message displays
- [ ] No console errors that crash the page
- [ ] Page remains functional

**Pass Criteria**: ✅ Invalid market ID handled gracefully

### Test 6.3: Multiple Rapid Submissions

**Steps**:
1. Type comment: "Rapid test 1"
2. Click Submit
3. IMMEDIATELY type "Rapid test 2"
4. Click Submit (before first completes)
5. Repeat 2-3 more times

**Expected Results**:
- [ ] All comments successfully submitted OR
- [ ] Rate limiting prevents excessive submissions
- [ ] No crashes or stuck states
- [ ] User feedback for each attempt

**Pass Criteria**: ✅ Multiple rapid operations handled

### Test 6.4: XSS Prevention

**Steps**:
1. Type comment: `<script>alert('XSS Test')</script>`
2. Submit comment
3. Observe rendered comment

**Expected Results**:
- [ ] No alert popup appears
- [ ] Comment displays as text (script tags visible as text)
- [ ] OR script tags completely removed
- [ ] No JavaScript execution from comment text

**Pass Criteria**: ✅ XSS attacks prevented

---

## 📊 TEST RESULTS SUMMARY

### P0 Fix Validation

| Fix | Test Result | Notes |
|-----|-------------|-------|
| **Fix #1**: CommentsSection Integration | ☐ PASS ☐ FAIL | ____________ |
| **Fix #2**: Flag API Connection | ☐ PASS ☐ FAIL | ____________ |
| **Fix #3**: Upvote RPC Bug | ☐ PASS ☐ FAIL | ____________ |

### Acceptance Criteria Validation

| AC# | Criteria | Test Result | Evidence |
|-----|----------|-------------|----------|
| 1 | Comments section displayed | ☐ PASS ☐ FAIL | Suite 1 |
| 2 | Database tables created | ☐ PASS ☐ SKIP | (DB already tested) |
| 3 | Comment submission API | ☐ PASS ☐ FAIL | Suite 2 |
| 4 | Comments display correctly | ☐ PASS ☐ FAIL | Suite 2.5 |
| 5 | Upvote functionality | ☐ PASS ☐ FAIL | Suite 3 |
| 6 | Comment flagging | ☐ PASS ☐ FAIL | Suite 4 |
| 7 | Functional validation | ☐ PASS ☐ FAIL | All suites |

### Overall Test Score

**Tests Passed**: _____ / 25
**Tests Failed**: _____ / 25
**Tests Skipped**: _____ / 25

**Pass Rate**: _____%

### Blockers & Issues Found

```
Issue #1: ________________________________________________
Severity: ☐ Critical ☐ High ☐ Medium ☐ Low
Suite: __________
Steps to Reproduce: _______________________________________
__________________________________________________________

Issue #2: ________________________________________________
Severity: ☐ Critical ☐ High ☐ Medium ☐ Low
Suite: __________
Steps to Reproduce: _______________________________________
__________________________________________________________

Issue #3: ________________________________________________
Severity: ☐ Critical ☐ High ☐ Medium ☐ Low
Suite: __________
Steps to Reproduce: _______________________________________
__________________________________________________________
```

### Browser Compatibility (Optional Extended Testing)

| Browser | Version | Test Result | Notes |
|---------|---------|-------------|-------|
| Chrome | _____ | ☐ PASS ☐ FAIL | ____________ |
| Firefox | _____ | ☐ PASS ☐ FAIL | ____________ |
| Safari | _____ | ☐ PASS ☐ FAIL | ____________ |
| Edge | _____ | ☐ PASS ☐ FAIL | ____________ |

---

## ✅ FINAL SIGN-OFF

### Test Completion Checklist

- [ ] All test suites executed
- [ ] Results documented in summary table
- [ ] Screenshots captured for any failures
- [ ] Console logs reviewed for errors
- [ ] Blockers/issues documented with severity
- [ ] Browser DevTools network tab checked for failed requests

### Recommendation

Based on testing results:

☐ **APPROVE** - All P0 fixes working correctly, story ready for completion
☐ **CONDITIONAL APPROVE** - Minor issues found but non-blocking
☐ **REJECT** - Critical issues found, requires fixes before approval

**Tester Comments**:
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

**Tester Signature**: ____________________
**Date**: ____________________
**Time Spent**: __________ minutes

---

## 📚 APPENDIX: TROUBLESHOOTING GUIDE

### Issue: Comments Section Not Visible

**Possible Causes**:
1. CSS styling issue (check for `display: none`)
2. Component not rendering (check React DevTools)
3. JavaScript error preventing render (check console)

**Solution**:
```bash
# Check component tree in React DevTools
# Look for: MarketDetailClient → CommentsSection

# Check console for errors:
# Common: Module not found, Import errors
```

### Issue: "Wallet not connected" Despite Connected Wallet

**Possible Causes**:
1. Wallet adapter not initialized properly
2. publicKey is null despite connection
3. signMessage not available

**Solution**:
```javascript
// Check in console:
window.solana.isConnected
// Should return: true

// Check wallet adapter state in React DevTools
```

### Issue: Upvote Error - "function increment() does not exist"

**Status**: This should be FIXED in P0 updates

**If still occurs**:
```typescript
// Check upvote-comment/route.ts line 33-39, 60-66
// Should use: SELECT → UPDATE pattern
// NOT: supabase.rpc('increment')
```

### Issue: Real-Time Updates Not Working

**Possible Causes**:
1. Supabase instance not running
2. Real-time not enabled in Supabase project
3. Subscription channel mismatch

**Solution**:
```bash
# Check Supabase status
supabase status

# Check console for:
"Realtime subscription: SUBSCRIBED"

# If not subscribed, check Supabase dashboard:
# Settings → API → Realtime enabled
```

### Issue: Character Counter Not Updating

**Possible Causes**:
1. React state not updating
2. onChange handler not wired correctly

**Solution**:
```typescript
// Check CommentForm.tsx line 46:
onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}

// Should update text state on every keystroke
```

---

## 🎯 QUICK REFERENCE: CRITICAL VALIDATIONS

**Must Pass For Story Approval**:
1. ✅ Comments section visible on market page
2. ✅ Can submit comment with wallet connected
3. ✅ Comment displays with correct formatting
4. ✅ Upvote increments without RPC error
5. ✅ Upvote decrements when toggled off
6. ✅ Flag button opens dialog and submits to API
7. ✅ Real-time updates work (two-window test)
8. ✅ No console errors during normal operations

**If ANY of these fail, P0 fixes require additional work.**

---

**End of Manual Testing Script**

For questions or issues, refer to:
- Story file: `docs/stories/story-3.11.md`
- Review document: `docs/stories/story-3.11.md` (Senior Developer Review section)
- Test report: `docs/stories/STORY-3.11-COMPREHENSIVE-TEST-REPORT.md` (if created)
