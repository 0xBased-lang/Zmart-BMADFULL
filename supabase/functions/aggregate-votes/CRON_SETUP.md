# Supabase Cron Job Setup for Vote Aggregation
**Story 2.3:** Vote Aggregation and On-Chain Result Posting
**Purpose:** Automatically aggregate votes when voting periods end

## Overview

The cron job triggers the `aggregate-votes` Edge Function every 15 minutes to check for markets with ended voting periods that haven't had their votes aggregated yet.

## Setup Instructions

### 1. Access Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project (BMAD-Zmart)
3. Navigate to: **Database** → **Extensions** → Enable **pg_cron**

### 2. Create Cron Job via SQL

Run this SQL in the SQL Editor:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job for vote aggregation
-- Runs every 15 minutes
SELECT cron.schedule(
    'aggregate-ended-votes',           -- Job name
    '*/15 * * * *',                     -- Every 15 minutes
    $$
    SELECT net.http_post(
        url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/aggregate-votes',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.service_role_key')
        ),
        body := jsonb_build_object('market_id', m.market_id::text)
    )
    FROM markets m
    WHERE m.status = 'VOTING'
      AND m.voting_end < NOW()
      AND NOT EXISTS (
          SELECT 1 FROM vote_results vr
          WHERE vr.market_id = m.market_id
      )
    LIMIT 1; -- Process one market at a time to avoid rate limits
    $$
);
```

**Important:** Replace `YOUR_PROJECT_ID` with your actual Supabase project ID.

### 3. Verify Cron Job

```sql
-- View all cron jobs
SELECT * FROM cron.job;

-- View cron job execution history
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

### 4. Manual Trigger (for testing)

Test the aggregation manually via curl:

```bash
curl -X POST \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/aggregate-votes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{"market_id": "1"}'
```

## How It Works

1. **Cron Job Runs** (every 15 minutes)
2. **Query Markets**: Finds markets where:
   - Status = VOTING
   - voting_end < NOW() (ended)
   - No vote_results entry exists (not yet aggregated)
3. **Trigger Edge Function**: Calls aggregate-votes with market_id
4. **Edge Function**:
   - Fetches all votes from PostgreSQL
   - Aggregates vote weights
   - Generates Merkle root
   - Posts result to Solana
5. **Event Listener**: Syncs VoteResultPosted event back to PostgreSQL

## Monitoring

### Check Cron Execution Logs

```sql
-- Recent cron executions
SELECT
    jobid,
    runid,
    start_time,
    end_time,
    status,
    return_message
FROM cron.job_run_details
WHERE jobname = 'aggregate-ended-votes'
ORDER BY start_time DESC
LIMIT 20;
```

### Check Aggregation Success Rate

```sql
-- Markets awaiting aggregation
SELECT COUNT(*) AS markets_awaiting_aggregation
FROM markets
WHERE status = 'VOTING'
  AND voting_end < NOW()
  AND NOT EXISTS (
      SELECT 1 FROM vote_results WHERE market_id = markets.market_id
  );

-- Successfully aggregated markets
SELECT COUNT(*) AS aggregated_markets
FROM vote_results
WHERE posted_at > NOW() - INTERVAL '24 hours';
```

## Troubleshooting

### Cron Job Not Running

```sql
-- Check if job is enabled
SELECT jobname, active FROM cron.job
WHERE jobname = 'aggregate-ended-votes';

-- Enable job if disabled
SELECT cron.alter_job(
    job_id := (SELECT jobid FROM cron.job WHERE jobname = 'aggregate-ended-votes'),
    enabled := true
);
```

### Edge Function Errors

Check Edge Function logs in Supabase Dashboard:
- **Functions** → **aggregate-votes** → **Logs**

Common errors:
- **Invalid market_id**: Market not found in database
- **Voting period not ended**: Triggered too early (shouldn't happen with cron query)
- **Vote result already exists**: Market already aggregated (shouldn't happen with cron query)
- **Solana transaction failed**: Network congestion or insufficient funds

### Manual Cleanup

If cron creates too many failed attempts:

```sql
-- Delete failed job runs
DELETE FROM cron.job_run_details
WHERE status != 'succeeded'
  AND start_time < NOW() - INTERVAL '7 days';
```

## Performance Optimization

### Rate Limiting

Process one market at a time to avoid:
- Overwhelming the Edge Function
- Solana RPC rate limits
- Supabase resource limits

```sql
-- Current: LIMIT 1 (safe for MVP)
-- Production: Increase gradually based on monitoring
```

### Batch Processing (Future Enhancement)

For production with many markets:

```sql
-- Process multiple markets in batch
LIMIT 5; -- Adjust based on capacity
```

## Maintenance

### Update Cron Schedule

```sql
-- Change from every 15 minutes to every 5 minutes
SELECT cron.alter_job(
    job_id := (SELECT jobid FROM cron.job WHERE jobname = 'aggregate-ended-votes'),
    schedule := '*/5 * * * *'
);
```

### Disable Cron (for maintenance)

```sql
SELECT cron.alter_job(
    job_id := (SELECT jobid FROM cron.job WHERE jobname = 'aggregate-ended-votes'),
    enabled := false
);
```

### Remove Cron Job

```sql
SELECT cron.unschedule('aggregate-ended-votes');
```

## Production Checklist

- [ ] pg_cron extension enabled
- [ ] Cron job created with correct schedule
- [ ] Service role key configured
- [ ] Edge Function deployed
- [ ] Manual test completed successfully
- [ ] Monitoring queries set up
- [ ] Alert system configured (optional)

---

**Status:** Ready for deployment
**Last Updated:** 2025-10-26
**Story:** 2.3 - Vote Aggregation
