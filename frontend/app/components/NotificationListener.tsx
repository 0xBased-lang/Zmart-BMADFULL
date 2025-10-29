/**
 * NotificationListener Component
 *
 * Global component that listens for real-time notifications for the connected wallet.
 * Automatically subscribes when wallet is connected and unsubscribes when disconnected.
 *
 * Integrates with useMarketCreationNotifications hook to show toast notifications
 * when a user's proposal is approved and becomes a market.
 */

'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useMarketCreationNotifications } from '@/lib/hooks/useMarketCreationNotifications'

export function NotificationListener() {
  const { publicKey } = useWallet()

  // Subscribe to notifications for connected wallet
  useMarketCreationNotifications(publicKey?.toString())

  // This component doesn't render anything
  return null
}
