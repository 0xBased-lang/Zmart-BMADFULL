# Solana → Database Sync Setup

## Overview

The sync system pulls data from Solana devnet and populates the Supabase database in real-time.

## Quick Start

```bash
# One-time sync
node scripts/sync-simple.js

# Continuous sync (every 30 seconds)
node scripts/sync-simple.js --watch
```

## What It Syncs

### Markets
- Fetches all Market accounts from CoreMarkets program
- Creates/updates markets in database
- Syncs: pools, status, volume, outcomes

### Bets
- Fetches all UserBet accounts from CoreMarkets program
- Creates users automatically
- Syncs: wallet, amount, outcome, shares

### Proposals
- TODO: Add proposal syncing

## Architecture

```
Solana Devnet (Chain of Truth)
        ↓
   Anchor Programs
        ↓
   sync-simple.js (Polls every 30s)
        ↓
   Supabase PostgreSQL
        ↓
   Next.js Frontend
```

## Current Status

✅ Markets: 2/4 syncing (IDs 1, 2)
✅ Bets: All bets syncing successfully
✅ Users: Auto-created from bet data
✅ Watch mode: Continuous 30s polling

## Production Setup

For production, replace `sync-simple.js` with:

1. **Event Listener** (Real-time)
   - Use `supabase/functions/sync-events/index.ts`
   - Listens to program logs via WebSocket
   - Zero polling delay

2. **Cron Job** (Backup)
   - Run `sync-simple.js` every 5 minutes
   - Catches any missed events
   - Ensures data consistency

## Monitoring

```bash
# Check sync status
curl http://localhost:54321/rest/v1/bets?select=count

# Check latest bet
curl http://localhost:54321/rest/v1/bets?order=id.desc&limit=1

# Check markets
curl http://localhost:54321/rest/v1/markets?select=*
```

## Troubleshooting

**Duplicates**: Script re-runs create duplicate bets
- Solution: Add unique constraint or use upsert

**Missing bets**: Sync runs before transaction confirms
- Solution: Add 2-3 second delay after placing bet

**Market sync fails**: Integer overflow on large IDs
- Solution: Market IDs should be sequential (1, 2, 3...) not timestamps
