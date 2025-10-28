# Story 3.11 - Quick Test Checklist
## P0 Fixes Validation - 15 Minute Quick Test

**Tester**: ____________  **Date**: ____________  **Result**: ☐ PASS ☐ FAIL

---

## 🚀 SETUP (2 minutes)

```bash
cd /Users/seman/Desktop/Zmart-BMADFULL/frontend
npm run dev
```

- [ ] Server running: `http://localhost:3000`
- [ ] No compilation errors
- [ ] Wallet adapter configured

---

## ✅ CRITICAL PATH TESTS (10 minutes)

### 1. CommentsSection Visible (Fix #1)
Navigate to: `http://localhost:3000/markets/1`

- [ ] Comments section appears below betting panel
- [ ] Section title "Discussion" visible
- [ ] Comment form OR "Connect wallet" message visible

**Status**: ☐ PASS ☐ FAIL

---

### 2. Comment Submission Works
Connect wallet → Type comment → Submit

- [ ] Character counter updates: "__/2000"
- [ ] Submit button enabled for valid text
- [ ] Success toast: "Comment posted!"
- [ ] Comment appears immediately in list
- [ ] Wallet address formatted: "5Eyc...9xKq"
- [ ] Timestamp shows: "a few seconds ago"
- [ ] No console errors

**Status**: ☐ PASS ☐ FAIL

---

### 3. Upvote Toggle Works (Fix #3)
Click upvote button (↑) on any comment

- [ ] Success toast: "Upvoted!"
- [ ] Count increments: 0 → 1
- [ ] Click again: "Upvote removed"
- [ ] Count decrements: 1 → 0
- [ ] **NO ERROR**: "function increment() does not exist" ✅
- [ ] No console errors

**Status**: ☐ PASS ☐ FAIL

---

### 4. Flag Comment Works (Fix #2)
Click flag button (⚑) on any comment

- [ ] Dialog opens: "Flag Comment"
- [ ] Type reason: "Test"
- [ ] Click "Flag Comment"
- [ ] Success toast: "Comment flagged for review"
- [ ] Dialog closes
- [ ] **NO "TODO" ERROR** ✅
- [ ] No console errors

**Status**: ☐ PASS ☐ FAIL

---

### 5. Real-Time Updates Work
Open two browser windows → Same market → Side by side

Window 1: Post comment "Real-time test"
Window 2: Observe (NO REFRESH)

- [ ] Comment appears in Window 2 automatically
- [ ] Appears within 1-2 seconds
- [ ] No page refresh needed

**Status**: ☐ PASS ☐ FAIL

---

## 🔒 EDGE CASES (3 minutes)

### Validation Tests

- [ ] Empty comment rejected (button disabled)
- [ ] 2001 char comment prevented (maxLength)
- [ ] Upvote without wallet: Error toast
- [ ] Flag without wallet: Error toast
- [ ] XSS test: `<script>alert('test')</script>` → No alert popup

**Status**: ☐ PASS ☐ FAIL

---

## 📊 RESULTS

| Test | Result | Blocker? |
|------|--------|----------|
| 1. CommentsSection Visible | ☐ ✅ ☐ ❌ | ☐ Yes ☐ No |
| 2. Comment Submission | ☐ ✅ ☐ ❌ | ☐ Yes ☐ No |
| 3. Upvote Toggle | ☐ ✅ ☐ ❌ | ☐ Yes ☐ No |
| 4. Flag Comment | ☐ ✅ ☐ ❌ | ☐ Yes ☐ No |
| 5. Real-Time Updates | ☐ ✅ ☐ ❌ | ☐ Yes ☐ No |
| 6. Edge Cases | ☐ ✅ ☐ ❌ | ☐ Yes ☐ No |

**Score**: ___/6 Passed

---

## ✅ SIGN-OFF

☐ **APPROVE** - All critical tests passed, P0 fixes validated
☐ **REJECT** - Blocking issues found (document below)

**Issues Found**:
```
1. _________________________________________________________
2. _________________________________________________________
3. _________________________________________________________
```

**Signature**: ____________________ **Time**: _______ minutes

---

## 🎯 MUST PASS CRITERIA

**These 3 fixes MUST work for approval**:

1. ✅ **Fix #1**: CommentsSection integrated and visible on page
2. ✅ **Fix #2**: Flag button connected to API (no TODO error)
3. ✅ **Fix #3**: Upvote works without RPC error

**If ANY fail → P0 fixes need revision**

---

**For detailed testing**: See `STORY-3.11-MANUAL-TEST-SCRIPT.md`
