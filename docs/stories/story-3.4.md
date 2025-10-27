# Story 3.4: Build Market Detail Page with Betting Interface

**Epic:** 3 - Frontend & UX
**Story Points:** 8
**Priority:** P0
**Status:** ready-for-dev

---

## User Story

**As a bettor,**
I want to view market details and place bets with my wallet,
So that I can participate in predictions.

---

## Acceptance Criteria

### AC-3.4.1: Market Detail Route
- [ ] Route `/markets/[id]` displays comprehensive market information
- [ ] Dynamic routing with market ID parameter
- [ ] 404 page for invalid/non-existent market IDs
- [ ] Loading state while fetching market data
- [ ] Error state for fetch failures

### AC-3.4.2: Large Odds Display
- [ ] YES percentage displayed prominently (green theme)
- [ ] NO percentage displayed prominently (red theme)
- [ ] Real-time updates using `useLiveOdds()` hook from Story 3.2
- [ ] Visual indication when odds change (subtle animation)
- [ ] Percentage formatted to 1 decimal place (e.g., "73.5%")

### AC-3.4.3: Market Metadata Display
- [ ] Market question/title (large, prominent)
- [ ] Creator wallet address (truncated with copy button)
- [ ] End date and time (countdown if <24 hours)
- [ ] Resolution criteria (expandable text if long)
- [ ] Bond amount (formatted as SOL)
- [ ] Market status (Active, Resolved, Expired)
- [ ] Total volume (formatted as USD)
- [ ] Number of participants
- [ ] Creation date

### AC-3.4.4: Betting Interface Panel
- [ ] Amount input field (numeric only)
- [ ] YES/NO toggle or buttons
- [ ] Fee breakdown preview:
  - Platform fee: 1%
  - Team fee: 1%
  - Burn fee: 0.5%
  - Creator fee: 0.5-2% (dynamic based on market)
  - Total fees displayed
  - Net amount after fees
- [ ] Estimated shares to receive
- [ ] Current wallet balance display
- [ ] Insufficient balance warning

### AC-3.4.5: Wallet Integration
- [ ] "Connect Wallet" button if not connected
- [ ] Wallet balance check before bet placement
- [ ] Transaction confirmation modal
- [ ] Transaction signing with wallet
- [ ] Success/failure feedback
- [ ] Transaction hash display with Solana Explorer link

### AC-3.4.6: Solana Program Integration
- [ ] Call `placeBet` instruction on core-markets program
- [ ] Handle transaction errors gracefully
- [ ] Update UI optimistically on success
- [ ] Refresh market data after successful bet

### AC-3.4.7: Odds Chart/Visualization (Optional)
- [ ] Line chart showing odds over time
- [ ] Last 24 hours, 7 days, 30 days views
- [ ] Hover to see exact timestamp and odds
- [ ] Responsive chart sizing
- [ ] Fallback if no historical data

### AC-3.4.8: Mobile Responsive Design
- [ ] Single column layout on mobile
- [ ] Bottom sheet for betting interface on mobile
- [ ] Touch-friendly buttons and inputs
- [ ] Swipeable chart on mobile

### AC-3.4.9: Build Success
- [ ] No TypeScript errors
- [ ] All components properly typed
- [ ] Build completes successfully
- [ ] No console errors in browser

---

## Dependencies

**Required Stories:**
- ✅ Story 3.1: Next.js with Solana wallet adapter
- ✅ Story 3.2: Supabase hooks (useMarket, useLiveOdds)
- ✅ Story 3.3: Homepage with market links

**Backend Requirements:**
- ✅ Story 2.3: Core markets program deployed
- ✅ Story 2.9: Frontend query endpoints

**External Libraries:**
- @solana/web3.js - Transaction building
- @project-serum/anchor - Program interaction
- recharts or chart.js - Odds visualization (optional)

---

## Technical Design

### Component Architecture

```
/markets/[id]/page.tsx (Server Component)
├── MarketDetailClient.tsx (Client Component)
    ├── MarketHeader.tsx
    │   ├── Title & Status
    │   ├── Creator Info
    │   └── Metadata Display
    ├── OddsDisplay.tsx
    │   ├── YES Percentage
    │   ├── NO Percentage
    │   └── Real-time Updates
    ├── BettingPanel.tsx
    │   ├── AmountInput.tsx
    │   ├── OutcomeSelector.tsx
    │   ├── FeeBreakdown.tsx
    │   └── PlaceBetButton.tsx
    ├── OddsChart.tsx (Optional)
    │   ├── TimeRangeSelector.tsx
    │   └── LineChart.tsx
    └── MarketActivity.tsx
        ├── Recent Bets
        └── Volume Stats
```

### Data Flow

1. **Page Load:**
   - Fetch market data with `useMarket(id)`
   - Subscribe to real-time odds with `useLiveOdds(id)`
   - Check wallet connection status

2. **Bet Placement:**
   ```typescript
   // Pseudo-code flow
   1. Validate input amount
   2. Check wallet balance
   3. Calculate fees and net amount
   4. Build transaction with Anchor
   5. Request wallet signature
   6. Submit to Solana
   7. Show success/error
   8. Refresh market data
   ```

3. **Real-time Updates:**
   - WebSocket subscription for odds changes
   - Optimistic UI updates on bet placement
   - Auto-refresh every 30 seconds as fallback

### State Management

```typescript
interface MarketDetailState {
  market: Market | null
  loading: boolean
  error: Error | null

  // Betting state
  betAmount: number
  selectedOutcome: 'YES' | 'NO' | null
  fees: FeeBreakdown
  estimatedShares: number
  placingBet: boolean

  // Real-time state
  currentOdds: { yes: number, no: number }
  oddsHistory: OddsPoint[]
  lastUpdate: Date
}
```

### Error Handling Strategy

1. **Network Errors:**
   - Retry with exponential backoff
   - Show user-friendly error messages
   - Provide manual refresh option

2. **Wallet Errors:**
   - Clear instructions for wallet connection
   - Handle rejection gracefully
   - Show wallet-specific error messages

3. **Transaction Errors:**
   - Parse Solana program errors
   - Display actionable error messages
   - Log errors for debugging
   - Provide retry mechanism

4. **Validation Errors:**
   - Inline validation messages
   - Prevent submission of invalid data
   - Clear indication of issues

---

## Implementation Checklist

### Phase 1: Core Page Setup
- [ ] Create `/markets/[id]` route
- [ ] Set up dynamic routing
- [ ] Implement data fetching with useMarket hook
- [ ] Add loading and error states

### Phase 2: Market Display
- [ ] Build MarketHeader component
- [ ] Implement OddsDisplay with real-time updates
- [ ] Add market metadata section
- [ ] Create responsive layout

### Phase 3: Betting Interface
- [ ] Create BettingPanel component
- [ ] Implement amount input with validation
- [ ] Add outcome selector (YES/NO)
- [ ] Calculate and display fees
- [ ] Show estimated shares

### Phase 4: Wallet Integration
- [ ] Add wallet connection check
- [ ] Implement balance checking
- [ ] Create transaction confirmation modal
- [ ] Handle wallet signatures

### Phase 5: Solana Program Integration
- [ ] Set up Anchor provider
- [ ] Implement placeBet function
- [ ] Handle transaction submission
- [ ] Process success/failure states
- [ ] Add Explorer links

### Phase 6: Optional Enhancements
- [ ] Add odds history chart
- [ ] Implement market activity feed
- [ ] Add share/bookmark functionality
- [ ] Implement keyboard shortcuts

### Phase 7: Testing & Polish
- [ ] Test all error scenarios
- [ ] Verify mobile responsiveness
- [ ] Check accessibility
- [ ] Performance optimization
- [ ] Final build validation

---

## Test Cases

### Functional Tests
1. Market loads correctly with valid ID
2. 404 shown for invalid market ID
3. Odds update in real-time
4. Bet placement with sufficient balance succeeds
5. Bet placement with insufficient balance shows error
6. Wallet connection flow works
7. Transaction confirmation and signing works
8. Success message and data refresh after bet
9. Fee calculation is accurate
10. Mobile layout renders correctly

### Edge Cases
1. Market that has ended (no betting allowed)
2. Market with 0 volume (initial state)
3. Very large bet amounts (overflow handling)
4. Very small bet amounts (minimum check)
5. Network disconnection during bet placement
6. Wallet disconnection during transaction
7. Multiple rapid bet attempts
8. Odds change during bet placement

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] No TypeScript errors
- [ ] Build succeeds without warnings
- [ ] Tested on desktop and mobile
- [ ] Wallet integration tested with devnet
- [ ] Error handling for all scenarios
- [ ] Loading states for all async operations
- [ ] Documentation updated
- [ ] Code reviewed and approved
- [ ] Deployed to preview environment

---

## Notes

- Focus on core betting functionality first
- Chart visualization is optional for MVP
- Use devnet for initial testing
- Consider adding bet history in future story
- Market comments feature is Story 3.11

---

## Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Wallet Adapter Docs](https://github.com/solana-labs/wallet-adapter)
- Core Markets Program IDL (from Story 2.3)