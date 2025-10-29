# 🔍 MANUAL BETTING DIAGNOSTIC (RELIABLE)

**Purpose:** Simple, step-by-step guide to find the exact betting issue
**Time:** 5 minutes
**Requirements:** Just your browser

---

## ✅ STEP-BY-STEP DIAGNOSTIC

### Step 1: Open Browser DevTools (2 minutes)

1. Open Chrome/Brave browser
2. Go to `http://localhost:3000/markets/2`
3. Press `F12` or Right-click → "Inspect"
4. Click the **Console** tab
5. Click the **Network** tab (second tab)
6. Make sure both tabs are visible

**You should see:**
- Console tab: Empty or some log messages
- Network tab: List of requests

---

### Step 2: Try to Place a Bet (1 minute)

**Do these actions and WATCH the Console tab:**

1. Click "Connect Wallet" (if needed)
2. Select "YES"
3. Enter amount: `0.01`
4. Click "Place Bet"
5. Click "Confirm Bet" in modal

**STOP here when you see an error**

---

### Step 3: Capture the Error (1 minute)

**In the Console tab, look for RED text**

You'll see something like one of these:

#### Option A: Console Error
```
Error: Failed to place bet
```

#### Option B: Network Error
```
POST https://api.devnet.solana.com  500 (Internal Server Error)
```

#### Option C: Transaction Error
```
Transaction simulation failed: ...
```

#### Option D: Program Error
```
Program log: Error: MarketNotActive
```

**Take a screenshot or copy the exact error message**

---

### Step 4: Check Network Tab (1 minute)

1. Click the **Network** tab
2. Look for any RED requests (failed)
3. Click on the failed request
4. Look at the "Response" or "Preview" tab
5. Copy any error message

---

### Step 5: Report Back

**Tell me:**
1. What's the error message? (exact text)
2. Is it in Console or Network tab?
3. At which step did it fail?
   - [ ] Wallet connection
   - [ ] Selecting YES/NO
   - [ ] Entering amount
   - [ ] Clicking "Place Bet"
   - [ ] Clicking "Confirm Bet"
   - [ ] After clicking Confirm (wallet popup or transaction)

---

## 🚀 QUICK REFERENCE

### Where to Look for Errors

**Console Tab (Red Text):**
- JavaScript errors
- Transaction failures
- Program errors

**Network Tab (Red Requests):**
- API failures
- RPC failures
- 404, 500 errors

**Wallet Popup:**
- "Insufficient funds"
- "Transaction rejected"
- "Simulation failed"

---

## 📊 COMMON ERROR MESSAGES & MEANINGS

| Error Message | Meaning | Location |
|---------------|---------|----------|
| "Failed to place bet" | Generic error | Console |
| "Insufficient SOL balance" | Wallet has no funds | Console/Wallet |
| "Transaction simulation failed" | Solana rejected the tx | Network/Wallet |
| "Market is not active" | Market closed | Console |
| "User rejected" | Cancelled in wallet | Console |
| "timeout" | Network slow | Console |
| "Cannot read property X" | Code bug | Console |
| "404" | Missing resource | Network |
| "500" | Server error | Network |

---

## 💡 TIPS

1. **Clear Console** - Click the 🚫 icon in Console tab before testing
2. **Preserve Log** - Check "Preserve log" in Console settings
3. **Take Screenshot** - Capture the full error for reference
4. **Copy Full Error** - Right-click error → "Copy message"

---

**Once you have the error, just tell me:**
- The exact error message
- Which step failed
- Any screenshots

I'll fix it immediately!
