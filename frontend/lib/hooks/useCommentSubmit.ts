'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'

interface UseCommentSubmitReturn {
  submitComment: (marketId: string | number, text: string) => Promise<void>
  loading: boolean
  error: Error | null
}

/**
 * Hook to submit comments with wallet signature authentication
 *
 * @returns Submit function, loading state, error state
 */
export function useCommentSubmit(): UseCommentSubmitReturn {
  const { publicKey, signMessage } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const submitComment = async (marketId: string | number, text: string) => {
    try {
      setLoading(true)
      setError(null)

      if (!publicKey || !signMessage) {
        throw new Error('Wallet not connected')
      }

      // Create message to sign
      const message = JSON.stringify({
        marketId,
        text,
        timestamp: Date.now(),
      })

      // Sign message with wallet
      const encodedMessage = new TextEncoder().encode(message)
      const signature = await signMessage(encodedMessage)

      // Submit comment to API
      const response = await fetch('/api/submit-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketId,
          commentText: text,
          signature: Buffer.from(signature).toString('base64'),
          walletAddress: publicKey.toString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit comment')
      }

      toast.success('Comment posted!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit comment'
      setError(err instanceof Error ? err : new Error(errorMessage))
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { submitComment, loading, error }
}
