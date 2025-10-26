# BMAD-Zmart - Epic Breakdown

**Author:** ULULU
**Date:** 2025-10-24
**Project Level:** 3
**Target Scale:** Complex System (42-59 stories, 35-week timeline)

---

## Overview

This document provides the detailed epic breakdown for BMAD-Zmart, expanding on the high-level epic list in the [PRD](./PRD.md).

Each epic includes:

- Expanded goal and value proposition
- Complete story breakdown with user stories
- Acceptance criteria for each story
- Story sequencing and dependencies

**Epic Sequencing Principles:**

- Epic 1 establishes foundational infrastructure and initial functionality
- Subsequent epics build progressively, each delivering significant end-to-end value
- Stories within epics are vertically sliced and sequentially ordered
- No forward dependencies - each story builds only on previous work

**Total Story Count:** 50 stories (12 + 12 + 14 + 12)

---

## Epic 1: Foundation & Infrastructure

**Expanded Goal:**

Establish the complete blockchain and database infrastructure for BMAD-Zmart, including all 6 Solana programs, PostgreSQL database with comprehensive indexing, event synchronization, and core betting mechanics. This epic delivers a working prediction market platform where users can create markets, place bets, and see odds update in real-time - validating the core technical architecture and extensibility patterns.

**Value Delivery:**

By the end of this epic, we will have a deployable system on Solana devnet where basic betting functionality works end-to-end, proving the viability of the modular architecture, parameter flexibility system, and registry pattern. This foundation enables all subsequent feature development.

**Build on Previous:** N/A (First epic establishes foundation)

---

### Epic 1 Stories (12 stories)

**Story 1.1: Initialize Anchor Workspace and Development Environment**

As a developer,
I want to set up the complete Anchor workspace with all 6 programs,
So that I have a structured development environment ready for implementation.

**Acceptance Criteria:**
1. Anchor workspace initialized with `anchor init bmad-zmart`
2. All 6 program directories created: `program-registry`, `parameter-storage`, `core-markets`, `market-resolution`, `proposal-system`, `bond-manager`
3. Anchor.toml configured with correct program IDs and cluster settings
4. Basic "Hello World" program compiles and deploys to localnet successfully
5. Solana CLI installed and configured for devnet access
6. Development wallet funded with devnet SOL

**Prerequisites:** None (foundational story)

---

**Story 1.2: Implement ProgramRegistry with Version Tracking**

As a platform architect,
I want a central program registry that tracks all deployed program addresses,
So that programs can discover and interact with each other without hardcoded addresses.

**Acceptance Criteria:**
1. ProgramRegistry account structure defined with HashMap<String, Pubkey> for program addresses
2. `register_program` instruction implemented with admin-only access control
3. `get_program_address` instruction returns program address by name
4. Version tracking added (program_name → {address, version})
5. Comprehensive Anchor tests validate registration and lookup
6. Successfully deployed to devnet with initial registry account created

**Prerequisites:** Story 1.1

---

**Story 1.3: Implement ParameterStorage with Global Configuration**

As a platform admin,
I want adjustable global parameters stored on-chain,
So that I can optimize fees, limits, and thresholds without redeploying smart contracts.

**Acceptance Criteria:**
1. GlobalParameters account structure defined with all numeric values (fees, limits, durations)
2. GlobalFeatureToggles account structure with boolean flags for all major features
3. `initialize_parameters` instruction creates both accounts with default values
4. `update_parameter` instruction with admin-only access, cooldown enforcement, and max change % validation
5. `update_toggle` instruction for feature flag management
6. Parameter update events emitted for audit trail
7. Comprehensive tests validate parameter updates respect safety constraints
8. Deployed to devnet with default parameters set

**Prerequisites:** Story 1.2 (registry needed for cross-program parameter access)

---

**Story 1.4: Implement CoreMarkets Program - Market Creation and Betting**

As a bettor,
I want to place bets on active markets using ZMart tokens,
So that I can participate in prediction markets.

**Acceptance Criteria:**
1. Market account structure defined (id, title, end_date, yes_pool, no_pool, status, creator, etc.)
2. `create_market` instruction implemented (admin-only for Epic 1, proposal system integration comes in Epic 2)
3. `place_bet` instruction with token transfer, pool updates, and odds calculation
4. BPS-based fee calculation and distribution to platform/team/burn/creator wallets
5. Minimum/maximum bet limits enforced from ParameterStorage
6. UserBet account created tracking bet amount, side (YES/NO), and user wallet
7. Real-time odds calculation: YES% = yes_pool / (yes_pool + no_pool)
8. Market status validation (only ACTIVE markets accept bets)
9. Comprehensive tests for betting mechanics and fee distribution
10. Successfully deployed to devnet with test markets created

**Prerequisites:** Story 1.3 (needs ParameterStorage for fees and limits)

---

**Story 1.5: Implement BondManager Program for Escrow**

As a market creator,
I want my proposal bond held in escrow securely,
So that I can receive it back when my market succeeds.

**Acceptance Criteria:**
1. BondEscrow account structure defined (creator, bond_amount, market_id, status)
2. `deposit_bond` instruction transfers tokens to escrow PDA
3. `refund_bond` instruction with graduated logic (full refund on success, partial on rejection)
4. `claim_creator_fees` instruction for market creators to withdraw accumulated fees
5. Bond escrow account is PDA derived from market_id for security
6. Comprehensive tests validate deposit, refund, and fee claim scenarios
7. Deployed to devnet

**Prerequisites:** Story 1.4 (needs CoreMarkets for market references)

---

**Story 1.6: Implement MarketResolution Program - Community Voting Foundation**

As a voter,
I want to participate in determining market outcomes,
So that the platform remains community-driven.

**Acceptance Criteria:**
1. VoteRecord account structure defined (market_id, voter, vote_choice, vote_weight, timestamp)
2. `submit_vote` instruction records vote on-chain (placeholder for Epic 2's full Snapshot integration)
3. `finalize_resolution` instruction aggregates votes and determines outcome (YES/NO/CANCELLED)
4. Market status updates to RESOLVED with winning side recorded
5. 48-hour dispute window enforced (market can't finalize until dispute period ends)
6. Admin override capability implemented for MVP progressive decentralization
7. Tests validate voting, aggregation, dispute window, and admin override
8. Deployed to devnet

**Prerequisites:** Story 1.4 (needs CoreMarkets for market resolution)

---

**Story 1.7: Implement ProposalSystem Program - Market Creation Governance**

As a market creator,
I want to propose new markets through a governance process,
So that the community controls what markets get created.

**Acceptance Criteria:**
1. Proposal account structure defined (title, description, creator, bond_amount, status, yes_votes, no_votes)
2. `create_proposal` instruction with bond requirement and proposal tax collection (1% non-refundable)
3. `vote_on_proposal` instruction (placeholder for Epic 2's full Snapshot integration)
4. `approve_proposal` instruction creates market in CoreMarkets if ≥60% YES votes
5. `reject_proposal` instruction refunds 50% of bond to creator
6. Graduated bond scaling: bond amount determines creator fee tier (0.5% to 2%)
7. Tests validate proposal creation, voting, approval, and rejection flows
8. Deployed to devnet

**Prerequisites:** Story 1.5 (needs BondManager for escrow), Story 1.4 (creates markets in CoreMarkets)

---

**Story 1.8: Set Up PostgreSQL Database with Supabase**

As a platform operator,
I want a PostgreSQL database to cache on-chain data and enable fast queries,
So that users experience sub-100ms page loads.

**Acceptance Criteria:**
1. Supabase project created with PostgreSQL database provisioned
2. Database schema defined for: markets, bets, users, proposals, votes, activity_points
3. Comprehensive indexes created on: market_id, user_wallet, end_date, status, category
4. Full-text search index on market titles and descriptions
5. Row-level security (RLS) policies configured (public read, authenticated write where appropriate)
6. Database connection tested from local development environment
7. Schema migration scripts created for version control

**Prerequisites:** None (parallel infrastructure work)

---

**Story 1.9: Implement Event Listener for Solana → Database Sync**

As a platform operator,
I want on-chain events automatically synchronized to the database,
So that frontend queries are fast and users see real-time updates.

**Acceptance Criteria:**
1. Supabase Edge Function created for event listening
2. Event listener subscribes to Anchor program events (MarketCreated, BetPlaced, MarketResolved, etc.)
3. Idempotent event handlers update PostgreSQL database (handle duplicate events gracefully)
4. Retry logic implemented for failed database writes (3 attempts with exponential backoff)
5. Error logging to Supabase for monitoring
6. Manual reconciliation SQL scripts created for emergency recovery
7. Successfully processes test events from devnet and updates database
8. Real-time subscriptions configured for frontend live updates

**Prerequisites:** Story 1.8 (needs database), Story 1.4 (needs events from programs)

---

**Story 1.10: Implement Payout Claims Functionality**

As a winning bettor,
I want to claim my payout after a market resolves,
So that I receive my winnings plus share of the losing pool.

**Acceptance Criteria:**
1. `claim_payout` instruction in CoreMarkets program
2. Payout calculation: (bet_amount + proportional_share_of_losing_pool - fees)
3. Pull-based claiming (users initiate, not automatic push)
4. Validation: market must be RESOLVED, user must have winning bet, payout not already claimed
5. UserBet account marked as "claimed" to prevent double-claims
6. Tokens transferred from market pool PDA to user wallet
7. Comprehensive tests for payout calculations and edge cases (dust handling, rounding)
8. Deployed and tested on devnet

**Prerequisites:** Story 1.6 (markets must be resolvable), Story 1.4 (betting infrastructure)

---

**Story 1.11: Implement Activity Point Tracking System**

As a platform user,
I want to earn activity points for participation,
So that I build governance weight and reputation.

**Acceptance Criteria:**
1. `activity_points` table in PostgreSQL with: user_wallet, total_points, breakdown (bets, markets_created, votes, correct_predictions)
2. Points awarded via database triggers on: bet placement (+5), market creation (+20), voting (+10), winning bets (+accuracy_bonus)
3. Leaderboard query functions created: top_by_points, top_by_win_rate, top_by_volume
4. User profile API returns activity points balance
5. Points integration tested with event listener (automatic point awards)
6. Manual point adjustment API for admin corrections if needed

**Prerequisites:** Story 1.9 (needs event sync), Story 1.8 (needs database)

---

**Story 1.12: End-to-End Integration Test and Devnet Deployment**

As a developer,
I want to validate the complete system works end-to-end on devnet,
So that I'm confident the foundation is solid before Epic 2.

**Acceptance Criteria:**
1. Complete E2E test script: create market → place bets → resolve market → claim payouts
2. All 6 programs deployed to devnet with correct addresses registered in ProgramRegistry
3. ParameterStorage initialized with default values on devnet
4. Event listener running and successfully syncing devnet events to database
5. Database queries return accurate data matching on-chain state
6. Activity points correctly awarded for test actions
7. Performance benchmarks: database queries <100ms, transaction success rate >99%
8. Documentation created: devnet program IDs, test accounts, known issues
9. All Epic 1 acceptance criteria validated and passing

**Prerequisites:** All previous Epic 1 stories

---

## Epic 2: Governance & Voting

**Expanded Goal:**

Implement the complete community governance system featuring Snapshot-style gas-free voting for both market proposals and market resolutions. This epic transforms BMAD-Zmart from an admin-controlled platform to a community-driven prediction market where users vote without gas fees, participate in market creation governance, and can dispute resolutions through a transparent process.

**Value Delivery:**

By the end of this epic, the platform will support fully democratic (or activity-weighted) community governance where any user can propose markets, the community votes to approve them, and markets resolve through community consensus with a 48-hour dispute window. This delivers the core "gas-free voting" differentiator and progressive decentralization capability.

**Build on Previous:** Requires Epic 1's complete infrastructure (programs, database, event sync) to add governance layer on top.

---

### Epic 2 Stories (12 stories)

**Story 2.1: Implement Snapshot-Style Vote Signature Verification**

As a voter,
I want to vote by signing a message with my wallet (no gas fees),
So that I can participate in governance without spending SOL.

**Acceptance Criteria:**
1. Supabase Edge Function `verify-vote-signature` created
2. Vote message format defined: {market_id, vote_choice, timestamp, nonce}
3. Ed25519 signature verification implemented using Solana wallet's public key
4. Signature validation: correct format, valid signature, timestamp within voting period, no replay attacks (nonce tracking)
5. Invalid signatures rejected with clear error messages
6. Successfully validates signatures from Phantom and Solflare wallets
7. Comprehensive tests for signature verification edge cases

**Prerequisites:** Epic 1 complete (needs database and programs)

---

**Story 2.2: Implement Vote Collection and Storage**

As a platform operator,
I want user votes stored securely off-chain,
So that we can aggregate them without gas costs.

**Acceptance Criteria:**
1. `votes` table in PostgreSQL: market_id, voter_wallet, vote_choice (YES/NO), signature, vote_weight, timestamp
2. Unique constraint on (market_id, voter_wallet) prevents double-voting
3. Vote weight calculation: democratic mode (weight=1) or weighted mode (weight=activity_points)
4. Voting period validation: market must be in VOTING status, within time window
5. Vote submission API with signature verification integration (Story 2.1)
6. Real-time vote count aggregation queries: total_yes_votes, total_no_votes, participation_rate
7. Successfully stores and retrieves votes from test scenarios

**Prerequisites:** Story 2.1 (signature verification)

---

**Story 2.3: Implement Vote Aggregation and On-Chain Result Posting**

As a platform operator,
I want to aggregate off-chain votes and post results on-chain,
So that market resolutions are transparent and verifiable.

**Acceptance Criteria:**
1. Supabase Edge Function `aggregate-votes` runs when voting period ends
2. Vote aggregation logic: sum yes_weights, sum no_weights, determine winning side (>50%)
3. Merkle root or summary hash generation for vote verification (optional: full Merkle tree for disputes)
4. `post_vote_result` instruction in MarketResolution program updates market with outcome
5. VoteResult account created on-chain with: market_id, outcome, yes_vote_weight, no_vote_weight, merkle_root, timestamp
6. Market status transitions from VOTING → DISPUTE_WINDOW (48 hours)
7. Automatic aggregation triggered via Supabase cron job or manual admin trigger
8. Tests validate aggregation accuracy and on-chain posting

**Prerequisites:** Story 2.2 (vote storage)

---

**Story 2.4: Implement Proposal Voting via Snapshot**

As a community member,
I want to vote on market proposals without gas fees,
So that I can participate in deciding what markets get created.

**Acceptance Criteria:**
1. `proposal_votes` table in PostgreSQL: proposal_id, voter_wallet, vote_choice (YES/NO), signature, vote_weight, timestamp
2. Proposal voting period configurable parameter (default: 7 days)
3. Vote submission API reuses signature verification from Story 2.1
4. Vote weight modes: democratic or activity-based (same as market resolution)
5. Real-time proposal vote tallies available via database query
6. Proposal status transitions: PENDING → VOTING → VOTE_COMPLETE
7. Successfully collects and stores proposal votes

**Prerequisites:** Story 2.1 (signature verification), Epic 1 Story 1.7 (ProposalSystem program)

---

**Story 2.5: Implement Proposal Approval/Rejection Logic**

As a platform operator,
I want proposals to automatically approve or reject based on vote results,
So that the community controls market creation.

**Acceptance Criteria:**
1. Supabase Edge Function `finalize-proposal-vote` aggregates proposal votes
2. Approval threshold: ≥60% YES votes (configurable parameter)
3. If approved: call ProposalSystem `approve_proposal` instruction → creates market in CoreMarkets
4. If rejected: call ProposalSystem `reject_proposal` instruction → refunds 50% of bond
5. Proposal tax (1% of bond) never refunded, collected regardless of outcome
6. Creator receives full bond refund on approval
7. Market creation event synced to database (via existing event listener)
8. Tests validate approval/rejection flows and bond refunds

**Prerequisites:** Story 2.4 (proposal voting), Epic 1 Story 1.7 (ProposalSystem)

---

**Story 2.6: Implement Dispute Flagging Mechanism**

As a bettor,
I want to flag a market resolution if I believe it's incorrect,
So that the community can review disputed outcomes.

**Acceptance Criteria:**
1. `disputes` table in PostgreSQL: market_id, disputer_wallet, reason_text, evidence_links, timestamp, status
2. Dispute window: 48 hours after vote result posted (enforced by market status)
3. API endpoint `flag-dispute` allows users to submit dispute with reason and evidence
4. Multiple users can flag same market (tracked separately)
5. Disputed markets show "Under Review" status in frontend
6. Admin dashboard displays disputed markets in queue
7. Tests validate dispute submission during valid window only

**Prerequisites:** Story 2.3 (vote result posting creates dispute window)

---

**Story 2.7: Implement Admin Override for Disputed Markets**

As a platform admin,
I want to review disputes and override community votes if necessary,
So that obviously incorrect resolutions can be corrected during MVP.

**Acceptance Criteria:**
1. Admin dashboard page lists markets in DISPUTE_WINDOW status with all dispute details
2. `admin_override_resolution` instruction in MarketResolution program
3. Admin can change outcome from YES → NO, NO → YES, or mark as CANCELLED
4. Override reason required (logged on-chain and in database)
5. Market status transitions from DISPUTE_WINDOW → RESOLVED (final)
6. Override event emitted and synced to database
7. Tests validate admin override functionality and status transitions

**Prerequisites:** Story 2.6 (dispute flagging)

---

**Story 2.8: Implement Voting Weight Modes (Democratic vs. Activity-Based)**

As a platform admin,
I want to toggle between democratic and activity-weighted voting,
So that we can experiment with governance models.

**Acceptance Criteria:**
1. `voting_weight_mode` parameter in ParameterStorage: DEMOCRATIC or ACTIVITY_WEIGHTED
2. Democratic mode: all votes have weight = 1
3. Activity-weighted mode: vote weight = user's activity_points balance
4. Vote weight calculation updated in both resolution voting (Story 2.2) and proposal voting (Story 2.4)
5. Admin can toggle mode via parameter update instruction
6. Frontend displays vote weight mode and user's weight on voting UI
7. Tests validate correct weight calculations in both modes

**Prerequisites:** Story 2.2 (resolution voting), Story 2.4 (proposal voting), Epic 1 Story 1.11 (activity points)

---

**Story 2.9: Implement Stale Market Auto-Cancellation**

As a platform operator,
I want markets that never resolve to automatically cancel and refund bets,
So that users don't have funds locked indefinitely.

**Acceptance Criteria:**
1. `stale_market_threshold` parameter in ParameterStorage (default: 30 days after end_date)
2. Supabase cron job `check-stale-markets` runs daily
3. Markets in ENDED status for >threshold days automatically marked CANCELLED
4. `cancel_market` instruction in CoreMarkets program refunds all bets proportionally
5. All UserBet accounts for cancelled market marked as "refunded"
6. Event emitted for cancellation, synced to database
7. Tests validate stale market detection and full refund logic

**Prerequisites:** Epic 1 Story 1.4 (CoreMarkets), Story 2.3 (market resolution flow)

---

**Story 2.10: Implement Graduated Bond Refund Logic**

As a market creator,
I want my bond refund amount to reflect the proposal outcome,
So that there's a penalty for rejected proposals but full refund for success.

**Acceptance Criteria:**
1. Bond refund logic in BondManager program:
   - Approved proposal → 100% bond refund
   - Rejected proposal → 50% bond refund
   - Cancelled market → 100% bond refund
2. `calculate_refund_amount` function implements graduated logic
3. Refund percentages configurable via ParameterStorage
4. Tests validate all refund scenarios: approval, rejection, cancellation
5. Integration tested with proposal approval/rejection (Story 2.5)

**Prerequisites:** Epic 1 Story 1.5 (BondManager), Story 2.5 (proposal outcomes)

---

**Story 2.11: Implement Creator Fee Claims**

As a market creator,
I want to claim accumulated fees from my successful market,
So that I'm rewarded for creating popular markets.

**Acceptance Criteria:**
1. Creator fee tracking in database: market_id, creator_wallet, accumulated_fees
2. Creator fee percentage based on bond tier: 0.5% (low bond), 1% (medium), 2% (high bond ≥500 ZMart)
3. `claim_creator_fees` instruction in BondManager program transfers accumulated fees to creator
4. Fee accumulation happens automatically via betting fee distribution (Epic 1 Story 1.4)
5. Creator can claim fees once market resolves (status = RESOLVED)
6. Tests validate fee accumulation, tier calculation, and claims

**Prerequisites:** Epic 1 Story 1.5 (BondManager), Epic 1 Story 1.4 (fee distribution)

---

**Story 2.12: End-to-End Governance Integration Test**

As a developer,
I want to validate the complete governance flow works end-to-end,
So that I'm confident community governance is production-ready.

**Acceptance Criteria:**
1. E2E test script: user proposes market → community votes → proposal approved → market created → users bet → voting period → community votes on resolution → dispute flagged → admin reviews → market resolves → payouts claimed
2. Gas-free voting validated: users sign messages, no SOL spent on votes
3. Activity point integration tested: weighted voting mode uses correct weights
4. Stale market cancellation tested: old markets auto-cancel and refund
5. All Epic 2 acceptance criteria passing
6. Performance benchmarks: vote submission <2s, aggregation <5s for 1000 votes
7. Documentation updated: governance workflows, admin procedures

**Prerequisites:** All previous Epic 2 stories

---

## Epic 3: Frontend & UX

**Expanded Goal:**

Build the complete Next.js 15 web application that brings the BMAD-Zmart platform to life for end users. This epic delivers all 7 core screens (market discovery, market details, betting interface, user dashboard, proposal creation, voting interface, leaderboards, admin dashboard) with responsive design, real-time updates, Solana wallet integration, and accessibility compliance. Transform the functional backend into an engaging, user-friendly prediction market experience.

**Value Delivery:**

By the end of this epic, users can access a fully functional web application where they discover markets, place bets with their Solana wallets, vote on resolutions and proposals (gas-free), track their performance on leaderboards, and claim payouts - all with a smooth, responsive UX that works on desktop and mobile browsers.

**Build on Previous:** Requires Epic 1 (backend infrastructure) and Epic 2 (governance systems) to provide the data and functionality that the frontend consumes.

---

### Epic 3 Stories (14 stories)

**Story 3.1: Initialize Next.js Application with Solana Wallet Adapter**

As a frontend developer,
I want a Next.js 15 application with Solana wallet integration,
So that users can connect their wallets and interact with the blockchain.

**Acceptance Criteria:**
1. Next.js 15 app created with TypeScript and App Router
2. Tailwind CSS configured with dark mode support
3. @solana/wallet-adapter-react and @solana/wallet-adapter-wallets installed
4. WalletProvider component wraps app with support for Phantom, Solflare, and other major wallets
5. Wallet connect button implemented in header (shows wallet address when connected)
6. RPC endpoint configured for devnet
7. Successfully connects to Phantom wallet and displays public key
8. Basic layout with header, footer, and main content area

**Prerequisites:** Epic 1 & 2 complete (backend ready)

---

**Story 3.2: Implement Supabase Client and Real-Time Subscriptions**

As a frontend developer,
I want to query the database and subscribe to real-time updates,
So that users see live market odds and vote counts.

**Acceptance Criteria:**
1. @supabase/supabase-js installed and configured
2. Supabase client initialized with project URL and anon key
3. React hooks created for database queries: `useMarkets`, `useBets`, `useVotes`
4. Real-time subscription hooks: `useMarketUpdates`, `useLiveOdds`, `useVoteCounts`
5. Successfully fetches markets from database and displays in UI
6. Real-time updates trigger re-renders when database changes
7. Error handling for network failures and offline state

**Prerequisites:** Story 3.1 (Next.js app), Epic 1 Story 1.8 (database)

---

**Story 3.3: Build Homepage with Market Discovery**

As a user,
I want to browse featured and trending markets on the homepage,
So that I can discover interesting predictions to bet on.

**Acceptance Criteria:**
1. Homepage route `/` displays grid of active markets
2. Market cards show: title, current odds (YES/NO %), end date, total volume, category
3. Search bar filters markets by title (full-text search via database)
4. Category filter dropdown (Politics, UFOs, Crypto, Health, etc.)
5. Sort options: Trending (most volume), Ending Soon, Recently Created
6. Quick stats header: Total Active Markets, Total Users, Total Volume (24h)
7. Responsive grid: 3 columns desktop, 2 columns tablet, 1 column mobile
8. Successfully loads and displays markets from database

**Prerequisites:** Story 3.2 (Supabase client), Story 3.1 (app structure)

---

**Story 3.4: Build Market Detail Page with Betting Interface**

As a bettor,
I want to view market details and place bets with my wallet,
So that I can participate in predictions.

**Acceptance Criteria:**
1. Market detail route `/market/[id]` displays comprehensive market info
2. Large odds display: YES percentage, NO percentage (updates in real-time)
3. Market metadata: creator, end date, resolution criteria, bond amount, status
4. Bet placement panel: amount input, YES/NO selection, fee breakdown preview (platform 1%, team 1%, burn 0.5%, creator 0.5-2%)
5. "Place Bet" button triggers Solana transaction via Anchor program
6. Transaction states handled: pending (spinner), success (confirmation), error (retry option)
7. Comments section displays user discussion (read-only for now, write in later story)
8. Evidence links section shows community-provided sources
9. Successfully places bet on devnet and shows confirmation

**Prerequisites:** Story 3.1 (wallet integration), Story 3.2 (database), Epic 1 Story 1.4 (CoreMarkets betting)

---

**Story 3.5: Build User Dashboard ("My Bets")**

As a bettor,
I want to see all my active bets and track my performance,
So that I can monitor my positions and claim payouts.

**Acceptance Criteria:**
1. Dashboard route `/dashboard` requires wallet connection
2. Active Bets section: displays user's unclaimed bets with unrealized P/L
3. Each bet card shows: market title, bet amount, side (YES/NO), current odds, potential payout
4. Real-time P/L updates as odds change
5. Pending Resolutions section: markets user bet on that are in voting/dispute
6. Claimable Payouts section: resolved markets with winning bets → "Claim Payout" button
7. Claim button triggers `claim_payout` transaction on-chain
8. Win/Loss statistics: total bets, wins, losses, win rate %, total profit/loss
9. Activity points balance displayed prominently
10. Successfully displays user's bets from database and enables payout claims

**Prerequisites:** Story 3.1 (wallet), Story 3.2 (database), Epic 1 Story 1.10 (payout claims)

---

**Story 3.6: Build Proposal Creation Flow**

As a market creator,
I want to propose new markets through a multi-step form,
So that I can contribute interesting predictions to the platform.

**Acceptance Criteria:**
1. Proposal route `/propose` with multi-step form wizard
2. Step 1: Market title and category selection
3. Step 2: Resolution criteria (textarea, markdown support), evidence requirements, end date picker
4. Step 3: Bond amount selection (slider with tier visualization: 100 ZMart = 0.5% fee, 500 ZMart = 2% fee)
5. Step 4: Preview showing fee breakdown (proposal tax 1% non-refundable + bond refundable)
6. Validation: title length (10-200 chars), end date (future, max 2 years out), bond amount (min 50 ZMart)
7. "Submit Proposal" button triggers ProposalSystem transaction with bond deposit
8. Success page shows proposal ID and voting period countdown
9. Successfully creates proposal on devnet

**Prerequisites:** Story 3.1 (wallet), Story 3.2 (database), Epic 1 Story 1.7 (ProposalSystem), Epic 2 Story 2.4 (proposal voting)

---

**Story 3.7: Build Voting Interface for Market Resolutions**

As a voter,
I want to vote on market resolutions with my wallet signature,
So that I can help determine outcomes without spending gas.

**Acceptance Criteria:**
1. Voting route `/vote` lists all markets in VOTING status
2. Each market card shows: title, resolution criteria, voting period countdown, current vote tally (YES %, NO %)
3. "Review Evidence" button expands panel with community comments and evidence links
4. Vote buttons: large YES and NO buttons
5. Clicking vote button triggers wallet signature request (message signing, NOT transaction)
6. Signature submitted to backend API (`/api/submit-vote`) for verification and storage
7. Vote confirmation shown with user's vote choice and weight
8. User's vote weight displayed (1 in democratic mode, activity_points in weighted mode)
9. Participation counter: "1,247 users voted (62% participation)"
10. Successfully submits gas-free vote and updates UI

**Prerequisites:** Story 3.1 (wallet signatures), Story 3.2 (database), Epic 2 Story 2.1-2.2 (vote submission)

---

**Story 3.8: Build Voting Interface for Proposals**

As a community member,
I want to vote on market proposals to control what gets created,
So that I can participate in platform governance.

**Acceptance Criteria:**
1. Proposals route `/proposals` with tabs: Pending Votes, Approved, Rejected
2. Pending tab shows proposals in VOTING status with countdown
3. Proposal cards display: title, creator, bond amount, resolution criteria, current vote tally
4. YES/NO vote buttons trigger wallet signature (same UX as resolution voting)
5. Vote submission via API (`/api/submit-proposal-vote`)
6. Vote confirmation and weight display
7. Approved/Rejected tabs show historical proposals with outcomes
8. Successfully votes on proposals gas-free

**Prerequisites:** Story 3.7 (voting UX pattern), Epic 2 Story 2.4 (proposal voting)

---

**Story 3.9: Build Leaderboards and User Profiles**

As a competitive user,
I want to see top performers and my ranking,
So that I can build reputation and compete with others.

**Acceptance Criteria:**
1. Leaderboard route `/leaderboard` with tabs: Top by Points, Top by Win Rate, Top by Volume, Top Creators
2. Each tab displays top 100 users with ranking, username (wallet address truncated), stat value, and profile link
3. Current user's ranking highlighted if in top 100
4. User profile route `/user/[wallet]` displays public stats: win rate, total bets, total profit, markets created, activity points
5. Profile shows recent bets and created markets
6. Successfully fetches leaderboard data from database
7. Responsive table/list view

**Prerequisites:** Story 3.2 (database), Epic 1 Story 1.11 (activity points)

---

**Story 3.10: Build Admin Dashboard**

As a platform admin,
I want a dashboard to manage parameters, review disputes, and monitor metrics,
So that I can operate the platform effectively.

**Acceptance Criteria:**
1. Admin route `/admin` with authentication (only admin wallet can access)
2. Parameter Management panel: displays all GlobalParameters with edit buttons
3. Parameter edit triggers `update_parameter` transaction with safety validations
4. Feature Toggles panel: on/off switches for all GlobalFeatureToggles
5. Disputed Markets queue: lists markets in DISPUTE_WINDOW with dispute details
6. "Override Resolution" button per disputed market (triggers admin override transaction)
7. Platform Metrics dashboard: total markets, active users, 24h volume, dispute rate
8. Successfully updates parameters and resolves disputes from UI

**Prerequisites:** Story 3.1 (wallet), Epic 1 Story 1.3 (ParameterStorage), Epic 2 Story 2.7 (admin override)

---

**Story 3.11: Implement Comments and Discussion System**

As a user,
I want to comment on markets and discuss predictions,
So that I can share evidence and debate with the community.

**Acceptance Criteria:**
1. Comments section on market detail page (Story 3.4 enhancement)
2. `comments` table in database: market_id, commenter_wallet, text, timestamp, upvotes
3. Comment submission API: `/api/submit-comment` (requires wallet signature for auth)
4. Comments display in chronological order with commenter wallet (truncated), timestamp, and upvote count
5. Upvote button (one upvote per wallet per comment)
6. Comment flagging button for inappropriate content (admin review)
7. Successfully posts and displays comments

**Prerequisites:** Story 3.4 (market detail page), Story 3.1 (wallet auth)

---

**Story 3.12: Implement Responsive Mobile Design (PWA)**

As a mobile user,
I want the app to work smoothly on my phone and be installable,
So that I can bet and vote from anywhere.

**Acceptance Criteria:**
1. All pages responsive and functional on 320px+ width screens
2. Mobile navigation: hamburger menu for header links
3. Touch-friendly: buttons ≥44px tap targets, adequate spacing
4. PWA manifest.json configured with app name, icons, theme colors
5. Service worker registered for offline capability
6. Install prompt appears on mobile browsers
7. Successfully installs as PWA on iOS and Android
8. Performance: Lighthouse mobile score ≥90

**Prerequisites:** All previous frontend stories (comprehensive mobile testing)

---

**Story 3.13: Implement Accessibility (WCAG 2.1 AA)**

As a user with disabilities,
I want the app to be accessible,
So that I can use the platform regardless of my abilities.

**Acceptance Criteria:**
1. Semantic HTML: proper heading hierarchy, nav/main/footer landmarks
2. Keyboard navigation: all interactive elements focusable and operable via keyboard
3. Focus indicators: visible outlines on focused elements
4. Color contrast: all text meets WCAG AA contrast ratios (4.5:1 normal, 3:1 large)
5. ARIA labels: buttons, form inputs, and interactive elements have descriptive labels
6. Screen reader testing: VoiceOver (iOS) and TalkBack (Android) can navigate app
7. Form error messages: clear, descriptive, associated with inputs
8. Lighthouse accessibility score ≥95

**Prerequisites:** All previous frontend stories (comprehensive accessibility audit)

---

**Story 3.14: End-to-End Frontend Integration Test and Performance Optimization**

As a developer,
I want to validate the complete frontend works seamlessly with the backend,
So that we're ready for user testing.

**Acceptance Criteria:**
1. E2E test suite using Playwright: full user journey from homepage → market discovery → betting → voting → payout claim
2. All 7 core screens tested for functionality and responsiveness
3. Real-time updates validated: odds changes, vote counts, new markets
4. Performance optimizations: code splitting, image optimization, lazy loading
5. Lighthouse scores: Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥90
6. Page load time: <3s on 3G, <1s on WiFi
7. Error handling tested: network failures, transaction errors, wallet disconnection
8. All Epic 3 acceptance criteria passing
9. Deployed to Vercel preview for staging testing

**Prerequisites:** All previous Epic 3 stories

---

## Epic 4: Testing, Hardening & Launch

**Expanded Goal:**

Comprehensively test the entire BMAD-Zmart platform, conduct internal security audit, optimize performance, and successfully deploy to Solana mainnet with monitoring, documentation, and operational procedures in place. This epic ensures production-readiness through rigorous testing, security validation, and a controlled launch process with seed markets and real user monitoring.

**Value Delivery:**

By the end of this epic, BMAD-Zmart will be live on Solana mainnet with >80% test coverage, zero critical vulnerabilities identified in internal audit, comprehensive monitoring/alerting, user documentation, and a soft launch validating the platform with real users before broader promotion.

**Build on Previous:** Requires Epic 1 (infrastructure), Epic 2 (governance), and Epic 3 (frontend) to be complete so the entire system can be tested and deployed as a cohesive product.

---

### Epic 4 Stories (12 stories)

**Story 4.1: Implement Comprehensive Unit Tests for Solana Programs**

As a developer,
I want >80% test coverage on all critical smart contract paths,
So that I'm confident the on-chain logic is bulletproof.

**Acceptance Criteria:**
1. Anchor test suite expanded for all 6 programs
2. CoreMarkets tests: betting, odds calculation, fee distribution, edge cases (dust, rounding)
3. MarketResolution tests: voting, aggregation, dispute window, admin override
4. ProposalSystem tests: creation, approval, rejection, bond refunds
5. BondManager tests: deposit, refund scenarios, creator fee claims
6. ParameterStorage tests: parameter updates, safety constraints, toggle management
7. ProgramRegistry tests: registration, lookup, version tracking
8. Test coverage measured: >80% line coverage on critical functions
9. All tests passing on localnet

**Prerequisites:** Epic 1, 2 complete (all programs implemented)

---

**Story 4.2: Implement Integration Tests for Multi-Program Workflows**

As a developer,
I want to test complete workflows that span multiple programs,
So that I'm confident the modular architecture works cohesively.

**Acceptance Criteria:**
1. Integration test suite for cross-program interactions
2. Test: Proposal → BondManager → ProposalSystem → CoreMarkets (complete market creation flow)
3. Test: Betting → Fee distribution → BondManager (creator fees) → Payout claims
4. Test: Voting → MarketResolution → Dispute → Admin override → Payout
5. Test: Parameter update → CoreMarkets reads new parameters correctly
6. Test: Registry lookup → Program interaction (validates registry pattern)
7. All integration tests passing on localnet

**Prerequisites:** Story 4.1 (unit tests complete)

---

**Story 4.3: Implement Frontend E2E Tests with Playwright**

As a developer,
I want automated end-to-end tests covering all user journeys,
So that frontend changes don't break core workflows.

**Acceptance Criteria:**
1. Playwright test suite with wallet mocking/automation
2. Test: User connects wallet → browses markets → places bet → transaction succeeds
3. Test: User proposes market → votes on proposal → proposal approves → market created
4. Test: User votes on resolution → dispute flagged → admin reviews → market resolves
5. Test: User claims payout after winning bet
6. Test: Mobile responsive design (viewport testing)
7. Test: Accessibility (keyboard navigation, screen reader)
8. All E2E tests passing against devnet backend

**Prerequisites:** Epic 3 complete (frontend implemented)

---

**Story 4.4: Implement Load Testing and Performance Benchmarking**

As a platform operator,
I want to validate the system performs well under load,
So that we can handle 1,000+ concurrent users.

**Acceptance Criteria:**
1. Load testing suite using k6 or Artillery
2. Database load test: 1,000+ concurrent queries, verify <100ms response times
3. Transaction throughput test: simulate 100 bets/minute, measure success rate (target >99%)
4. Real-time subscription test: 500+ concurrent WebSocket connections, measure update latency
5. Event listener stress test: 1,000 events/minute, verify sync accuracy and latency
6. Vote aggregation test: aggregate 10,000 votes, measure processing time (target <10s)
7. Performance benchmarks documented with baseline metrics
8. Bottlenecks identified and optimized (indexing, caching, query optimization)

**Prerequisites:** Epic 1, 2, 3 complete (full stack ready for load testing)

---

**Story 4.5: Conduct Internal Security Audit with Anchor Tools**

As a security-conscious developer,
I want to identify and fix all security vulnerabilities,
So that user funds are safe on mainnet.

**Acceptance Criteria:**
1. Anchor security analyzer run on all 6 programs: `anchor build --verifiable`
2. Solana security scanner (Soteria or similar) run on compiled programs
3. Manual code review checklist completed:
   - Input validation on all instructions
   - Access control (admin-only functions properly gated)
   - Integer overflow/underflow protections
   - Reentrancy protection (where applicable)
   - PDA derivation correctness
   - Token transfer security (no unauthorized drains)
4. Common Solana vulnerabilities checked: signer verification, account ownership, missing owner checks
5. All CRITICAL and HIGH severity findings fixed
6. MEDIUM findings documented with mitigation plans
7. Security audit report generated

**Prerequisites:** Story 4.1, 4.2 (tests ensure fixes don't break functionality)

---

**Story 4.6: Fix Identified Bugs and Security Issues**

As a developer,
I want to systematically fix all bugs found during testing and audits,
So that we launch with a stable, secure platform.

**Acceptance Criteria:**
1. Bug tracking system (GitHub Issues or similar) with all identified issues
2. All CRITICAL bugs fixed and retested
3. All HIGH priority bugs fixed and retested
4. MEDIUM priority bugs fixed or documented for post-launch
5. LOW priority bugs triaged (fix, defer, or won't-fix)
6. Regression testing: all tests from Stories 4.1-4.3 still passing after fixes
7. No known critical or high severity issues remaining

**Prerequisites:** Story 4.1-4.5 (testing and audit identify issues)

---

**Story 4.7: Deploy All Programs to Mainnet**

As a platform operator,
I want all 6 Solana programs deployed to mainnet,
So that the platform is live on production blockchain.

**Acceptance Criteria:**
1. All programs compiled in release mode with optimizations
2. Programs deployed to mainnet-beta using verified builds
3. ProgramRegistry initialized on mainnet with all program addresses registered
4. ParameterStorage initialized with production default values (conservative parameters)
5. GlobalFeatureToggles initialized with progressive rollout plan (some features OFF initially)
6. Program addresses documented and added to frontend environment variables
7. Deployment script created for reproducibility
8. Mainnet deployment validated: test transactions succeed

**Prerequisites:** Story 4.6 (all bugs fixed)

---

**Story 4.8: Set Up Production Database and Event Listener**

As a platform operator,
I want the production database and event synchronization running,
So that frontend queries work on mainnet.

**Acceptance Criteria:**
1. Supabase production project created (separate from dev/staging)
2. Database schema migrated to production
3. Indexes created on production database
4. Event listener Edge Function deployed to production
5. Event listener configured for mainnet-beta RPC endpoint
6. Event sync tested: mainnet transactions properly update database
7. Real-time subscriptions validated on production
8. Database backups configured (daily automatic backups)

**Prerequisites:** Story 4.7 (mainnet programs deployed, emitting events)

---

**Story 4.9: Deploy Frontend to Vercel Production**

As a platform operator,
I want the frontend deployed to production,
So that users can access the live platform.

**Acceptance Criteria:**
1. Frontend environment variables configured for mainnet (RPC, program IDs, Supabase prod)
2. Next.js app deployed to Vercel production
3. Custom domain configured (if available, else Vercel subdomain)
4. SSL/HTTPS enabled
5. CDN caching configured for static assets
6. Error tracking (Sentry) configured for production
7. Analytics (Vercel Analytics or similar) enabled
8. Production deployment validated: homepage loads, wallet connects, can view markets

**Prerequisites:** Story 4.8 (production backend ready)

---

**Story 4.10: Implement Monitoring, Alerting, and Operational Runbooks**

As a platform operator,
I want comprehensive monitoring and clear procedures,
So that I can detect and respond to issues quickly.

**Acceptance Criteria:**
1. Monitoring dashboard for key metrics: active markets, bet volume, user count, transaction success rate, dispute rate
2. Alerts configured for critical failures:
   - Event listener downtime (>5 min)
   - Database connection loss
   - Transaction failure rate >5%
   - Dispute rate >10%
3. Operational runbooks created:
   - How to manually reconcile database if event listener fails
   - How to update parameters in ParameterStorage
   - How to review and resolve disputes
   - How to emergency pause platform (toggle features OFF)
4. Admin contact info and escalation procedures documented
5. Monitoring tested with simulated failures

**Prerequisites:** Story 4.9 (production deployment)

---

**Story 4.11: Create User Documentation and Admin Guides**

As a platform operator,
I want comprehensive documentation for users and admins,
So that people can use the platform effectively.

**Acceptance Criteria:**
1. User guide created:
   - How to connect wallet
   - How to place bets
   - How to propose markets
   - How to vote on resolutions and proposals
   - How to claim payouts
   - FAQ: common questions about fees, activity points, dispute process
2. Admin guide created:
   - How to update parameters safely
   - How to review and resolve disputes
   - How to monitor platform health
   - Emergency procedures
3. Documentation hosted (GitHub wiki, docs site, or in-app help pages)
4. Video tutorials (optional): wallet setup, first bet walkthrough

**Prerequisites:** Story 4.9 (production platform ready for documentation)

---

**Story 4.12: Soft Launch with Seed Markets and User Validation**

As a platform operator,
I want to launch with seed markets and monitor real user behavior,
So that we can validate the platform before broad promotion.

**Acceptance Criteria:**
1. 10-20 seed markets created by admin covering popular conspiracy topics (aliens, crypto, politics, health)
2. Soft launch announcement to small initial user group (Twitter, Discord, invite-only)
3. Target: 100-500 early users
4. Monitor for 1-2 weeks:
   - Transaction success rate >99%
   - No critical bugs reported
   - User feedback collected via form or Discord
   - Dispute process validated with real disputes
5. Activity metrics tracked: bet volume, vote participation, proposal submissions
6. Bug fixes deployed for any issues found
7. Platform stability validated before broader marketing
8. All Epic 4 acceptance criteria passing
9. Go/No-Go decision for full public launch

**Prerequisites:** Story 4.11 (documentation ready for users), Story 4.10 (monitoring ready)

---

## Story Guidelines Reference

**Story Format:**

```
**Story [EPIC.N]: [Story Title]**

As a [user type],
I want [goal/desire],
So that [benefit/value].

**Acceptance Criteria:**
1. [Specific testable criterion]
2. [Another specific criterion]
3. [etc.]

**Prerequisites:** [Dependencies on previous stories, if any]
```

**Story Requirements:**

- **Vertical slices** - Complete, testable functionality delivery
- **Sequential ordering** - Logical progression within epic
- **No forward dependencies** - Only depend on previous work
- **AI-agent sized** - Completable in 2-4 hour focused session
- **Value-focused** - Integrate technical enablers into value-delivering stories

---

**For implementation:** Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown.
