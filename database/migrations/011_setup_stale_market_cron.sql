-- BMAD-Zmart Database Migration 011
-- Migration: Setup Stale Market Auto-Cancellation Cron Job
-- Created: 2025-10-26
-- Story: 2.9 - Implement Stale Market Auto-Cancellation
-- Description: Configure daily cron job to check and cancel stale markets
-- =============================================================================

-- Enable pg_cron extension (required for cron jobs)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =============================================================================
-- Cron Job Configuration: check-stale-markets
-- =============================================================================

-- Schedule: Daily at 2:00 AM UTC
-- Function: Calls check-stale-markets Edge Function via HTTP request
-- Purpose: Identify and cancel markets that have been ENDED for > 30 days

-- Note: This SQL creates the cron job configuration.
-- The actual Edge Function URL must be configured after deployment.
--
-- To configure cron job after deployment:
-- 1. Deploy check-stale-markets Edge Function to Supabase
-- 2. Get the Edge Function URL from Supabase dashboard
-- 3. Run this SQL with the correct URL:
--
-- SELECT cron.schedule(
--   'check-stale-markets-daily',
--   '0 2 * * *', -- Daily at 2:00 AM UTC
--   $$
--   SELECT
--     net.http_post(
--       url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-stale-markets',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
--       ),
--       body := '{}'::jsonb
--     ) as request_id;
--   $$
-- );

-- =============================================================================
-- Placeholder: Cron Job Definition
-- =============================================================================

-- This placeholder documents the cron job that will be created manually
-- via Supabase dashboard or SQL after Edge Function deployment.

COMMENT ON EXTENSION pg_cron IS
'Cron job extension for scheduled tasks.
Story 2.9: Daily check-stale-markets job runs at 2:00 AM UTC to cancel markets ENDED for >30 days.
See migration 011_setup_stale_market_cron.sql for setup instructions.';

-- =============================================================================
-- Query to verify cron job exists (run after manual setup)
-- =============================================================================

-- Run this query to check if cron job is configured:
-- SELECT * FROM cron.job WHERE jobname = 'check-stale-markets-daily';

-- Run this query to check cron job execution history:
-- SELECT * FROM cron.job_run_details WHERE jobid = (
--   SELECT jobid FROM cron.job WHERE jobname = 'check-stale-markets-daily'
-- ) ORDER BY start_time DESC LIMIT 10;

-- =============================================================================
-- MANUAL SETUP INSTRUCTIONS (After Deployment)
-- =============================================================================

-- STEP 1: Deploy check-stale-markets Edge Function
--   $ supabase functions deploy check-stale-markets

-- STEP 2: Configure secrets for Edge Function
--   $ supabase secrets set PLATFORM_AUTHORITY_KEYPAIR="[your_keypair_json]"
--   $ supabase secrets set SOLANA_RPC_URL="https://api.devnet.solana.com"

-- STEP 3: Get Edge Function URL from Supabase dashboard
--   Format: https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-stale-markets

-- STEP 4: Create cron job via SQL or Supabase dashboard
--   Option A: SQL (recommended for automation)
--     See example above, replace YOUR_PROJECT_REF with actual project reference
--
--   Option B: Supabase Dashboard
--     1. Navigate to Database → Cron Jobs
--     2. Click "Create a new cron job"
--     3. Name: check-stale-markets-daily
--     4. Schedule: 0 2 * * * (Daily at 2:00 AM UTC)
--     5. SQL: Use the SELECT net.http_post(...) query from above

-- STEP 5: Test the cron job manually (optional)
--   $ curl -X POST \
--     "https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-stale-markets" \
--     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"

-- STEP 6: Verify cron job is running
--   SELECT * FROM cron.job WHERE jobname = 'check-stale-markets-daily';
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;

-- =============================================================================
-- END OF MIGRATION 011
-- =============================================================================
