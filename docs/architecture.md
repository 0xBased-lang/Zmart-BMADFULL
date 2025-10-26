# BMAD-Zmart - System Architecture

**Author:** Winston (Architect) + ULULU
**Date:** 2025-10-24
**Project Level:** 3 (Complex System)
**Architecture Version:** 1.0

---

## Executive Summary

BMAD-Zmart employs a **hybrid modular architecture** combining 6 independent Solana programs with a Supabase-powered backend and Next.js 15 frontend. The architecture prioritizes **progressive decentralization**, **parameter flexibility**, and **gas-free community governance** through novel patterns including cross-program registry, Snapshot-style voting, and activity-based meritocracy. Built for Solana mainnet with a 35-week quality-first development timeline.

**Key Architectural Innovations:**
1. **Registry Pattern**: Independent program upgrades without breaking integrations
2. **Snapshot Voting**: Gas-free community governance via off-chain signatures
3. **Graduated Bond Economics**: Dynamic creator rewards based on commitment
4. **48-Hour Dispute Window**: State machine for resolution validation
5. **Activity Point Meritocracy**: Participation-based governance weight

---

## Project Initialization

**First implementation story (Story 1.1) should execute:**

```bash
# Step 1: Initialize Anchor workspace
anchor init bmad-zmart
cd bmad-zmart

# Step 2: Create 6 program directories
mkdir -p programs/{program-registry,parameter-storage,core-markets,market-resolution,proposal-system,bond-manager}

# Step 3: Initialize frontend
npx create-next-app@latest frontend --typescript --tailwind --app

# Step 4: Initialize Supabase
npx supabase init

# Step 5: Install dependencies
cd frontend && npm install @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @solana/web3.js @supabase/supabase-js zustand react-hook-form react-hot-toast date-fns framer-motion recharts

# Step 6: Install dev dependencies
npm install -D vitest @testing-library/react @playwright/test
```

---

## Technology Stack

### Blockchain Layer

| Technology | Version | Purpose |
|------------|---------|---------|
| **Solana** | mainnet-beta | L1 blockchain (sub-cent fees, 400ms finality) |
| **Anchor Framework** | 0.32.1 | Solana program development framework |
| **Solana CLI** | 2.1.15 | Deployment and testing tools |
| **Rust** | 1.85.0 | Program implementation language |
| **@solana/web3.js** | 1.95.x | JavaScript Solana SDK |

**Affects Epics:** 1 (all stories), 2 (stories 2.3, 2.5), 4 (stories 4.1-4.2, 4.7-4.8)

---

### Frontend Layer

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5 | React framework with App Router |
| **React** | 19.x | UI library (bundled with Next.js) |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | Latest | Utility-first styling |
| **Headless UI** | Latest | Accessible UI components (WCAG 2.1 AA) |
| **Wallet Adapter** | 0.15.39 | Solana wallet integration |
| **Zustand** | Latest | Global state management |
| **React Hook Form** | Latest | Form handling |
| **Framer Motion** | Latest | Animations |
| **Recharts** | Latest | Charts (odds visualization) |

**Affects Epics:** 3 (all stories)

---

### Backend Layer

| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | Latest | PostgreSQL + Edge Functions + Real-time |
| **PostgreSQL** | 15.x | Primary database (Supabase managed) |
| **Deno** | Latest | Edge Functions runtime |
| **TweetNaCl** | Latest | Ed25519 signature verification |

**Affects Epics:** 1 (stories 1.8-1.11), 2 (stories 2.1-2.9)

---

### Testing & Infrastructure

| Technology | Version | Purpose |
|------------|---------|---------|
| **Anchor Testing** | 0.32.1 | Anchor program tests (TypeScript) |
| **Vitest** | Latest | Frontend unit tests |
| **React Testing Library** | Latest | Component testing |
| **Playwright** | Latest | E2E testing |
| **Sentry** | Latest | Error tracking (production) |
| **Vercel** | Latest | Frontend deployment |
| **GitHub Actions** | N/A | CI/CD pipeline |

**Affects Epics:** 4 (all stories)

---

## Complete Project Structure

```
bmad-zmart/
├── Anchor.toml                          # Anchor workspace config
├── Cargo.toml                           # Rust workspace manifest
├── package.json                         # Root scripts
├── .gitignore
├── README.md
│
├── programs/                            # EPIC 1: 6 Solana Programs
│   ├── program-registry/                # Story 1.2
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs                   # Program entry, register/lookup
│   │       ├── state.rs                 # ProgramRegistry account
│   │       └── errors.rs                # Custom error codes
│   │
│   ├── parameter-storage/               # Story 1.3
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── instructions/
│   │       │   ├── initialize.rs
│   │       │   ├── update_parameter.rs
│   │       │   └── update_toggle.rs
│   │       ├── state.rs                 # GlobalParameters, GlobalFeatureToggles
│   │       └── errors.rs
│   │
│   ├── core-markets/                    # Story 1.4
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── instructions/
│   │       │   ├── create_market.rs
│   │       │   ├── place_bet.rs
│   │       │   └── claim_payout.rs      # Story 1.10
│   │       ├── state.rs                 # Market, UserBet accounts
│   │       ├── utils.rs                 # Odds calc, fee distribution (BPS)
│   │       └── errors.rs
│   │
│   ├── market-resolution/               # Story 1.6
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── instructions/
│   │       │   ├── submit_vote.rs
│   │       │   ├── post_vote_result.rs  # Epic 2, Story 2.3
│   │       │   ├── finalize_resolution.rs
│   │       │   └── admin_override.rs    # Epic 2, Story 2.7
│   │       ├── state.rs                 # VoteRecord, VoteResult, MarketStatus enum
│   │       └── errors.rs
│   │
│   ├── proposal-system/                 # Story 1.7
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── instructions/
│   │       │   ├── create_proposal.rs
│   │       │   ├── vote_on_proposal.rs
│   │       │   ├── approve_proposal.rs  # Epic 2, Story 2.5
│   │       │   └── reject_proposal.rs   # Epic 2, Story 2.5
│   │       ├── state.rs                 # Proposal account, ProposalOutcome
│   │       └── errors.rs
│   │
│   └── bond-manager/                    # Story 1.5
│       └── src/
│           ├── lib.rs
│           ├── instructions/
│           │   ├── deposit_bond.rs
│           │   ├── refund_bond.rs       # Epic 2, Story 2.10
│           │   └── claim_creator_fees.rs # Epic 2, Story 2.11
│           ├── state.rs                 # BondEscrow account
│           └── errors.rs
│
├── tests/                               # EPIC 4: Anchor Tests
│   ├── program-registry.ts              # Story 4.1
│   ├── parameter-storage.ts
│   ├── core-markets.ts
│   ├── market-resolution.ts
│   ├── proposal-system.ts
│   ├── bond-manager.ts
│   └── integration/                     # Story 4.2
│       ├── market-lifecycle.ts
│       ├── governance-flow.ts
│       └── fee-distribution.ts
│
├── supabase/                            # EPIC 1 & 2: Backend
│   ├── config.toml
│   ├── migrations/                      # Story 1.8
│   │   └── 001_initial_schema.sql       # Tables, indexes, RLS policies
│   │
│   └── functions/                       # Edge Functions (Deno)
│       ├── event-listener/              # Story 1.9
│       │   └── index.ts                 # Solana → PostgreSQL sync
│       ├── verify-vote-signature/       # Story 2.1
│       │   └── index.ts                 # Ed25519 verification
│       ├── submit-vote/                 # Story 2.2
│       │   └── index.ts                 # Vote collection + storage
│       ├── aggregate-votes/             # Story 2.3
│       │   └── index.ts                 # Vote tallying + Merkle root
│       ├── finalize-proposal-vote/      # Story 2.5
│       │   └── index.ts                 # Proposal approval/rejection
│       └── check-stale-markets/         # Story 2.9
│           └── index.ts                 # Cron job for auto-cancellation
│
├── frontend/                            # EPIC 3: Next.js App
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   │
│   ├── public/
│   │   ├── favicon.ico
│   │   └── images/
│   │
│   ├── src/
│   │   ├── app/                         # Next.js 15 App Router
│   │   │   ├── layout.tsx               # Root layout + WalletProvider (Story 3.1)
│   │   │   ├── page.tsx                 # Homepage (Story 3.3)
│   │   │   ├── market/[id]/page.tsx     # Market detail (Story 3.4)
│   │   │   ├── dashboard/page.tsx       # User dashboard (Story 3.5)
│   │   │   ├── propose/page.tsx         # Proposal creation (Story 3.6)
│   │   │   ├── vote/page.tsx            # Resolution voting (Story 3.7)
│   │   │   ├── proposals/page.tsx       # Proposal voting (Story 3.8)
│   │   │   ├── leaderboard/page.tsx     # Leaderboards (Story 3.9)
│   │   │   └── admin/page.tsx           # Admin dashboard (Story 3.10)
│   │   │
│   │   ├── components/
│   │   │   ├── wallet/
│   │   │   │   ├── WalletButton.tsx
│   │   │   │   └── WalletProvider.tsx   # Solana wallet adapter config
│   │   │   ├── market/
│   │   │   │   ├── MarketCard.tsx
│   │   │   │   ├── BettingPanel.tsx
│   │   │   │   └── OddsDisplay.tsx      # Real-time odds
│   │   │   ├── voting/
│   │   │   │   ├── VoteButtons.tsx
│   │   │   │   └── VoteTally.tsx
│   │   │   ├── comments/                # Story 3.11
│   │   │   │   ├── CommentList.tsx
│   │   │   │   └── CommentForm.tsx
│   │   │   ├── common/
│   │   │   │   ├── ErrorBoundary.tsx
│   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   └── Toast.tsx            # react-hot-toast wrapper
│   │   │   └── layout/
│   │   │       ├── Header.tsx
│   │   │       ├── Footer.tsx
│   │   │       └── Sidebar.tsx
│   │   │
│   │   ├── hooks/                       # Story 3.2
│   │   │   ├── useMarkets.ts            # Fetch markets from Supabase
│   │   │   ├── useMarketUpdates.ts      # Real-time subscriptions
│   │   │   ├── useBets.ts
│   │   │   ├── useVotes.ts
│   │   │   ├── useProgram.ts            # Anchor program instances
│   │   │   └── useWallet.ts
│   │   │
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts            # Supabase client init
│   │   │   │   └── types.ts             # Database types (generated)
│   │   │   ├── anchor/
│   │   │   │   ├── programs.ts          # IDL imports for all 6 programs
│   │   │   │   └── utils.ts             # Transaction helpers
│   │   │   ├── signature.ts             # Message signing for Snapshot votes
│   │   │   ├── formatting.ts            # Date/number formatting (date-fns)
│   │   │   └── constants.ts             # Program IDs, RPC endpoints
│   │   │
│   │   ├── stores/                      # Zustand
│   │   │   ├── marketStore.ts
│   │   │   └── userStore.ts
│   │   │
│   │   ├── types/
│   │   │   ├── market.ts
│   │   │   ├── bet.ts
│   │   │   ├── vote.ts
│   │   │   └── user.ts
│   │   │
│   │   └── styles/
│   │       └── globals.css              # Tailwind + custom dark mode
│   │
│   └── e2e/                             # Story 4.3: Playwright
│       ├── betting.spec.ts
│       ├── voting.spec.ts
│       └── payout.spec.ts
│
├── scripts/                             # EPIC 4: Deployment
│   ├── deploy-devnet.sh                 # Story 4.7
│   ├── deploy-mainnet.sh
│   ├── initialize-params.ts
│   ├── setup-db.sh
│   └── seed-markets.ts                  # Story 4.12
│
├── docs/
│   ├── PRD.md
│   ├── epics.md
│   ├── architecture.md                  # This document
│   ├── bmm-workflow-status.md
│   └── stories/                         # Generated in Phase 4
│
└── .env.example
```

---

## Epic-to-Architecture Mapping

**Epic 1: Foundation & Infrastructure** (12 stories)
- Programs: All 6 programs in `programs/`
- Database: `supabase/migrations/001_initial_schema.sql`
- Event Sync: `supabase/functions/event-listener/`
- Activity Points: `activity_points` table + triggers

**Epic 2: Governance & Voting** (12 stories)
- Snapshot Voting: `supabase/functions/{verify-vote-signature, submit-vote, aggregate-votes}/`
- Proposal Logic: `programs/proposal-system/` + `supabase/functions/finalize-proposal-vote/`
- Dispute Handling: `programs/market-resolution/` state machine + admin override
- Bond Economics: `programs/bond-manager/` graduated refund logic

**Epic 3: Frontend & UX** (14 stories)
- App Router: `frontend/src/app/` (7 core pages)
- Components: `frontend/src/components/` (by feature)
- Real-time: `frontend/src/hooks/useMarketUpdates.ts` (Supabase subscriptions)
- Wallet: `frontend/src/components/wallet/` (Solana wallet adapter)

**Epic 4: Testing, Hardening & Launch** (12 stories)
- Unit Tests: `tests/` (Anchor), `frontend/**/*.test.tsx` (Vitest)
- Integration: `tests/integration/`
- E2E: `frontend/e2e/` (Playwright)
- Deployment: `scripts/`

---

## Novel Architectural Patterns

### Pattern 1: Cross-Program Registry Pattern

**Purpose:** Enable independent program upgrades without breaking integrations

**Implementation:**
```rust
// ProgramRegistry stores dynamic addresses
pub struct ProgramRegistry {
    pub authority: Pubkey,
    pub programs: HashMap<String, ProgramInfo>,  // "core-markets" → {address, version}
}

// Consumer programs ALWAYS reference registry
pub fn place_bet(ctx: Context<PlaceBet>) -> Result<()> {
    let registry = &ctx.accounts.registry;
    let param_storage_addr = registry.programs.get("parameter-storage")?.address;
    // Use dynamic address for CPI
}
```

**Affects:** Stories 1.2-1.7, all cross-program calls

---

### Pattern 2: Snapshot-Style Gas-Free Voting

**Purpose:** Enable community voting without gas fees

**Implementation:**
```typescript
// 1. Frontend: User signs message (no transaction)
const voteMessage = { market_id, vote_choice, timestamp, nonce };
const signature = await wallet.signMessage(JSON.stringify(voteMessage));

// 2. Edge Function: Verify Ed25519 signature
const valid = nacl.sign.detached.verify(messageBytes, signature, publicKey);

// 3. Store in PostgreSQL (off-chain)
INSERT INTO votes (market_id, voter_wallet, vote_choice, signature, vote_weight);

// 4. Aggregate and post on-chain
const outcome = yesVotes > noVotes ? 'YES' : 'NO';
await program.postVoteResult(marketId, outcome, yesVotes, noVotes, merkleRoot);
```

**Affects:** Stories 2.1-2.8

---

### Pattern 3: Graduated Bond Economics

**Purpose:** Dynamically reward creators based on bond size

**Implementation:**
```rust
// Bond amount determines creator fee tier
fn calculate_creator_fee_tier(bond: u64) -> u16 {
    if bond >= 500 { 200 }      // 2.0% for 500+ ZMart
    else if bond >= 100 { 100 }  // 1.0% for 100-499 ZMart
    else { 50 }                  // 0.5% for <100 ZMart
}

// Refund logic varies by outcome
let refund_percent = match proposal.outcome {
    Approved => 100,   // Full refund
    Rejected => 50,    // 50% penalty
    Cancelled => 100,  // Full refund (not creator's fault)
};
```

**Affects:** Stories 1.4-1.5, 1.7, 2.10-2.11

---

### Pattern 4: 48-Hour Dispute Window State Machine

**Purpose:** Allow resolution validation with time-based constraints

**State Transitions:**
```
Pending → Active → Ended → Voting → DisputeWindow → Resolved
                                ↓
                           Cancelled
```

**Implementation:**
```rust
pub enum MarketStatus {
    Pending, Active, Ended, Voting,
    DisputeWindow,  // 48h timer starts
    Resolved,       // Terminal state
    Cancelled       // Terminal state
}

// Finalize only after 48 hours
require!(
    clock.unix_timestamp - market.dispute_window_start >= 48 * 60 * 60,
    ErrorCode::DisputeWindowNotExpired
);
```

**Affects:** Stories 2.3, 2.6-2.7

---

### Pattern 5: Activity Point Meritocracy

**Purpose:** Reward participation and accuracy over capital

**Implementation:**
```sql
-- Automatically award points via triggers
CREATE TRIGGER bet_points_trigger
AFTER INSERT ON bets
FOR EACH ROW EXECUTE FUNCTION award_bet_points();

-- Vote weight calculation
SELECT total_points FROM activity_points WHERE wallet = $1;
-- If democratic mode: weight = 1
-- If weighted mode: weight = total_points
```

**Affects:** Stories 1.11, 2.2, 2.8, 3.9

---

## Implementation Patterns (Agent Consistency Rules)

### Naming Conventions

**Anchor Programs:**
- Accounts: `PascalCase` (e.g., `ProgramRegistry`)
- Instructions: `snake_case` (e.g., `place_bet`)
- Errors: `PascalCase` (e.g., `InsufficientFunds`)

**Database:**
- Tables: `snake_case` plural (e.g., `markets`, `votes`)
- Columns: `snake_case` (e.g., `user_wallet`, `end_date`)
- Foreign keys: `{table}_id` (e.g., `market_id`)

**Frontend:**
- Components: `PascalCase` (e.g., `MarketCard.tsx`)
- Hooks: `camelCase` with `use` prefix (e.g., `useMarkets.ts`)
- Routes: `kebab-case` (e.g., `/market/[id]`)

**API:**
- Edge Functions: `kebab-case` (e.g., `verify-vote-signature`)

---

### Cross-Cutting Concerns

**Error Handling:**
```rust
// Anchor: Custom error enum
#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient funds")]
    InsufficientFunds,
}
```

```typescript
// Edge Functions: Standard error format
{ error: { code: "INVALID_SIGNATURE", message: "...", details?: any }}
```

```typescript
// Frontend: Toast notifications
toast.error("Transaction failed: Insufficient funds");
```

**Date/Time Handling:**
- On-chain: Unix timestamps (i64)
- Database: `TIMESTAMPTZ` (UTC)
- Frontend: ISO 8601 strings, displayed in user's local timezone via `date-fns`

**Authentication:**
- Wallet public key = user identity
- Sign messages for off-chain actions
- Transactions for on-chain actions
- No email/password

---

## Security Architecture

**Smart Contract Security:**
- Input validation on all instructions
- Admin-only access controls (authority checks)
- PDA derivation for account security
- Reentrancy protection via Anchor

**Backend Security:**
- Ed25519 signature verification (Snapshot votes)
- PostgreSQL RLS (Row-Level Security)
- Parameterized queries (SQL injection prevention)
- Rate limiting on Edge Functions

**Frontend Security:**
- Next.js automatic XSS escaping
- Wallet adapter security best practices
- HTTPS-only in production
- Environment variable protection

---

## Performance Considerations

**Database Optimization:**
```sql
-- Story 1.8: Comprehensive indexes
CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_markets_end_date ON markets(end_date);
CREATE INDEX idx_bets_market ON bets(market_id);
CREATE INDEX idx_bets_user ON bets(user_wallet);
CREATE INDEX idx_votes_market ON votes(market_id);

-- Full-text search
CREATE INDEX idx_markets_search ON markets USING GIN(to_tsvector('english', title || ' ' || description));
```

**Frontend Optimization:**
- Next.js 15 Turbopack builds (beta)
- Code splitting via dynamic imports
- Image optimization via Next.js Image
- Real-time subscriptions (avoid polling)

**Blockchain Optimization:**
- Batch transactions where possible
- Pull-based payouts (avoid automatic push)
- Registry pattern (reduce program size)

**Targets:**
- Database queries: <100ms (95th percentile)
- Frontend page load: <3s on 3G
- Transaction success rate: >99%

---

## Deployment Architecture

**Blockchain Deployment:**
```
localnet (dev) → devnet (staging) → mainnet-beta (production)
```

**Frontend Deployment:**
- Vercel (automatic deploys on push to main)
- Environment variables per environment
- Preview deployments for PRs

**Database Deployment:**
- Supabase cloud (managed PostgreSQL)
- Automatic backups (daily)
- Migration-based schema evolution

**Monitoring:**
- Sentry: Frontend + Edge Function errors
- Supabase Logs: Database + Edge Function logs
- On-chain Events: Audit trail for all critical operations

---

## Development Environment Setup

**Prerequisites:**
- Node.js 18+ and npm
- Rust 1.85.0
- Solana CLI 2.1.15
- Anchor CLI 0.32.1 (via AVM)
- Supabase CLI
- Git

**Initial Setup:**
1. Clone repository
2. Run project initialization commands (see "Project Initialization" section)
3. Configure environment variables (`.env.local`)
4. Run `supabase start` (local instance)
5. Run `anchor localnet` (local validator)
6. Deploy programs: `anchor deploy`
7. Run database migrations: `supabase db push`
8. Start frontend: `cd frontend && npm run dev`

**Environment Variables:**
```env
# Anchor
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
ANCHOR_WALLET=~/.config/solana/id.json

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Solana
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_NETWORK=devnet

# Program IDs (update after deployment)
NEXT_PUBLIC_PROGRAM_REGISTRY_ID=...
NEXT_PUBLIC_PARAMETER_STORAGE_ID=...
NEXT_PUBLIC_CORE_MARKETS_ID=...
NEXT_PUBLIC_MARKET_RESOLUTION_ID=...
NEXT_PUBLIC_PROPOSAL_SYSTEM_ID=...
NEXT_PUBLIC_BOND_MANAGER_ID=...
```

---

## Testing Strategy

**Coverage Targets:**
- Anchor programs: >90% (security critical)
- Frontend components: >80%
- Edge Functions: >85%
- E2E: All critical user journeys

**Test Structure:**
```
tests/                      # Anchor program tests
frontend/**/*.test.tsx      # Vitest unit tests (co-located)
frontend/e2e/*.spec.ts      # Playwright E2E tests
```

**Key Test Scenarios:**
- Full market lifecycle (bet → vote → payout)
- Governance flow (propose → vote → approve)
- Fee distribution (all BPS calculations)
- Signature verification (Snapshot voting)
- State machine transitions (dispute window)

---

## Architecture Decision Records (ADRs)

**ADR-001: Hybrid Starter Approach**
- **Decision**: Use `anchor init` + `create-next-app` separately
- **Rationale**: Full-stack starters don't support 6-program architecture
- **Alternatives Considered**: create-solana-dapp, manual setup
- **Date**: 2025-10-24

**ADR-002: Supabase Over Custom Backend**
- **Decision**: Use Supabase for database + Edge Functions + real-time
- **Rationale**: Reduces infrastructure burden, managed PostgreSQL, built-in real-time
- **Alternatives Considered**: Express + PostgreSQL, AWS Lambda + RDS
- **Date**: 2025-10-24

**ADR-003: Snapshot-Style Voting Pattern**
- **Decision**: Off-chain signatures + on-chain result posting
- **Rationale**: Eliminates gas fees for governance (key differentiator)
- **Alternatives Considered**: On-chain voting with SPL tokens
- **Date**: 2025-10-24

**ADR-004: Registry Pattern for Program Upgrades**
- **Decision**: Central ProgramRegistry for dynamic address lookup
- **Rationale**: Enables independent program upgrades without breaking integrations
- **Alternatives Considered**: Hardcoded addresses, anchor upgrade mechanism
- **Date**: 2025-10-24

**ADR-005: Activity Points Off-Chain**
- **Decision**: Track activity points in PostgreSQL, not on-chain tokens
- **Rationale**: Flexibility, no token economics complexity in MVP
- **Alternatives Considered**: SPL token for activity points
- **Date**: 2025-10-24

---

## Consistency Contract for AI Agents

**All AI agents implementing stories MUST:**

1. ✅ Use registry lookup for cross-program calls (never hardcode)
2. ✅ Follow naming conventions (accounts, instructions, tables, components)
3. ✅ Use standard error format (Anchor, Edge Functions, Frontend)
4. ✅ Store dates as Unix timestamps on-chain, timestamptz in database
5. ✅ Implement pull-based payouts (never automatic push)
6. ✅ Use BPS (basis points) for all fee calculations (10000 = 100%)
7. ✅ Validate signatures for off-chain votes (Ed25519)
8. ✅ Implement comprehensive tests (>80% coverage)
9. ✅ Follow state machine transitions (MarketStatus enum)
10. ✅ Use dark mode first, conspiracy theory aesthetic (per UX vision)

**Failure to follow these patterns will result in integration failures.**

---

## Next Steps

**Phase 3 (Solutioning) Remaining:**
- ✅ Architecture Document Complete
- ⏳ UX Spec (Optional, recommended for Level 3)
- ⏳ Solutioning Gate Check

**Phase 4 (Implementation):**
- Story 1.1: Initialize workspace (use commands from "Project Initialization")
- Story 1.2: Implement ProgramRegistry
- ... (49 more stories sequentially)

**Architecture Document Status:** ✅ COMPLETE AND VALIDATED

---

**Document Version:** 1.0
**Last Updated:** 2025-10-24
**Next Review:** After Story 1.12 (Epic 1 complete)
