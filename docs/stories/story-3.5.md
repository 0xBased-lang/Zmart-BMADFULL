# Story 3.5: Build User Dashboard ("My Bets")

**Epic:** 3 - Frontend & UX
**Story Points:** 5
**Priority:** P0
**Status:** ready-for-dev

---

## User Story

**As a bettor,**
I want to see all my active bets and track my performance,
So that I can monitor my positions and claim payouts.

---

## Acceptance Criteria

### AC-3.5.1: Dashboard Route & Authentication
- [ ] Dashboard route `/dashboard` requires wallet connection
- [ ] Redirect to homepage if wallet not connected
- [ ] Show wallet address at top of dashboard
- [ ] Loading state while fetching user data
- [ ] Error handling for network issues

### AC-3.5.2: Active Bets Section
- [ ] Display all user's unclaimed/active bets
- [ ] Each bet card shows:
  - Market title (clickable link to market detail)
  - Bet amount in SOL
  - Side (YES/NO) with color coding
  - Current market odds
  - Potential payout calculation
  - Unrealized P/L (profit/loss)
- [ ] Real-time updates as odds change
- [ ] Sort by: Recent, Ending Soon, P/L
- [ ] Empty state: "No active bets"

### AC-3.5.3: Pending Resolutions Section
- [ ] Show markets user bet on that are awaiting resolution
- [ ] Display markets in voting/dispute phase
- [ ] Show user's position and potential outcomes
- [ ] Countdown timer for voting deadline
- [ ] Status badge: "Voting", "In Dispute", "Pending"

### AC-3.5.4: Claimable Payouts Section
- [ ] Display resolved markets where user won
- [ ] Show claimable amount for each market
- [ ] "Claim Payout" button for each winning bet
- [ ] Batch claim button for multiple payouts
- [ ] Visual indicator for unclaimed rewards
- [ ] Success toast after claiming

### AC-3.5.5: Claim Transaction Integration
- [ ] Claim button triggers `claim_payout` on-chain
- [ ] Show confirmation modal before claiming
- [ ] Display transaction fees
- [ ] Handle wallet signature
- [ ] Show transaction status (pending/success/failed)
- [ ] Update UI after successful claim
- [ ] Error handling for failed claims

### AC-3.5.6: Win/Loss Statistics
- [ ] Display comprehensive stats:
  - Total bets placed (count)
  - Total volume wagered (SOL)
  - Number of wins
  - Number of losses
  - Win rate percentage
  - Total profit/loss (SOL and %)
  - Best performing bet
  - Current streak (wins/losses)
- [ ] Time period filter: All time, 30d, 7d, 24h
- [ ] Charts/graphs for visual representation

### AC-3.5.7: Activity Points Balance
- [ ] Display activity points prominently
- [ ] Show points breakdown:
  - Points from betting
  - Points from voting
  - Points from proposals
  - Bonus points
- [ ] Points history/transactions
- [ ] Next reward tier progress

### AC-3.5.8: Portfolio Overview
- [ ] Total portfolio value (active bets + claimable)
- [ ] Portfolio distribution chart
- [ ] Risk assessment (concentrated vs diversified)
- [ ] Performance over time graph
- [ ] Export data as CSV option

### AC-3.5.9: Mobile Responsive Design
- [ ] Responsive layout for all screen sizes
- [ ] Collapsible sections on mobile
- [ ] Touch-friendly claim buttons
- [ ] Horizontal scroll for stats cards
- [ ] Bottom navigation for sections

### AC-3.5.10: Build Success
- [ ] No TypeScript errors
- [ ] All components properly typed
- [ ] Build completes successfully
- [ ] No console errors in browser
- [ ] Performance optimized (lazy loading)

---

## Dependencies

**Required Stories:**
- ✅ Story 3.1: Wallet connection
- ✅ Story 3.2: Supabase hooks
- ✅ Story 3.4: Market detail patterns

**Backend Requirements:**
- User bets tracking in database
- Claim payout transaction support
- Activity points system

**External Libraries:**
- recharts or victory - For charts
- date-fns - Date formatting

---

## Technical Design

### Component Architecture

```
/dashboard/page.tsx (Route)
├── DashboardClient.tsx (Main Component)
    ├── PortfolioHeader.tsx
    │   ├── Total Value
    │   ├── P/L Summary
    │   └── Points Balance
    ├── ActiveBets.tsx
    │   ├── BetCard.tsx
    │   ├── P/L Calculator
    │   └── Sort Controls
    ├── PendingResolutions.tsx
    │   ├── PendingCard.tsx
    │   └── VoteStatus.tsx
    ├── ClaimablePayouts.tsx
    │   ├── ClaimCard.tsx
    │   ├── ClaimButton.tsx
    │   └── BatchClaim.tsx
    ├── WinLossStats.tsx
    │   ├── StatsCards.tsx
    │   ├── PerformanceChart.tsx
    │   └── TimeFilter.tsx
    └── ActivityPoints.tsx
        ├── PointsDisplay.tsx
        ├── PointsBreakdown.tsx
        └── TierProgress.tsx
```

### Data Flow

1. **Initial Load:**
   - Check wallet connection
   - Fetch user bets from Supabase
   - Calculate P/L and stats
   - Subscribe to real-time updates

2. **Real-time Updates:**
   - Subscribe to bet updates
   - Subscribe to market resolutions
   - Update P/L calculations
   - Refresh claimable amounts

3. **Claim Flow:**
   ```typescript
   1. User clicks "Claim"
   2. Show confirmation modal
   3. Build claim transaction
   4. Request wallet signature
   5. Submit to Solana
   6. Update UI on success
   7. Show error on failure
   ```

### State Management

```typescript
interface DashboardState {
  // User data
  walletAddress: string | null
  connected: boolean

  // Bets data
  activeBets: UserBet[]
  pendingResolutions: PendingBet[]
  claimablePayouts: ClaimableBet[]
  betHistory: HistoricalBet[]

  // Statistics
  stats: {
    totalBets: number
    totalVolume: number
    wins: number
    losses: number
    winRate: number
    totalPnL: number
    currentStreak: number
    bestBet: BetRecord | null
  }

  // Activity points
  activityPoints: {
    total: number
    breakdown: PointsBreakdown
    history: PointTransaction[]
    nextTier: TierInfo
  }

  // UI state
  loading: boolean
  error: Error | null
  selectedTimeRange: '24h' | '7d' | '30d' | 'all'
  sortBy: 'recent' | 'ending' | 'pnl'
  claimingIds: string[]
}
```

### Error Handling Strategy

1. **Wallet Errors:**
   - Clear redirect to connect wallet
   - Graceful disconnection handling
   - Session persistence

2. **Data Errors:**
   - Retry with exponential backoff
   - Cache last known good state
   - Offline mode support

3. **Transaction Errors:**
   - Parse Solana errors
   - User-friendly messages
   - Retry mechanism
   - Transaction history

4. **Calculation Errors:**
   - Validate all numbers
   - Handle division by zero
   - Overflow protection

---

## Implementation Checklist

### Phase 1: Core Dashboard Setup
- [ ] Create `/dashboard` route
- [ ] Implement wallet gate (redirect if not connected)
- [ ] Set up data fetching hooks
- [ ] Create loading skeleton

### Phase 2: Active Bets Display
- [ ] Build ActiveBets component
- [ ] Implement BetCard with all data
- [ ] Add P/L calculations
- [ ] Add real-time updates
- [ ] Implement sorting

### Phase 3: Pending & Claimable
- [ ] Build PendingResolutions component
- [ ] Build ClaimablePayouts component
- [ ] Implement claim transaction
- [ ] Add confirmation modals
- [ ] Handle success/error states

### Phase 4: Statistics & Analytics
- [ ] Build WinLossStats component
- [ ] Calculate all metrics
- [ ] Add time range filters
- [ ] Create performance chart
- [ ] Add export functionality

### Phase 5: Activity Points
- [ ] Build ActivityPoints component
- [ ] Display points balance
- [ ] Show points breakdown
- [ ] Add tier progress
- [ ] Implement history view

### Phase 6: Portfolio Overview
- [ ] Calculate total portfolio value
- [ ] Create distribution chart
- [ ] Add risk assessment
- [ ] Build performance graph

### Phase 7: Mobile & Polish
- [ ] Implement responsive design
- [ ] Add loading states everywhere
- [ ] Comprehensive error handling
- [ ] Performance optimization
- [ ] Final testing

---

## Test Cases

### Functional Tests
1. Dashboard loads with wallet connected
2. Redirects to home if wallet disconnected
3. Active bets display correctly
4. P/L updates in real-time
5. Claim button works
6. Batch claim processes multiple
7. Stats calculate correctly
8. Time filters work
9. Points display accurately
10. Mobile layout responsive

### Edge Cases
1. User with no bets (empty states)
2. User with 100+ bets (pagination)
3. Negative P/L display
4. Market cancelled (refund display)
5. Multiple claims at once
6. Wallet disconnection mid-claim
7. Network errors during fetch
8. Stale data refresh
9. Very large numbers (overflow)
10. Zero division in win rate

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] No TypeScript errors
- [ ] Build succeeds without warnings
- [ ] Tested on desktop and mobile
- [ ] Claim transactions work on devnet
- [ ] Real-time updates functional
- [ ] All edge cases handled
- [ ] Performance metrics met (<2s load)
- [ ] Documentation complete

---

## Notes

- Focus on accurate P/L calculations
- Ensure claim process is bulletproof
- Consider caching for performance
- Add tooltips for complex metrics
- Future: Add notifications for wins

---

## Resources

- [Solana Claim Transaction Docs](https://docs.solana.com)
- [Recharts Documentation](https://recharts.org)
- [Portfolio Calculation Best Practices](https://example.com)