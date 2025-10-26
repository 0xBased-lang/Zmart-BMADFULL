# BMAD-Zmart Event Listener

**Supabase Edge Function for Solana → Database Sync**

## Overview

This Edge Function listens to Solana blockchain events from all 6 BMAD-Zmart programs and syncs data to the PostgreSQL database in real-time.

## Architecture

```
Solana Blockchain (Devnet)
    ↓ WebSocket Events
Edge Function (Deno)
    ↓ Parse & Transform
PostgreSQL (Supabase)
    ↓ Real-time Subscriptions
Frontend (Next.js)
```

## Supported Events

### CoreMarkets Program
- **MarketCreated**: New prediction market created
- **BetPlaced**: User places a bet
- **MarketResolved**: Market outcome determined
- **PayoutClaimed**: Winner claims payout

### BondManager Program
- **BondDeposited**: Creator deposits bond
- **CreatorFeesClaimed**: Creator claims fees

### MarketResolution Program
- **VoteSubmitted**: User votes on market outcome

### ProposalSystem Program
- **ProposalCreated**: New governance proposal
- **ProposalVote**: User votes on proposal
- **ProposalFinalized**: Proposal approved/rejected

## Deployment

### Prerequisites

1. **Supabase Project** - Created in Story 1.8
2. **Database Migrations** - Run migrations 001-004
3. **Supabase CLI** - Install: `npm install -g supabase`

### Step 1: Set Environment Variables

Create `supabase/.env`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Step 2: Deploy Edge Function

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy sync-events --no-verify-jwt

# Set environment secrets
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Step 3: Start the Listener

```bash
# Invoke the function to start listening
curl -X POST \
  https://your-project.supabase.co/functions/v1/sync-events \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"action": "start"}'
```

### Step 4: Health Check

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/sync-events \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"action": "health"}'
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-24T12:00:00.000Z"
}
```

## Monitoring

### Check Event Log

```sql
-- Recent events
SELECT * FROM event_log
ORDER BY timestamp DESC
LIMIT 100;

-- Failed events
SELECT * FROM event_log
WHERE success = false
ORDER BY timestamp DESC;

-- Event type breakdown
SELECT
    event_type,
    COUNT(*) AS total,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) AS successful,
    SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) AS failed
FROM event_log
GROUP BY event_type;
```

### Check Sync Status

```sql
-- Markets sync status
SELECT
    COUNT(*) AS total_markets,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved
FROM markets;

-- Bets sync status
SELECT
    COUNT(*) AS total_bets,
    SUM(amount) AS total_volume_lamports
FROM bets;
```

## Error Handling

### Automatic Retries

The event listener automatically retries failed events 3 times with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: 2 seconds delay
- Attempt 3: 4 seconds delay

Failed events are logged to `event_log` table with error messages.

### Manual Reconciliation

If automatic retries fail, use the reconciliation scripts:

```bash
# 1. Check for sync gaps
psql $DATABASE_URL -f database/reconciliation/check-sync-gaps.sql

# 2. Manually sync missing data
psql $DATABASE_URL -f database/reconciliation/manual-sync.sql
```

## Performance

### Expected Latency

- **Event Detection**: <1 second (WebSocket)
- **Database Insert**: <100ms
- **End-to-End Sync**: <2 seconds

### Scalability

- **Events/Second**: ~100 (per program)
- **Concurrent Connections**: 6 (one per program)
- **Database Connections**: Pooled via Supabase

## Troubleshooting

### Issue: No Events Being Synced

**Diagnosis:**
```bash
# Check function logs
supabase functions logs sync-events

# Check if function is running
curl -X POST \
  https://your-project.supabase.co/functions/v1/sync-events \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"action": "health"}'
```

**Solutions:**
- Verify RPC URL is correct
- Check Supabase service role key
- Ensure programs are deployed to devnet
- Check database permissions (RLS policies)

### Issue: Events Failing to Process

**Diagnosis:**
```sql
-- Check failed events
SELECT * FROM event_log
WHERE success = false
ORDER BY timestamp DESC
LIMIT 20;
```

**Solutions:**
- Review error messages in `event_log`
- Ensure database schema matches event structure
- Check for duplicate primary keys
- Verify data types match

### Issue: Duplicate Events

**Diagnosis:**
```sql
-- Check for duplicate signatures
SELECT signature, COUNT(*)
FROM event_log
GROUP BY signature
HAVING COUNT(*) > 1;
```

**Solutions:**
- Events should be idempotent by signature
- If duplicates exist, it's safe (ON CONFLICT DO NOTHING)
- Review `check_event_processed()` function

## Development

### Local Testing

```bash
# Start Supabase locally
supabase start

# Serve function locally
supabase functions serve sync-events --env-file supabase/.env

# Test with curl
curl -X POST http://localhost:54321/functions/v1/sync-events \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"action": "health"}'
```

### Testing with Mock Events

Create a test script to emit mock events:

```typescript
// test-events.ts
import { Connection, Keypair } from "@solana/web3.js";

const connection = new Connection("http://localhost:8899");

// Emit test events by calling program instructions
// (implementation details depend on your test setup)
```

## Production Considerations

### 1. RPC Node Selection

**Devnet**: Use public RPC (rate-limited)
**Mainnet**: Use dedicated RPC provider (QuickNode, Alchemy, Helius)

### 2. High Availability

- Deploy multiple edge function instances
- Use Supabase's built-in load balancing
- Set up health check monitoring (every 5 minutes)

### 3. Cost Optimization

- Batch database inserts (if event volume is high)
- Use connection pooling
- Cache frequently accessed data

### 4. Security

- Rotate service role keys regularly
- Use Row-Level Security (RLS) policies
- Validate all event data before insertion
- Sanitize user-generated content (titles, descriptions)

## Metrics & Analytics

### Key Performance Indicators

```sql
-- Sync latency (event timestamp vs database timestamp)
SELECT
    AVG(EXTRACT(EPOCH FROM (timestamp - created_at))) AS avg_latency_seconds
FROM event_log e
JOIN markets m ON e.signature = m.market_id
WHERE e.event_type = 'market_created'
AND e.timestamp > NOW() - INTERVAL '1 hour';

-- Events per minute
SELECT
    DATE_TRUNC('minute', timestamp) AS minute,
    COUNT(*) AS events
FROM event_log
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY minute
ORDER BY minute DESC;

-- Success rate by event type
SELECT
    event_type,
    COUNT(*) AS total,
    ROUND(AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) * 100, 2) AS success_rate_pct
FROM event_log
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY event_type;
```

## Next Steps

- ✅ Deploy Edge Function
- ✅ Run database migrations
- ⏳ Set up monitoring alerts (Supabase Dashboard)
- ⏳ Configure Supabase Realtime for frontend
- ⏳ Implement event replay for historical data
- ⏳ Add custom event filters for specific markets

## Support

For issues or questions:
- Check Supabase function logs
- Review `event_log` table
- Run reconciliation scripts
- Consult `database/reconciliation/` directory
