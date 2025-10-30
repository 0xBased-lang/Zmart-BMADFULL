-- Step 1: Check what markets actually exist
SELECT market_id, id, title FROM markets ORDER BY market_id LIMIT 10;

-- Step 2: Check the foreign key constraint
SELECT
    tc.constraint_name,
    kcu.column_name AS comments_column,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'comments';

-- Step 3: Check the data types
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'markets' 
  AND column_name IN ('id', 'market_id');

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'comments' 
  AND column_name = 'market_id';

-- Step 4: If the constraint is wrong, fix it
-- First, drop the existing constraint
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_market_id_fkey;

-- Option A: If markets has market_id as INTEGER (most likely)
ALTER TABLE comments
  ADD CONSTRAINT comments_market_id_fkey
    FOREIGN KEY (market_id)
    REFERENCES markets(market_id)
    ON DELETE CASCADE;

-- Option B: If that fails, it means market_id is not the primary key
-- In that case, we might need to reference markets(id) instead
-- But first check what markets.id looks like

-- Step 5: Test by inserting a comment for a market that exists
-- Replace 10 with an actual market_id from Step 1
-- Example:
-- INSERT INTO comments (market_id, commenter_wallet, comment_text)
-- VALUES (10, 'EbhZNcMVvTuHcHk5iuhLwzHCaFrkRpHqrusGge6o2wRX', 'Test comment')
-- RETURNING *;
