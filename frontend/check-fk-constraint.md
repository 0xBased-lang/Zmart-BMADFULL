# Comments Foreign Key Issue

## The Problem
```
insert or update on table "comments" violates foreign key constraint "comments_market_id_fkey"
```

## Root Cause
The comments table's foreign key is likely referencing the **wrong column**!

### What We Created:
```sql
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id INTEGER NOT NULL REFERENCES markets(market_id),  -- ← This!
  ...
);
```

### The Issue:
The foreign key references `markets(market_id)`, but we need to check:
1. Does the `markets` table have a `market_id` column as INTEGER?
2. Or does it only have `id` as UUID?

## The Fix

### Option 1: If markets table has both id (UUID) and market_id (INTEGER)
```sql
-- The comments table should reference market_id
ALTER TABLE comments
  DROP CONSTRAINT IF EXISTS comments_market_id_fkey,
  ADD CONSTRAINT comments_market_id_fkey
    FOREIGN KEY (market_id)
    REFERENCES markets(market_id)
    ON DELETE CASCADE;
```

### Option 2: If markets table only has id (UUID)
```sql
-- Change comments.market_id to reference markets.id
-- This requires recreating the table or changing the column

-- Step 1: Drop the constraint
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_market_id_fkey;

-- Step 2: Add correct constraint (if markets.market_id exists)
ALTER TABLE comments
  ADD CONSTRAINT comments_market_id_fkey
    FOREIGN KEY (market_id)
    REFERENCES markets(market_id)
    ON DELETE CASCADE;
```

### Most Likely Fix (markets uses 'id' column):
The markets table probably has:
- `id` (UUID or serial) as primary key
- `market_id` (INTEGER) as Solana program ID

Comments table should reference `market_id`:
```sql
-- This should already be correct, but verify in Supabase dashboard:
-- Table: comments
-- Column: market_id (integer)
-- Foreign Key: references markets(market_id)
```

## How to Fix in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT
2. Click "Table Editor" → "comments"
3. Find the "market_id" column
4. Check the foreign key relationship
5. It should point to: `public.markets.market_id` (not `public.markets.id`)
6. If it points to the wrong column, you'll need to:
   - Drop the existing foreign key
   - Add a new one pointing to the correct column

## Quick Check Query
Run this in Supabase SQL Editor:
\`\`\`sql
-- Check the foreign key definition
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'comments';
\`\`\`

This will show you exactly what the foreign key is referencing.
