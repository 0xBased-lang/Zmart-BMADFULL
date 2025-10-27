'use client'

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Header() {
  const { connected } = useWallet()
  const pathname = usePathname()

  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <h1 className="text-2xl font-bold">BMAD-Zmart</h1>
            </Link>

            {/* Navigation links - only show when wallet connected */}
            {connected && (
              <nav className="flex items-center gap-4">
                <Link
                  href="/"
                  className={`text-sm font-medium transition-colors ${
                    pathname === '/'
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  Markets
                </Link>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium transition-colors ${
                    pathname === '/dashboard'
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  Dashboard
                </Link>
              </nav>
            )}
          </div>
          <WalletMultiButton />
        </div>
      </div>
    </header>
  )
}
