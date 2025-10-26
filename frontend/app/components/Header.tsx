'use client'

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export function Header() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">BMAD-Zmart</h1>
          </div>
          <WalletMultiButton />
        </div>
      </div>
    </header>
  )
}
