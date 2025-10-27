# Story 3.3: Build Homepage with Market Discovery

**Status:** Ready
**Epic:** 3 - Frontend & UX
**Story Points:** 5
**Priority:** High

---

## Story

As a user,
I want to browse featured and trending markets on the homepage,
So that I can discover interesting predictions to bet on.

---

## Acceptance Criteria

### AC-3.3.1: Homepage Route Displays Market Grid
- [ ] Route `/` renders homepage
- [ ] Grid layout displays active markets
- [ ] Markets fetched using `useMarkets()` hook from Story 3.2

### AC-3.3.2: Market Cards Display Key Information
- [ ] Card shows: question/title
- [ ] Card shows: current odds (YES % / NO %)
- [ ] Card shows: end date
- [ ] Card shows: total volume
- [ ] Card shows: category (if present)
- [ ] Card is clickable (navigates to market detail - Story 3.4)

### AC-3.3.3: Search Functionality
- [ ] Search bar component above grid
- [ ] Filters markets by question text
- [ ] Updates results as user types (debounced)
- [ ] Shows "No results" message when no matches

### AC-3.3.4: Category Filter Dropdown
- [ ] Dropdown with categories: All, Politics, UFOs, Crypto, Health, Sports, Entertainment
- [ ] Filters markets by selected category
- [ ] "All" option shows all markets

### AC-3.3.5: Sort Options
- [ ] Sort dropdown with options:
  - Trending (most volume)
  - Ending Soon (soonest end_time)
  - Recently Created (newest created_at)
- [ ] Default: Trending
- [ ] Updates grid when sort changes

### AC-3.3.6: Quick Stats Header
- [ ] Display: Total Active Markets
- [ ] Display: Total Volume (24h) - sum of all market volumes
- [ ] Display: Total Users - count from database
- [ ] Stats update in real-time (optional)

### AC-3.3.7: Responsive Grid Layout
- [ ] Desktop (≥1024px): 3 columns
- [ ] Tablet (768px-1023px): 2 columns
- [ ] Mobile (<768px): 1 column
- [ ] Grid uses Tailwind responsive classes

### AC-3.3.8: Successfully Loads and Displays Markets
- [ ] No TypeScript errors
- [ ] Loading state shown while fetching
- [ ] Error state shown if fetch fails
- [ ] Empty state shown if no markets
- [ ] Build successful

---

## Prerequisites

- ✅ Story 3.1: Next.js app initialized
- ✅ Story 3.2: Supabase hooks (useMarkets, useMarket)

---

## Technical Design

### Component Structure
```
app/
├── page.tsx                      # Homepage (updated)
└── components/
    ├── MarketList.tsx           # Grid of market cards (Story 3.2)
    ├── MarketCard.tsx           # Individual market card (NEW)
    ├── SearchBar.tsx            # Search input (NEW)
    ├── CategoryFilter.tsx       # Category dropdown (NEW)
    ├── SortDropdown.tsx         # Sort options (NEW)
    └── StatsHeader.tsx          # Quick stats (NEW)
```

### Homepage Layout
```typescript
// app/page.tsx
export default function Home() {
  return (
    <div>
      <StatsHeader />
      <div className="filters">
        <SearchBar />
        <CategoryFilter />
        <SortDropdown />
      </div>
      <MarketGrid />
    </div>
  )
}
```

### Market Card Component
```typescript
// app/components/MarketCard.tsx
interface MarketCardProps {
  market: Market
}

export function MarketCard({ market }: MarketCardProps) {
  const yesOdds = calculateYesOdds(market)
  const noOdds = calculateNoOdds(market)

  return (
    <Link href={`/markets/${market.id}`}>
      <div className="market-card">
        <span className="category">{market.category}</span>
        <h3>{market.question}</h3>
        <div className="odds">
          <span>YES: {yesOdds}%</span>
          <span>NO: {noOdds}%</span>
        </div>
        <div className="metadata">
          <span>Volume: ${market.total_volume}</span>
          <span>Ends: {formatDate(market.end_time)}</span>
        </div>
      </div>
    </Link>
  )
}
```

### Search Implementation
```typescript
// app/components/SearchBar.tsx
import { useState, useEffect } from 'react'
import { useDebouncedValue } from '@/lib/hooks/useDebounce'

export function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)

  useEffect(() => {
    onSearch(debouncedQuery)
  }, [debouncedQuery, onSearch])

  return (
    <input
      type="search"
      placeholder="Search markets..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  )
}
```

### Filtering Logic
```typescript
// app/page.tsx or custom hook
function filterMarkets(markets: Market[], filters: {
  search: string
  category: string | null
  sort: 'trending' | 'ending-soon' | 'recent'
}) {
  let filtered = markets

  // Search filter
  if (filters.search) {
    filtered = filtered.filter(m =>
      m.question.toLowerCase().includes(filters.search.toLowerCase())
    )
  }

  // Category filter
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter(m => m.category === filters.category)
  }

  // Sort
  switch (filters.sort) {
    case 'trending':
      filtered = filtered.sort((a, b) => b.total_volume - a.total_volume)
      break
    case 'ending-soon':
      filtered = filtered.sort((a, b) =>
        new Date(a.end_time).getTime() - new Date(b.end_time).getTime()
      )
      break
    case 'recent':
      filtered = filtered.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      break
  }

  return filtered
}
```

---

## Testing Approach

### Manual Testing
1. Load homepage at http://localhost:3000
2. Verify markets display in grid
3. Test search: type "crypto" → see filtered results
4. Test category filter: select "Politics" → see only politics markets
5. Test sort: select "Ending Soon" → verify order changes
6. Test responsive: resize browser → verify column count changes
7. Test empty state: search for "xyz123" → see "No results"

### Build Validation
```bash
cd frontend
npm run build
# Should compile successfully with no errors
```

---

## Responsive Design

### Tailwind Grid Classes
```html
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {/* Market cards */}
</div>
```

### Breakpoints
- `sm:` 640px (not used for grid)
- `md:` 768px (2 columns)
- `lg:` 1024px (3 columns)

---

## Implementation Notes

### Search Debouncing
- Implement `useDebounce` hook or use `lodash.debounce`
- Wait 300ms after user stops typing before filtering
- Prevents excessive re-renders

### Category Options
- Extract from database or hardcode initially
- Categories: All, Politics, UFOs, Crypto, Health, Sports, Entertainment, Science, Technology, Other

### Stats Calculation
- Total Active Markets: `markets.length`
- Total Volume (24h): Sum all `market.total_volume`
- Total Users: Query `users` table count (optional for now)

### Performance Considerations
- Filtering happens client-side (fast with <100 markets)
- For 100+ markets, implement server-side filtering via Supabase query
- Consider pagination in future stories if needed

---

## Dependencies

**Existing:**
- `useMarkets()` hook from Story 3.2
- Market type definitions from Story 3.2
- Tailwind CSS from Story 3.1

**New (if needed):**
- None (all dependencies already installed)

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Homepage displays active markets in grid
- [ ] Search, filter, and sort functionality working
- [ ] Responsive design (3/2/1 columns)
- [ ] Quick stats header implemented
- [ ] No TypeScript errors
- [ ] Build successful
- [ ] Code committed with tests
- [ ] Documentation updated

---

## Story Dependencies

**Depends On:**
- ✅ Story 3.1: Next.js app structure
- ✅ Story 3.2: Supabase hooks

**Blocks:**
- Story 3.4: Market detail page (needs market card click navigation)

---

## Estimated Time

**Development:** 60-90 minutes
- Homepage layout: 10 min
- MarketCard component: 15 min
- Search bar: 10 min
- Category filter: 10 min
- Sort dropdown: 10 min
- Stats header: 10 min
- Filtering logic: 15 min
- Responsive testing: 10 min
- Polish & testing: 10 min

---

## Notes

- Market cards will link to `/markets/[id]` (implemented in Story 3.4)
- For now, clicking card doesn't need to work (href can be `#`)
- Stats header is optional if time-constrained (defer to polish story)
- Real-time stats updates can be deferred to Story 3.2 real-time hooks enhancement

---

**Ready for Development:** ✅
