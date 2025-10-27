# BMAD-Zmart Frontend

Next.js 16 frontend for BMAD-Zmart prediction markets platform.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Setup

### Local Supabase

```bash
# From project root
supabase start

# Copy URL and anon key from output to frontend/.env.local
```

### Cloud Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Settings → API
3. Copy Project URL and anon key to `.env.local`

## Features

- ✅ Solana wallet integration (Phantom, Solflare)
- ✅ Real-time market updates via Supabase
- ✅ Responsive dark mode UI
- ✅ TypeScript for type safety

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Blockchain:** Solana Web3.js + Wallet Adapter
- **Database:** Supabase (PostgreSQL + Real-time)

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Homepage
│   └── components/
│       ├── WalletProvider.tsx   # Solana wallet context
│       ├── Header.tsx           # Header with wallet button
│       └── MarketList.tsx       # Market display component
├── lib/
│   ├── supabase.ts        # Supabase client singleton
│   └── hooks/
│       ├── useMarkets.ts         # Query hooks for markets
│       └── useMarketUpdates.ts   # Real-time subscription hooks
└── .env.local.example     # Environment template
```

## Available Hooks

### Data Fetching

```typescript
import { useMarkets, useMarket } from '@/lib/hooks/useMarkets'

// Fetch all active markets
const { markets, loading, error, refetch } = useMarkets()

// Fetch single market
const { market, loading, error } = useMarket(marketId)
```

### Real-Time Updates

```typescript
import {
  useMarketUpdates,
  useLiveOdds,
  useVoteCounts,
} from '@/lib/hooks/useMarketUpdates'

// Subscribe to all market changes
const { markets, loading, error } = useMarketUpdates()

// Subscribe to specific market odds
const { market, loading, error } = useLiveOdds(marketId)

// Subscribe to vote counts
const { voteCount, loading } = useVoteCounts(marketId)
```

## Development

```bash
# Development server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

Deploy to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

## Notes

- Wallet adapter uses devnet by default
- Real-time subscriptions require Supabase real-time enabled
- Database schema must match types in `lib/supabase.ts`

---

**Part of BMAD-Zmart** | Story 3.2 Complete
