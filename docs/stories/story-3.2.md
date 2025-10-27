# Story 3.2: Implement Supabase Client and Real-Time Subscriptions

**Status:** Ready
**Epic:** 3 - Frontend & UX
**Story Points:** 3
**Priority:** High

---

## Story

As a frontend developer,
I want to query the database and subscribe to real-time updates,
So that users see live market odds and vote counts.

---

## Acceptance Criteria

### AC-3.2.1: Supabase Client Installed and Configured
- [ ] @supabase/supabase-js installed
- [ ] Environment variables configured (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- [ ] Supabase client singleton created

### AC-3.2.2: Database Query Hooks Created
- [ ] `useMarkets()` - Fetches all active markets
- [ ] `useBets(userId)` - Fetches user's bets
- [ ] `useVotes(marketId)` - Fetches votes for market resolution

### AC-3.2.3: Real-Time Subscription Hooks Created
- [ ] `useMarketUpdates()` - Subscribes to market table changes
- [ ] `useLiveOdds(marketId)` - Real-time odds updates
- [ ] `useVoteCounts(marketId)` - Real-time vote count updates

### AC-3.2.4: Data Fetching Validation
- [ ] Successfully fetches markets from database
- [ ] Displays market data in UI
- [ ] Data structure matches database schema

### AC-3.2.5: Real-Time Updates Working
- [ ] Database changes trigger re-renders
- [ ] Subscription cleanup on unmount
- [ ] No memory leaks from subscriptions

### AC-3.2.6: Error Handling
- [ ] Network failure handling
- [ ] Offline state detection
- [ ] Error messages displayed to user
- [ ] Retry logic for failed requests

### AC-3.2.7: TypeScript Types
- [ ] Database types generated from Supabase schema
- [ ] Hook return types properly typed
- [ ] No TypeScript errors

---

## Prerequisites

- ✅ Story 3.1: Next.js app initialized
- ✅ Epic 1 Story 1.8: PostgreSQL database setup with Supabase
- ✅ Supabase project created with connection details

---

## Technical Design

### File Structure
```
frontend/
├── lib/
│   ├── supabase.ts          # Supabase client singleton
│   └── hooks/
│       ├── useMarkets.ts    # Market query hook
│       ├── useBets.ts       # Bets query hook
│       ├── useVotes.ts      # Votes query hook
│       ├── useMarketUpdates.ts  # Real-time market updates
│       ├── useLiveOdds.ts   # Real-time odds
│       └── useVoteCounts.ts # Real-time vote counts
├── types/
│   └── database.types.ts    # Generated Supabase types
└── .env.local               # Environment variables
```

### Supabase Client Setup
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### Query Hook Pattern
```typescript
// lib/hooks/useMarkets.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Market } from '@/types/database.types'

export function useMarkets() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchMarkets() {
      try {
        const { data, error } = await supabase
          .from('markets')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (error) throw error
        setMarkets(data || [])
      } catch (e) {
        setError(e as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchMarkets()
  }, [])

  return { markets, loading, error }
}
```

### Real-Time Subscription Pattern
```typescript
// lib/hooks/useMarketUpdates.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Market } from '@/types/database.types'

export function useMarketUpdates() {
  const [markets, setMarkets] = useState<Market[]>([])

  useEffect(() => {
    // Initial fetch
    const fetchMarkets = async () => {
      const { data } = await supabase
        .from('markets')
        .select('*')
        .eq('status', 'active')

      if (data) setMarkets(data)
    }

    fetchMarkets()

    // Subscribe to changes
    const subscription = supabase
      .channel('market-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'markets' },
        (payload) => {
          console.log('Market change:', payload)
          // Update local state based on payload
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { markets }
}
```

---

## Database Tables (Reference)

From Epic 1 Story 1.8:
- `markets` - Market data with odds, status, end_time
- `bets` - User bets with amount, side (YES/NO)
- `votes` - Resolution votes with weight
- `proposals` - Governance proposals
- `users` - User activity points and stats

---

## Testing Approach

### Manual Testing
1. Start Next.js dev server
2. Open browser console
3. Verify Supabase connection logs
4. Check markets data loaded
5. Modify market in Supabase dashboard
6. Verify real-time update in UI

### Integration Testing
```typescript
// __tests__/supabase.test.ts
describe('Supabase Integration', () => {
  it('connects to Supabase successfully', async () => {
    const { data, error } = await supabase.from('markets').select('count')
    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('fetches markets with useMarkets hook', () => {
    const { result } = renderHook(() => useMarkets())
    expect(result.current.loading).toBe(true)
    // Wait for data...
  })
})
```

---

## Environment Variables

Required in `frontend/.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Note:** Get these from Supabase dashboard → Settings → API

---

## Implementation Notes

### Type Generation
- Use Supabase CLI to generate TypeScript types from database schema
- Command: `npx supabase gen types typescript --project-id [project-id] > types/database.types.ts`
- Run after any database schema changes

### Real-Time Configuration
- Supabase real-time requires row-level security (RLS) policies
- Enable real-time on tables: `alter publication supabase_realtime add table markets;`
- Configure in Supabase dashboard → Database → Replication

### Performance Considerations
- Use React Query or SWR for advanced caching (defer to future stories if needed)
- Implement pagination for large result sets
- Debounce real-time updates to avoid excessive re-renders

### Error Recovery
- Implement exponential backoff for retries
- Display user-friendly error messages
- Fallback to cached data when offline

---

## Dependencies

**New Dependencies:**
- `@supabase/supabase-js` (^2.x)

**Peer Dependencies:**
- React 19.x (already installed)
- TypeScript 5.x (already installed)

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Supabase client connects successfully
- [ ] Query hooks fetch data correctly
- [ ] Real-time subscriptions update UI live
- [ ] Error handling implemented
- [ ] TypeScript types generated
- [ ] No console errors
- [ ] Code committed with tests
- [ ] Documentation updated

---

## Story Dependencies

**Depends On:**
- ✅ Story 3.1: Next.js app with wallet adapter

**Blocks:**
- Story 3.3: Homepage with market discovery (needs data fetching)
- Story 3.4: Market detail page (needs market queries)
- Story 3.5: User dashboard (needs user bets queries)

---

## Estimated Time

**Development:** 45-60 minutes
- Supabase client setup: 10 min
- Query hooks: 15 min
- Real-time hooks: 20 min
- Testing & validation: 15 min

---

## Notes

- Supabase connection details should be in Vercel/production env vars
- Real-time subscriptions can be disabled if performance issues arise
- Consider React Query for advanced caching in future stories
- Database schema changes require type regeneration

---

**Ready for Development:** ✅
