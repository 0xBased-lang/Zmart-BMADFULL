'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useWallet } from '@solana/wallet-adapter-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MobileNav } from './layout/MobileNav'
import { useHydrated } from '@/lib/hooks/useHydrated'

// Dynamically import WalletMultiButton with SSR disabled to prevent hydration errors
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
)

export function Header() {
  const { connected } = useWallet()
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const hydrated = useHydrated()

  return (
    <>
      <header className="border-b border-gray-200 dark:border-gray-800" data-hydrated={hydrated}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <h1 className="text-xl md:text-2xl font-bold">BMAD-Zmart</h1>
              </Link>

              {/* Desktop Navigation - hidden on mobile */}
              <nav className="hidden md:flex items-center gap-4">
                <Link
                  href="/markets"
                  data-testid="nav-markets"
                  className={`text-sm font-medium transition-colors ${
                    pathname === '/markets' || pathname === '/'
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  Markets
                </Link>
                {connected && (
                  <>
                    <Link
                      href="/dashboard"
                      data-testid="nav-dashboard"
                      className={`text-sm font-medium transition-colors ${
                        pathname === '/dashboard'
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/my-bets"
                      data-testid="nav-my-bets"
                      className={`text-sm font-medium transition-colors ${
                        pathname === '/my-bets'
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      My Bets
                    </Link>
                  </>
                )}
                <Link
                  href="/leaderboard"
                  data-testid="nav-leaderboard"
                  className={`text-sm font-medium transition-colors ${
                    pathname === '/leaderboard'
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  Leaderboard
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              {/* Desktop Wallet Button */}
              <div className="hidden md:block">
                <WalletMultiButton />
              </div>

              {/* Mobile Menu Button */}
              <button
                type="button"
                className="md:hidden rounded-md p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                onClick={() => setMobileNavOpen(true)}
              >
                <span className="sr-only">Open menu</span>
                {/* Hamburger Icon */}
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  )
}
