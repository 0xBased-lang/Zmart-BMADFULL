/**
 * Wallet utilities for Solana transactions
 */

import type { Transaction } from '@solana/web3.js'

export interface WalletAdapter {
  publicKey: any
  signTransaction?: (transaction: Transaction) => Promise<Transaction>
  signAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>
}

/**
 * Get the connected wallet from window object
 * Works with Phantom, Solflare, and other wallet adapters
 */
export function getWallet(): WalletAdapter | null {
  if (typeof window === 'undefined') {
    return null
  }

  // Check for Phantom
  if (window.solana?.isPhantom) {
    return window.solana as WalletAdapter
  }

  // Check for Solflare
  if (window.solflare?.isSolflare) {
    return window.solflare as WalletAdapter
  }

  // Check for generic Solana provider
  if (window.solana) {
    return window.solana as WalletAdapter
  }

  return null
}

// Extend Window type
declare global {
  interface Window {
    solana?: any
    solflare?: any
  }
}
