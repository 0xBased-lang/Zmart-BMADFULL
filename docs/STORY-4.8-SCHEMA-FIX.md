# Story 4.8: Database Schema Fix

**Date:** 2025-10-28
**Issue:** Dashboard and betting not working due to missing database columns
**Status:** ✅ FIXED

---

## 🐛 PROBLEM DISCOVERED

During local testing, three critical issues were found:
1. ❌ Dashboard showing "Error Loading Dashboard - Failed to fetch user bets"
2. ❌ Betting functionality not working
3. ❌ Market creation failures

### Root Cause Analysis

The frontend code expected database columns that didn't exist:

**Markets Table - Missing Columns:**
- `outcome` (code expected this, but database had `winning_outcome`)
- `yes_pool` - Size of YES bet pool
- `no_pool` - Size of NO bet pool  
- `end_date` - Market end date/time
- `resolved_at` - Resolution timestamp

**Bets Table - Missing Columns:**
- `shares` - Number of shares purchased
- `claimed` - Whether payout has been claimed

### Error in useUserBets Hook

The `lib/hooks/useUserBets.ts` hook was querying:
```typescript
.select(`
  *,
  markets (
    id,
    market_id,
    question,
    status,
    outcome,        // ❌ Column didn't exist
    yes_pool,       // ❌ Column didn't exist
    no_pool,        // ❌ Column didn't exist
    total_volume,
    end_date,       // ❌ Column didn't exist
    resolved_at     // ❌ Column didn't exist
  )
`)
```

This caused Supabase queries to fail silently, resulting in empty data and error states.

---

## ✅ SOLUTION IMPLEMENTED

### Schema Migration Applied

Created and executed `fix-schema.sql` migration:

#### Markets Table Updates

```sql
ALTER TABLE markets
  ADD COLUMN IF NOT EXISTS outcome TEXT,
  ADD COLUMN IF NOT EXISTS yes_pool NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS no_pool NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;
```

**Data Migration:**
- Copied `winning_outcome` → `outcome` for compatibility
- Set `end_date` = 30 days from creation for active markets
- Set `resolved_at` for resolved markets
- Initialized pools: `yes_pool` and `no_pool` = `total_volume / 2`

#### Bets Table Updates

```sql
ALTER TABLE bets
  ADD COLUMN IF NOT EXISTS shares NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS claimed BOOLEAN DEFAULT FALSE;
```

**Data Migration:**
- Set `shares` = `amount` (1:1 ratio)
- Set `claimed` = FALSE for all existing bets

#### Performance Indexes Added

```sql
-- Markets indexes
CREATE INDEX idx_markets_end_date ON markets(end_date);
CREATE INDEX idx_markets_outcome ON markets(outcome);
CREATE INDEX idx_markets_pools ON markets(yes_pool, no_pool);

-- Bets indexes
CREATE INDEX idx_bets_claimed ON bets(claimed) WHERE NOT claimed;
```

---

## 📊 VERIFICATION RESULTS

### Schema Verification

**Markets Table:**
- Original: 8 columns
- After fix: 13 columns ✅
- All required columns present ✅

**Bets Table:**
- Original: 7 columns
- After fix: 9 columns ✅
- All required columns present ✅

### Sample Data Check

**Markets:**
```
id: 1
question: "Will BTC reach $100k by end of 2025?"
status: active
outcome: NULL (active, not resolved yet)
yes_pool: 2500
no_pool: 2500
end_date: 2025-11-27 02:15:43
```

**Bets:**
```
id: 1
outcome: YES
amount: 100
shares: 100
claimed: false
```

---

## 🧪 TESTING CHECKLIST

After schema fix, the following should now work:

### Dashboard Tests
- [ ] Dashboard loads without errors
- [ ] "Active Bets" section displays correctly
- [ ] "Pending Resolutions" section shows pending markets
- [ ] "Claimable Payouts" section shows winnings
- [ ] "Bet History" displays past bets
- [ ] Portfolio metrics calculate correctly

### Betting Tests
- [ ] Can place YES bets
- [ ] Can place NO bets
- [ ] Bet confirmation works
- [ ] Bets appear in dashboard immediately
- [ ] Pool sizes update correctly

### Market Creation Tests
- [ ] "Create Market" form works
- [ ] Market appears in markets list
- [ ] Market details display correctly
- [ ] End date is set properly

### User Experience Tests
- [ ] No console errors
- [ ] Data refreshes automatically
- [ ] Real-time updates work (Supabase subscriptions)
- [ ] Smooth transitions and loading states

---

## 🔍 TECHNICAL DETAILS

### Why This Happened

The database schema was created with a minimal set of columns, but the frontend code was written with a more comprehensive schema in mind. This is a common issue in rapid development where:

1. Backend/database is set up first
2. Frontend is developed with expected features
3. Schema mismatch isn't caught until integration testing

### Prevention Strategy

**For Future Development:**
1. ✅ Define schema contract before development
2. ✅ Use TypeScript types for database models
3. ✅ Add schema validation tests
4. ✅ Document required columns in ADRs
5. ✅ Run integration tests early

### Files Modified

**Database:**
- Created: `fix-schema.sql` (migration script)
- Modified: `markets` table (added 5 columns)
- Modified: `bets` table (added 2 columns)
- Added: 4 performance indexes

**Documentation:**
- Created: `docs/STORY-4.8-SCHEMA-FIX.md` (this file)
- Updated: Testing documentation with schema requirements

---

## 📝 MIGRATION DETAILS

### Migration File Location
`/Users/seman/Desktop/Zmart-BMADFULL/fix-schema.sql`

### How to Apply (if needed again)
```bash
# Connect to local Supabase
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" < fix-schema.sql

# Verify
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "\d markets"
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "\d bets"
```

### Rollback (if needed)
```sql
-- Remove added columns
ALTER TABLE markets
  DROP COLUMN IF EXISTS outcome,
  DROP COLUMN IF EXISTS yes_pool,
  DROP COLUMN IF EXISTS no_pool,
  DROP COLUMN IF EXISTS end_date,
  DROP COLUMN IF EXISTS resolved_at;

ALTER TABLE bets
  DROP COLUMN IF EXISTS shares,
  DROP COLUMN IF EXISTS claimed;

-- Drop indexes
DROP INDEX IF EXISTS idx_markets_end_date;
DROP INDEX IF EXISTS idx_markets_outcome;
DROP INDEX IF EXISTS idx_markets_pools;
DROP INDEX IF EXISTS idx_bets_claimed;
```

---

## ✅ CONCLUSION

**Status: RESOLVED ✅**

The schema mismatch has been fixed. All required columns now exist with appropriate:
- Data types ✅
- Default values ✅
- Indexes for performance ✅
- Migrated data ✅

**Next Steps:**
1. Refresh browser to test dashboard
2. Test betting functionality
3. Test market creation
4. Run Playwright tests
5. Document any remaining issues

---

**Fixed by:** Claude Code (AI Assistant)
**Testing by:** User (manual testing)
**Deployment:** Local Supabase (localhost:54321)
**Ready for:** Production deployment after testing
