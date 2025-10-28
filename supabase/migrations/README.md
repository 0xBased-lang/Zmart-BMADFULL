# Database Migrations

This directory contains SQL migration files for the BMAD-Zmart database schema.

## Running Migrations

### Local Development (Supabase CLI)

```bash
# Make sure Supabase is running
supabase start

# Run all pending migrations
supabase db push

# Or run a specific migration
supabase db execute --file supabase/migrations/003_leaderboard_views_and_indexes.sql
```

### Production (Supabase Dashboard)

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of the migration file
3. Execute the SQL
4. Verify views and indexes were created successfully

## Migration Files

- `003_leaderboard_views_and_indexes.sql` - Story 3.9: Leaderboard views and performance indexes

## Database Views

### user_stats
Aggregates user statistics for leaderboards:
- `activity_points` - User's total activity points
- `total_bets` - Count of all bets placed
- `win_rate` - Ratio of winning bets (0.0-1.0)
- `total_profit` - Sum of profit/loss across all bets
- `total_volume` - Total amount bet

### creator_stats
Aggregates market creation statistics:
- `markets_created` - Count of markets created
- `creator_total_volume` - Sum of volume across created markets
- `active_markets` - Count of currently active markets
- `resolved_markets` - Count of resolved markets

## Performance Indexes

Critical indexes for optimal query performance:
- `idx_users_activity_points` - For points leaderboard sorting
- `idx_bets_user_wallet` - For user profile queries
- `idx_markets_creator_wallet` - For creator profile queries

## Testing Queries

Test queries are included in each migration file to verify performance.
Expected query times:
- Leaderboard queries: <100ms (95th percentile)
- Profile queries: <50ms

## Troubleshooting

**Views not updating?**
Views are automatically updated when underlying tables change. No manual refresh needed.

**Slow queries?**
Check if indexes are being used: `EXPLAIN ANALYZE your_query;`

**Migration fails?**
Check if tables (`users`, `bets`, `markets`) exist first. These should be created by earlier migrations.
