'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'

interface UseFlagCommentReturn {
  flagComment: (commentId: string, reason?: string) => Promise<void>
  loading: boolean
}

/**
 * Hook to flag comments as inappropriate with wallet signature authentication
 *
 * @returns Flag function, loading state
 */
export function useFlagComment(): UseFlagCommentReturn {
  const { publicKey, signMessage } = useWallet()
  const [loading, setLoading] = useState(false)

  const flagComment = async (commentId: string, reason?: string) => {
    try {
      setLoading(true)

      if (!publicKey || !signMessage) {
        throw new Error('Wallet not connected')
      }

      // Create message to sign
      const message = JSON.stringify({
        commentId,
        reason: reason || '',
        timestamp: Date.now(),
      })

      // Sign message with wallet
      const encodedMessage = new TextEncoder().encode(message)
      const signature = await signMessage(encodedMessage)

      // Submit flag to API
      const response = await fetch('/api/flag-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          reason: reason || null,
          signature: Buffer.from(signature).toString('base64'),
          walletAddress: publicKey.toString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to flag comment')
      }

      toast.success('Comment flagged for review')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to flag comment'
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { flagComment, loading }
}
