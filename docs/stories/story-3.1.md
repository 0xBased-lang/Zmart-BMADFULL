# Story 3.1: Initialize Next.js Application with Solana Wallet Adapter

Status: Ready

## Story

As a frontend developer,
I want a Next.js 15 application with Solana wallet integration,
So that users can connect their wallets and interact with the blockchain.

## Acceptance Criteria

1. **AC-3.1.1**: Next.js 15 app created with TypeScript and App Router
2. **AC-3.1.2**: Tailwind CSS configured with dark mode support
3. **AC-3.1.3**: @solana/wallet-adapter-react and @solana/wallet-adapter-wallets installed
4. **AC-3.1.4**: WalletProvider component wraps app with support for Phantom, Solflare, and other major wallets
5. **AC-3.1.5**: Wallet connect button implemented in header (shows wallet address when connected)
6. **AC-3.1.6**: RPC endpoint configured for devnet
7. **AC-3.1.7**: Successfully connects to Phantom wallet and displays public key
8. **AC-3.1.8**: Basic layout with header, footer, and main content area

## Tasks / Subtasks

### Task 1: Initialize Next.js 15 Application (AC: #1)
- [ ] 1.1: Create Next.js 15 app with TypeScript using `create-next-app`
- [ ] 1.2: Configure App Router (app directory structure)
- [ ] 1.3: Set up TypeScript configuration (strict mode)
- [ ] 1.4: Create basic page structure (app/page.tsx, app/layout.tsx)
- [ ] 1.5: Verify app runs on localhost:3000

### Task 2: Configure Tailwind CSS (AC: #2)
- [ ] 2.1: Install Tailwind CSS and dependencies
- [ ] 2.2: Configure tailwind.config.js with dark mode support
- [ ] 2.3: Set up globals.css with Tailwind directives
- [ ] 2.4: Configure dark mode color scheme
- [ ] 2.5: Test dark mode toggle functionality

### Task 3: Install Solana Wallet Adapter (AC: #3, #6)
- [ ] 3.1: Install @solana/wallet-adapter-react
- [ ] 3.2: Install @solana/wallet-adapter-react-ui
- [ ] 3.3: Install @solana/wallet-adapter-wallets
- [ ] 3.4: Install @solana/web3.js
- [ ] 3.5: Configure devnet RPC endpoint (https://api.devnet.solana.com)

### Task 4: Implement WalletProvider (AC: #4)
- [ ] 4.1: Create WalletProviderWrapper component
- [ ] 4.2: Configure wallet adapters (Phantom, Solflare, Backpack, etc.)
- [ ] 4.3: Set up ConnectionProvider with devnet endpoint
- [ ] 4.4: Wrap app with WalletProvider in root layout
- [ ] 4.5: Import wallet adapter CSS styles

### Task 5: Create Wallet Connect Button (AC: #5, #7)
- [ ] 5.1: Create Header component with wallet button
- [ ] 5.2: Implement WalletMultiButton from @solana/wallet-adapter-react-ui
- [ ] 5.3: Display wallet address when connected (truncated format)
- [ ] 5.4: Add connect/disconnect functionality
- [ ] 5.5: Test connection with Phantom wallet
- [ ] 5.6: Verify public key displays correctly

### Task 6: Create Basic Layout (AC: #8)
- [ ] 6.1: Create Header component (logo, wallet button, navigation)
- [ ] 6.2: Create Footer component (links, copyright)
- [ ] 6.3: Create main content area with proper spacing
- [ ] 6.4: Implement responsive layout (mobile, tablet, desktop)
- [ ] 6.5: Add basic styling with Tailwind

### Task 7: Testing and Validation
- [ ] 7.1: Test app starts without errors
- [ ] 7.2: Test Phantom wallet connection
- [ ] 7.3: Test wallet disconnect
- [ ] 7.4: Test dark mode toggle
- [ ] 7.5: Test responsive layout on different screen sizes
- [ ] 7.6: Verify TypeScript compilation with no errors

## Dev Notes

### Architecture Patterns

**Next.js 15 App Router Pattern**
- Uses app directory for routing (not pages directory)
- Server Components by default (use 'use client' for client components)
- Layout.tsx for shared UI across routes
- Page.tsx for route-specific content

**Solana Wallet Adapter Pattern**
- ConnectionProvider: Manages Solana RPC connection
- WalletProvider: Manages wallet state and connections
- WalletMultiButton: Pre-built button component with wallet UI
- useWallet hook: Access wallet state in components

**Tailwind Dark Mode Pattern**
- class strategy: Use `dark:` prefix for dark mode styles
- Toggle via `document.documentElement.classList.toggle('dark')`
- Store preference in localStorage
- Respect system preference as default

### Technology Stack

**Framework & Language:**
- Next.js 15 (latest)
- TypeScript 5.x
- React 18+

**Styling:**
- Tailwind CSS 3.x
- CSS Modules (for component-specific styles if needed)
- Dark mode support

**Solana Integration:**
- @solana/wallet-adapter-react ^0.15.x
- @solana/wallet-adapter-react-ui ^0.9.x
- @solana/wallet-adapter-wallets ^0.19.x
- @solana/web3.js ^1.87.x

**Wallets Supported:**
- Phantom (primary)
- Solflare
- Backpack
- Torus
- Ledger
- Slope

### Project Structure

```
bmad-zmart-frontend/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Homepage
│   ├── globals.css         # Global styles + Tailwind
│   └── components/
│       ├── Header.tsx      # Header with wallet button
│       ├── Footer.tsx      # Footer component
│       └── providers/
│           └── WalletProvider.tsx  # Wallet context provider
├── public/
│   └── logo.svg            # BMAD-Zmart logo
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
├── next.config.js          # Next.js configuration
└── package.json            # Dependencies
```

### Configuration Examples

**tailwind.config.ts:**
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
      },
    },
  },
  plugins: [],
}
export default config
```

**WalletProvider Component:**
```typescript
'use client'

import { useMemo } from 'react'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'

require('@solana/wallet-adapter-react-ui/styles.css')

export function WalletProviderWrapper({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
```

### Prerequisites

**Required:**
- Epic 1 & 2 complete (backend ready)
- Node.js 18+ installed
- npm or yarn package manager
- Phantom wallet browser extension (for testing)

**Optional:**
- Solflare wallet for testing additional wallets
- VS Code with TypeScript/React extensions

### Testing Standards

**Manual Testing:**
1. App starts without errors: `npm run dev`
2. Wallet button visible in header
3. Click wallet button → modal opens with wallet options
4. Select Phantom → wallet prompts for connection
5. Approve connection → wallet address displays in header
6. Disconnect → wallet button returns to "Select Wallet" state
7. Dark mode toggle works correctly
8. Layout responsive on mobile/tablet/desktop

**Build Testing:**
```bash
npm run build
npm run start
```
Should build without TypeScript errors and run production build successfully.

### Constraints

1. **Next.js 15 Only**: Use latest Next.js 15 features (App Router, Server Components)
2. **TypeScript Strict Mode**: All code must be type-safe
3. **Devnet Only**: Configure for Solana devnet (not mainnet)
4. **Wallet Adapter Version**: Use latest stable versions (check npm)
5. **Dark Mode Required**: Must support dark mode from day 1
6. **Responsive Design**: Mobile-first approach
7. **No External UI Libraries**: Use Tailwind only (no Material-UI, Chakra, etc.)
8. **Accessibility**: Semantic HTML and ARIA labels where needed

### References

- [Source: docs/epics.md - Story 3.1] - Story definition
- [Next.js 15 Documentation](https://nextjs.org/docs) - Framework guide
- [Solana Wallet Adapter Docs](https://github.com/solana-labs/wallet-adapter) - Wallet integration
- [Tailwind CSS Docs](https://tailwindcss.com/docs) - Styling guide
- [Phantom Wallet Docs](https://docs.phantom.app/) - Wallet testing

## Dev Agent Record

### Context Reference

- Story Context 3.1 - Generated: 2025-10-26

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

### File List
