# BMAD-Zmart Product Requirements Document (PRD)

**Author:** ULULU
**Date:** 2025-10-23
**Project Level:** 3
**Target Scale:** Complex System (30-50 stories, 35-week timeline)

---

## Goals and Background Context

### Goals

1. **Create the premier prediction market platform for conspiracy theories and controversial topics** - Establish BMAD-Zmart as the go-to platform where conspiracy theory enthusiasts can make accountable predictions with skin-in-the-game

2. **Enable truly community-driven governance through gas-free participation** - Democratize prediction market resolution and governance by eliminating economic barriers to participation via Snapshot-style voting

3. **Achieve financial sustainability through flexible economics** - Build a self-sustaining platform that generates revenue through adjustable fee structures while maintaining user value and engagement

4. **Pioneer activity-based meritocracy in DeFi governance** - Reward actual participation and prediction accuracy over pure capital holdings, creating a more equitable governance model

5. **Demonstrate technical excellence through modular, adaptable architecture** - Showcase innovative Solana development with parameter flexibility, registry pattern, and progressive decentralization capabilities

### Background Context

The prediction market landscape suffers from fundamental trust and participation challenges. Existing platforms rely on centralized resolution mechanisms, creating manipulation concerns and user distrust. Economic parameters are hardcoded in smart contracts, preventing optimization based on real-world behavior. Most critically, on-chain voting mechanisms impose gas fees that exclude the majority of users from governance, creating plutocratic systems where only large stakeholders have a voice.

Conspiracy theory enthusiasts represent a highly engaged but underserved market. These users seek platforms where they can put their convictions behind their predictions, build reputation through accuracy, and participate in censorship-resistant discussions. Mainstream prediction markets avoid controversial topics, leaving this passionate community without a suitable platform.

BMAD-Zmart addresses these gaps through three core innovations: (1) flexible parameter storage enabling live optimization without redeployment, (2) Snapshot-style gas-free voting for truly democratic participation, and (3) modular architecture with progressive decentralization controls. Built on Solana for sub-cent transactions and 400ms finality, the platform positions itself uniquely as the first conspiracy theory prediction market with community-driven accountability.

The 35-week quality-first development timeline reflects a commitment to bulletproof implementation over rushed launch, critical for establishing the trust necessary in a community-governed platform handling real value.

---

## Functional Requirements

### Market Creation & Betting

**FR001: Binary Prediction Market Creation**
The system shall allow users to propose binary (YES/NO) prediction markets through the proposal system with refundable bonds.

**FR002: Market Betting**
The system shall enable users to place bets on active markets using ZMart tokens with configurable minimum/maximum bet limits.

**FR003: Real-Time Odds Calculation**
The system shall calculate and display real-time market odds based on pool ratios (YES pool vs NO pool).

**FR004: Market Discovery**
The system shall provide full-text search and filtering capabilities for users to discover active, resolved, and proposed markets.

### Governance & Voting

**FR005: Snapshot-Style Voting for Proposals**
The system shall enable gas-free voting on market proposals via wallet signatures with off-chain aggregation and on-chain result posting.

**FR006: Snapshot-Style Voting for Resolutions**
The system shall enable gas-free voting on market resolutions via wallet signatures to determine YES/NO outcomes.

**FR007: Voting Weight Calculation**
The system shall support configurable voting weight modes: democratic (one wallet one vote) or weighted (activity points-based).

**FR008: Proposal Bond System**
The system shall require refundable bonds for market creation with graduated scaling (higher bonds = higher creator fee rewards).

### Parameter Management

**FR009: Global Parameter Adjustment**
The system shall store all numeric values (fees, limits, thresholds, durations) in adjustable on-chain parameter accounts that admins can update without redeployment.

**FR010: Feature Toggle System**
The system shall provide global on/off toggles for all major features enabling progressive rollout and emergency shutdowns.

**FR011: Parameter Safety Constraints**
The system shall enforce cooldown periods and maximum change percentages on parameter updates to prevent abuse.

### Fee Distribution

**FR012: Multi-Party Fee Distribution**
The system shall automatically distribute bet fees to platform (1%), team (1%), burn wallet (0.5%), and market creator (0.5-2% based on bond) using basis point calculations.

**FR013: Adjustable Fee Rates**
The system shall allow admin adjustment of all fee percentages via parameter storage without smart contract redeployment.

**FR014: Proposal Tax Collection**
The system shall collect non-refundable proposal tax (1% of bond amount) to prevent spam proposals.

### Resolution & Disputes

**FR015: Community-Driven Resolution**
The system shall enable community voting to determine market outcomes after market end time.

**FR016: Dispute Window**
The system shall provide a 48-hour dispute window after community vote during which users can flag incorrect resolutions.

**FR017: Admin Override Capability**
The system shall allow admin override of community resolutions during MVP phase as progressive decentralization safeguard.

**FR018: Stale Market Handling**
The system shall automatically cancel markets that remain unresolved beyond configurable staleness threshold with full refunds.

**FR019: Emergency Refund Mechanism**
The system shall provide emergency refund functionality for cancelled or invalid markets.

### User Management

**FR020: Activity Point Tracking**
The system shall track off-chain activity points for betting, market creation, and correct predictions to determine governance weight.

**FR021: User Profiles**
The system shall maintain user profiles with win rate statistics, profit/loss tracking, and total volume metrics.

**FR022: Leaderboards**
The system shall display leaderboards ranking users by win rate, profit, betting volume, and activity points.

**FR023: Wallet Authentication**
The system shall authenticate users via Solana wallet connection (Phantom, Solflare, etc.) without requiring separate account creation.

### Data & Performance

**FR024: Event Synchronization**
The system shall synchronize on-chain events to PostgreSQL database via event listeners (Supabase Edge Functions) for query performance.

**FR025: Real-Time Updates**
The system shall provide real-time market updates (bets, odds changes, votes) via Supabase real-time subscriptions.

**FR026: Performance Indexing**
The system shall implement comprehensive PostgreSQL indexes achieving sub-100ms query performance for 1,000+ markets.

### Content & Moderation

**FR027: Market Comments**
The system shall allow users to comment on markets for discussion and evidence sharing.

**FR028: Content Flagging**
The system shall provide user-driven flagging mechanism for inappropriate content or incorrect resolutions.

**FR029: Moderation Tools**
The system shall provide admin moderation tools for content review, comment removal, and user management.

### Payouts & Claims

**FR030: Pull-Based Payout Claims**
The system shall enable winning bettors to claim payouts on-demand (pull-based, not automatic) to prevent gas waste and attack vectors.

**FR031: Bond Refunds**
The system shall automatically refund bonds to market creators whose proposals are approved and markets successfully resolve.

**FR032: Graduated Bond Returns**
The system shall implement graduated bond refund logic based on proposal approval outcome and market completion.

### Architecture & Extensibility

**FR033: Modular Program Architecture**
The system shall implement 6 separate Solana programs (ProgramRegistry, ParameterStorage, CoreMarkets, MarketResolution, ProposalSystem, BondManager) with registry pattern for independent upgrades.

**FR034: Registry-Based Discovery**
The system shall provide central ProgramRegistry for program discovery enabling upgrades without breaking integrations.

**FR035: Market Type Extensibility**
The system architecture shall support adding new market types (multi-outcome, conditional, crowdfunding) without breaking existing binary markets.

---

## Non-Functional Requirements

**NFR001: Performance**
- Database queries shall execute in <100ms for 1,000+ markets (95th percentile)
- Solana transaction failures shall be <1% under normal network conditions
- Real-time updates shall propagate to frontend within 2 seconds of on-chain event
- Frontend page load shall complete in <3 seconds on 3G connection

**NFR002: Security**
- The system shall pass internal security audit using Anchor security tools and manual review with zero critical vulnerabilities before mainnet deployment
- All smart contract functions shall include comprehensive input validation and access controls
- The system shall implement rate limiting on proposal creation to prevent spam attacks
- Private keys and sensitive data shall never be stored or transmitted in plaintext

**NFR003: Scalability**
- The system shall support 10,000+ active markets simultaneously without performance degradation
- The database shall handle 1,000+ concurrent users with <100ms query response times
- The system shall support 500+ concurrent users on real-time subscriptions (Supabase free tier limit)
- The architecture shall support horizontal scaling through additional RPC endpoints and database read replicas

**NFR004: Reliability & Availability**
- The platform shall maintain 99% uptime (excludes Solana network outages)
- The system shall implement automatic retry logic for failed Solana transactions (3 attempts with exponential backoff)
- Event listener synchronization shall be idempotent and recoverable from failures
- The system shall provide manual reconciliation tools for database-blockchain state mismatches

**NFR005: Usability & Accessibility**
- The frontend shall be responsive and functional on desktop and mobile browsers (Chrome, Firefox, Safari, Brave)
- The UI shall achieve WCAG 2.1 AA compliance for accessibility
- The system shall provide clear error messages and user guidance for wallet interactions and transaction failures
- The platform shall support Progressive Web App (PWA) standards for mobile installation

**NFR006: Maintainability**
- The codebase shall maintain modular architecture with clear separation of concerns (6 independent Solana programs)
- All code shall include comprehensive inline documentation and README files
- The system shall implement comprehensive test coverage (>80% for critical paths)
- The architecture shall support independent upgrades of programs without breaking existing integrations (registry pattern)

**NFR007: Operational Excellence**
- The system shall emit comprehensive event logs for all critical operations (bets, votes, resolutions, parameter changes)
- The platform shall provide admin dashboard for monitoring key metrics (active markets, user count, volume, disputes)
- The system shall implement automated monitoring and alerting for critical failures (event listener downtime, database connection loss)
- The platform shall maintain disaster recovery procedures with database backups and state reconstruction capabilities

---

## User Journeys

### Journey 1: Bettor - Discovering and Betting on Markets

**Actor**: Alex, a conspiracy theory enthusiast who believes aliens will be disclosed in 2026

**Goal**: Find a relevant market, place a bet, and track outcome

**Flow**:

1. **Entry & Discovery**
   - Alex visits BMAD-Zmart homepage
   - Connects Phantom wallet (authentication)
   - Browses featured markets or uses search: "alien disclosure 2026"

   **Decision Point**: Market exists vs. doesn't exist
   - **If exists**: Proceeds to step 2
   - **If doesn't exist**: Alex can propose market (→ see Journey 2) or browse alternatives

2. **Market Evaluation**
   - Alex views market details: "Will official alien disclosure occur by Dec 31, 2026?"
   - Reviews current odds (YES: 35%, NO: 65%)
   - Checks market end date, resolution criteria, and creator reputation
   - Reads comments and community discussion

   **Decision Point**: Confident vs. uncertain
   - **If confident**: Proceeds to step 3
   - **If uncertain**: Reads more evidence, checks leaderboard for expert opinions, may exit

3. **Placing Bet**
   - Alex decides to bet 100 ZMart tokens on YES
   - System shows bet preview: amount, current odds, potential payout, fees (3.5% total)
   - Alex reviews and confirms transaction

   **Decision Point**: Transaction succeeds vs. fails
   - **If succeeds**: Receives confirmation, position shown in profile → step 4
   - **If fails**: Error message with retry option (insufficient balance, network error, etc.)

4. **Monitoring & Tracking**
   - Alex's bet appears in "My Bets" dashboard
   - Receives real-time updates as odds change (more users bet NO, odds shift to YES: 32%)
   - Can see unrealized profit/loss
   - Gets notification when market reaches end date

5. **Resolution & Claiming**
   - Market end date arrives (Dec 31, 2026)
   - Community votes on resolution (Snapshot-style, gas-free)

   **Decision Point**: Vote aligns with bet vs. doesn't align
   - **If YES wins**: Alex receives payout claim notification → proceeds to step 6
   - **If NO wins**: Alex loses bet, no payout, updates win/loss record

6. **Payout Claim**
   - Alex clicks "Claim Payout" button
   - System calculates winnings: (original bet + share of losing pool - fees)
   - Alex signs transaction to claim
   - ZMart tokens transferred to wallet, win rate updated on profile

**Edge Cases**:
- **Dispute scenario**: Community vote resolves NO, but Alex believes evidence supports YES → Alex flags dispute during 48-hour window → Admin reviews → Final outcome determined
- **Stale market**: Market never resolves after 30 days → Auto-cancelled → Alex receives full refund
- **Mid-market exit**: If future feature allows selling positions, Alex could exit early

---

### Journey 2: Market Creator - Proposing a New Prediction Market

**Actor**: Jordan, a conspiracy theory content creator with 10K Twitter followers

**Goal**: Create a market about upcoming political conspiracy theory to engage audience

**Flow**:

1. **Market Idea & Preparation**
   - Jordan has theory: "Will [politician] be revealed as [conspiracy] by [date]?"
   - Logs into BMAD-Zmart, navigates to "Propose Market"
   - Reviews proposal requirements: bond amount, resolution criteria, evidence sources

2. **Proposal Submission**
   - Jordan fills out market proposal form:
     - **Title**: "Will [politician] be revealed as [conspiracy] by Q4 2026?"
     - **Resolution criteria**: Official government report, mainstream media confirmation (3+ outlets), or verified leaked documents
     - **End date**: December 31, 2026
     - **Bond amount**: 500 ZMart tokens (higher bond = 2% creator fee vs. 0.5% baseline)
     - **Category**: Politics/Government

   - System shows preview: 1% proposal tax (5 ZMart non-refundable) + 500 ZMart refundable bond
   - Jordan confirms and signs transaction

   **Decision Point**: Transaction succeeds vs. fails
   - **If succeeds**: Proposal enters community voting → step 3
   - **If fails**: Error handling (insufficient balance, network error, duplicate market detected)

3. **Community Voting Period**
   - Proposal appears in "Pending Markets" section
   - Community votes YES/NO via Snapshot-style signatures (gas-free)
   - Jordan promotes on Twitter to rally support
   - Voting period: 7 days (configurable parameter)

   **Decision Point**: Proposal approved vs. rejected
   - **If approved (≥60% YES votes)**: Market goes live → step 4
   - **If rejected (<60% YES votes)**:
     - Jordan receives 50% bond refund (250 ZMart)
     - Proposal tax (5 ZMart) NOT refunded
     - Can revise and resubmit with improvements

4. **Market Goes Live**
   - Jordan's market becomes active
   - Jordan shares link with Twitter audience
   - Early users start placing bets
   - Jordan earns 2% creator fee on every bet (due to 500 ZMart bond tier)

5. **Market Lifecycle**
   - Jordan monitors betting activity and discussion
   - Engages in comments section, provides evidence updates
   - Market reaches end date (Dec 31, 2026)

   **Decision Point**: Market resolves normally vs. complications
   - **If resolves normally**: Community votes → outcome determined → step 6
   - **If dispute occurs**: 48-hour dispute window → Admin review → Final resolution

6. **Bond Refund & Rewards**
   - Market successfully resolves (let's say NO wins)
   - Jordan's 500 ZMart bond fully refunded
   - Jordan keeps accumulated 2% creator fees from all bets (~40 ZMart from 2,000 total volume)
   - Activity points credited for successful market creation

**Edge Cases**:
- **Market never resolves**: If market becomes unresolvable (evidence never emerges) → Admin cancels after 30 days → Jordan receives full bond refund
- **Low participation**: If market gets <10 bets total → May still resolve, but Jordan earns minimal creator fees
- **Malicious proposal**: If Jordan proposes obvious spam/joke market → Community rejects → Only 50% bond refund as penalty

---

### Journey 3: Voter - Participating in Market Resolution

**Actor**: Sam, an active community member who wants to help resolve markets fairly

**Goal**: Vote on market resolution and contribute to community governance

**Flow**:

1. **Resolution Notification**
   - Sam logs into BMAD-Zmart
   - Dashboard shows "3 Markets Ready for Resolution"
   - Sam clicks on market: "Will UFO hearing reveal classified evidence by June 2026?"
   - Market end date: June 30, 2026 (has passed)

2. **Evidence Review**
   - Sam reviews market details and resolution criteria
   - Reads comments section where users posted evidence:
     - User A: "Congress hearing happened, but no classified docs released"
     - User B: "Video link to hearing, no evidence shown"
     - User C: "This should resolve NO based on criteria"

   - Sam checks external sources (news articles, official transcripts)

   **Decision Point**: Evidence clear vs. ambiguous
   - **If clear**: Sam confidently votes → step 3
   - **If ambiguous**: Sam reads more, may abstain from voting

3. **Casting Vote**
   - Sam determines outcome should be NO (criteria not met)
   - Clicks "Vote NO" button
   - Signs message with wallet (gas-free Snapshot-style)
   - Vote recorded off-chain

   **Decision Point**: Vote successfully recorded vs. error
   - **If succeeds**: Confirmation shown, vote count updates → step 4
   - **If fails**: Error message (signature rejected, network issue) → retry

4. **Vote Aggregation**
   - Sam sees current vote tally: 73% NO, 27% YES (1,247 votes total)
   - Voting period: 48 hours from market end date
   - Sam's vote weight: 150 activity points (if weighted mode enabled) or 1 vote (democratic mode)

5. **Resolution Outcome**
   - Voting period ends
   - Final tally: 78% NO, 22% YES
   - Market resolves to NO
   - Sam earns activity points for voting participation (+10 points)

   **Decision Point**: Peaceful resolution vs. dispute
   - **If no dispute**: Market outcome final → bettors claim payouts
   - **If dispute flagged**: 48-hour dispute window opens → step 6

6. **Dispute Handling** (if applicable)
   - Some YES bettors flag dispute: "Video evidence WAS classified material"
   - Dispute enters review period
   - Admin reviews evidence and community arguments

   **Decision Point**: Admin upholds vs. overrides
   - **If admin upholds NO**: Market outcome stands, Sam's vote was correct
   - **If admin overrides to YES**: Market resolves YES instead, Sam's vote didn't align with final outcome

**Edge Cases**:
- **Low participation**: If <50 users vote total → Admin may extend voting period or manually resolve
- **50/50 split**: If community votes exactly 50/50 → Admin override used to determine outcome
- **Sam voted incorrectly**: If Sam votes YES but market resolves NO → Sam doesn't earn bonus accuracy points
- **Sybil attack attempt**: If suspicious voting pattern detected (100 wallets with 1 point each all vote same way) → Admin investigation

---

## UX and UI Vision

### UX Principles

**1. Transparency First**
Every decision, fee, and outcome must be clearly visible and understandable. Users should always know: current odds, fee breakdown, resolution criteria, voting status, and payout calculations. No hidden mechanics.

**2. Progressive Trust Building**
Design communicates platform safety through: visible admin safeguards (during MVP), clear dispute mechanisms, community vote transparency, and evidence-based resolution displays.

**3. Engagement Over Complexity**
Make betting and voting frictionless while keeping conspiracy theory content engaging. Prioritize: one-click wallet connect, gas-free voting UX, real-time odds updates, and playful but professional tone for controversial topics.

**4. Community-Centric Experience**
Emphasize community participation through: prominent voting CTAs, leaderboards showcasing top predictors, activity point visibility, and social proof (bet counts, voter participation rates).

### Platform & Screens

**Target Platforms**:
- **Primary**: Responsive web application (desktop + mobile browsers)
- **Browsers**: Chrome, Firefox, Safari, Brave (modern Web3 wallet support)
- **Mobile**: Progressive Web App (PWA) for mobile installation
- **Future**: Native mobile apps (Phase 2)

**Core Screens/Views**:

1. **Homepage/Market Discovery**
   - Featured/trending markets
   - Search and filters (category, end date, volume)
   - Quick stats (total markets, active users, volume)

2. **Market Detail Page**
   - Odds display (large, prominent YES/NO percentages)
   - Bet placement interface (amount input, preview, confirm)
   - Market info (creator, end date, resolution criteria, bond amount)
   - Comments/discussion section
   - Evidence links and community arguments

3. **User Dashboard ("My Bets")**
   - Active bets (unrealized P/L, current odds)
   - Pending resolutions (markets awaiting vote)
   - Claim payouts section
   - Win/loss statistics
   - Activity points balance

4. **Proposal Creation Flow**
   - Multi-step form (title, criteria, end date, bond amount, category)
   - Preview with fee breakdown
   - Submission confirmation

5. **Voting Interface**
   - Markets ready for resolution (list view)
   - Evidence review panel
   - Vote buttons (YES/NO with gas-free signature)
   - Current vote tally and participation

6. **Leaderboard/Community**
   - Top predictors (win rate, profit, volume)
   - Most active voters
   - Top market creators
   - User profiles (public stats)

7. **Admin Dashboard** (Progressive decentralization controls)
   - Parameter adjustment interface
   - Feature toggle controls
   - Dispute review queue
   - Platform metrics overview

**Key Interaction Patterns**:
- **Wallet-first authentication**: No email/password, direct wallet connect
- **Real-time updates**: Live odds changes, vote counts, bet placements
- **Optimistic UI**: Show pending transactions immediately, confirm on-chain
- **Gas-free voting**: Signature-based (feels like web2 voting)
- **Pull-based claims**: Users actively claim payouts (clear CTAs when available)

### Design Constraints

**Technical UI Constraints**:
- **Browser Support**: Modern browsers with Web3 wallet extensions (no IE11)
- **Responsive Design**: Mobile-first approach, functional on 320px+ width
- **Performance**: Sub-3-second page load on 3G, <100ms UI interactions
- **Accessibility**: WCAG 2.1 AA compliance (keyboard navigation, screen readers, color contrast)

**Brand & Design System**:
- **Tone**: Edgy but professional - embraces conspiracy theory culture without being cringe
- **Color Psychology**: Consider conspiracy theory aesthetic (dark mode friendly, mysterious but trustworthy)
- **Typography**: Clear readability for odds/numbers, playful for market titles
- **Visual Hierarchy**: Odds and CTAs most prominent, admin controls subtle

**Design Patterns to Adopt**:
- **Web3 Standards**: Solana wallet adapter patterns (Phantom, Solflare)
- **Prediction Market Conventions**: Odds display formats, bet slip previews
- **Community Platforms**: Comment threading, upvoting, flagging
- **Dashboard Analytics**: Real-time charts, stats cards, trend indicators

**Design System Recommendations**:
- **Component Library**: Tailwind CSS + Headless UI (rapid development, accessibility built-in)
- **Icons**: Heroicons or Lucide (consistent, modern)
- **Charts**: Recharts or D3.js (for volume/odds visualization)
- **Animations**: Framer Motion (smooth transitions, micro-interactions)

### UI Design Goals

**Primary Goals**:
1. **Make betting feel playful but high-stakes** - Controversial topics are fun, but real money creates accountability
2. **Voting should feel effortless** - Gas-free UX indistinguishable from web2 voting
3. **Transparency builds trust** - Every fee, calculation, and decision visible
4. **Community feels alive** - Real-time activity, leaderboards, social proof

**Visual Goals**:
- **Dark mode optimized** (conspiracy theory aesthetic, crypto-native preference)
- **Numbers are heroes** (odds, payouts, vote counts - large and clear)
- **Evidence is accessible** (links, sources, discussion integrated into market view)
- **Progressive disclosure** (simple surface, complexity available on demand)

**Success Metrics**:
- Time to first bet: <2 minutes from landing page
- Vote participation rate: >60% of eligible users
- Mobile conversion: >40% of bets placed on mobile
- Error rate: <5% failed transactions (clear error messages when they occur)

---

## Epic List

### Epic 1: Foundation & Infrastructure

**Goal**: Establish core blockchain infrastructure, database systems, and basic betting mechanics to create the foundational platform for prediction markets.

**Key Deliverables**:
- 6 Solana programs deployed (ProgramRegistry, ParameterStorage, CoreMarkets, MarketResolution, ProposalSystem, BondManager)
- PostgreSQL database with comprehensive indexing
- Event listener synchronization (Solana → Supabase)
- Core betting logic (place bets, calculate odds, distribute fees)
- Activity point tracking system

**Estimated Stories**: 12-15 stories

---

### Epic 2: Governance & Voting

**Goal**: Implement community-driven governance through Snapshot-style voting for both market proposals and market resolutions.

**Key Deliverables**:
- Snapshot-style voting backend (signature verification, aggregation)
- Proposal creation and bond management
- Market resolution voting system
- Dispute mechanism with 48-hour window
- Admin override capabilities
- Vote weight calculation (democratic vs. activity-based)

**Estimated Stories**: 10-14 stories

---

### Epic 3: Frontend & UX

**Goal**: Create responsive, user-friendly web application that brings the blockchain functionality to life for end users.

**Key Deliverables**:
- Next.js application with all 7 core screens
- Solana wallet integration (Phantom, Solflare)
- Real-time market updates (Supabase subscriptions)
- Betting interface with transaction handling
- Voting UI (gas-free signature flow)
- User dashboard and profiles
- Leaderboards and community features
- Admin dashboard
- Responsive mobile design (PWA)

**Estimated Stories**: 12-18 stories

---

### Epic 4: Testing, Hardening & Launch

**Goal**: Comprehensively test the platform, conduct internal security audit, and deploy to mainnet with monitoring and operational procedures.

**Key Deliverables**:
- Comprehensive test suite (>80% coverage on critical paths)
- Internal security audit with Anchor tools
- Load testing and performance optimization
- Deployment to mainnet
- Monitoring and alerting setup
- Documentation (user guides, admin runbooks)
- Soft launch with seed markets
- Bug fixes and refinements

**Estimated Stories**: 8-12 stories

---

### Total Scope Summary

**Total Epics**: 4
**Total Stories**: 42-59 stories (midpoint: ~50 stories)
**Timeline**: 35 weeks (quality-first approach)
**Delivery Model**: Sequential epic execution, JIT tech-specs per epic

---

## Out of Scope

### Deferred to Phase 2 (Post-MVP)

**AIPAC Governance Token**
- Fixed supply governance token launch
- Retroactive distribution based on activity points
- Token burn mechanisms and supply protection
- *Rationale*: MVP focuses on core prediction market mechanics; tokenomics can be added later without breaking existing functionality

**NFT Staking System**
- 10,000 NFT collection launch
- Staking for governance weight multipliers
- Rarity-based voting bonuses
- NFT trait evolution mechanics
- *Rationale*: Requires artist collaboration and significant additional development; core platform doesn't depend on NFTs

**Advanced Market Types**
- Multi-outcome markets (3-10 outcomes beyond binary YES/NO)
- Conditional markets (if X then Y predictions)
- Combinatorial markets (correlated outcome bets)
- Crowdfunding markets (conditional funding based on outcomes)
- Scalar markets (numeric range predictions)
- *Rationale*: Binary markets validate core mechanics; extensibility architecture supports adding these later via new programs

**On-Chain Voting Option**
- Alternative to Snapshot using SPL tokens
- On-chain governance with immutable audit trail
- *Rationale*: Snapshot-style voting is MVP approach; on-chain option can be added if community demands it

**Mobile Native Applications**
- iOS and Android native apps
- Push notifications
- *Rationale*: Responsive PWA sufficient for MVP; native apps are Phase 2 investment

**Advanced Features**
- Liquidity mining and staking rewards
- Cross-chain bridges or integrations
- API for third-party integrations
- AI-powered market suggestion engine
- Advanced analytics and modeling tools
- *Rationale*: Focus on core value proposition first; these are enhancement opportunities

### Explicitly Out of Scope (Not Planned)

**Automated Market Makers (AMM)**
- Liquidity pools and continuous pricing
- *Rationale*: BMAD-Zmart uses parimutuel betting model (pool-based), not AMM. Different economic model entirely.

**Leveraged or Perpetual Positions**
- Margin trading, leverage, short selling
- *Rationale*: Adds significant complexity and risk; not core to prediction market value

**Derivatives and Complex Financial Instruments**
- Options, futures, synthetic assets
- *Rationale*: Regulatory complexity and scope bloat; prediction markets are sufficient

**KYC/Compliance Features**
- Know Your Customer verification
- Regulatory compliance infrastructure
- *Rationale*: Platform is decentralized and permissionless; adding KYC undermines censorship-resistance positioning

**Fiat On/Off Ramps**
- Credit card purchases, bank transfers
- *Rationale*: Users must acquire Solana/ZMart through existing DEXs; fiat integration adds regulatory burden

**Secondary Market for Bet Positions**
- Ability to sell active bet positions to other users
- *Rationale*: Significant complexity in pricing and mechanics; can be added later if demand exists

### Scope Clarifications

**What IS in MVP Scope:**
- Binary YES/NO prediction markets only
- Gas-free Snapshot-style voting for proposals and resolutions
- Activity points tracked off-chain (database, not blockchain tokens)
- Admin controls and progressive decentralization (feature toggles)
- Supabase backend for database and event processing
- Web-responsive frontend (desktop + mobile browsers)
- Internal security audit with free tools

**What is NOT in MVP Scope:**
- Multi-outcome markets (Phase 2)
- Tokenized governance (AIPAC) or NFTs (Phase 2)
- Native mobile apps (Phase 2)
- Third-party security audit (contingent on revenue)
- Marketing campaigns (organic/grassroots only initially)
- Multi-language support (English only for MVP)

### Scope Enforcement Strategy

**How We Prevent Scope Creep:**
1. **Feature freeze** after PRD approval - all new ideas go to Phase 2 backlog
2. **Toggle system** allows deferring features without architecture changes
3. **MVP success criteria** defined in Product Brief must be met before Phase 2 consideration
4. **35-week timeline** is quality-focused but fixed - scope adjusts downward if needed, timeline doesn't extend

**Decision Framework for Scope Requests:**
- **Question**: "Does this block MVP launch or core value proposition?"
- **If NO**: Defer to Phase 2
- **If YES**: Must remove equivalent complexity elsewhere to maintain timeline

---

**END OF PRD**

_This Product Requirements Document is complete and ready for Phase 3 (Solutioning)._
