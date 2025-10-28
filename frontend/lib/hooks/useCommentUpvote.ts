'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'

interface UseCommentUpvoteReturn {
  toggleUpvote: (commentId: string) => Promise<void>
  loading: boolean
}

export function useCommentUpvote(): UseCommentUpvoteReturn {
  const { publicKey, signMessage } = useWallet()
  const [loading, setLoading] = useState(false)

  const toggleUpvote = async (commentId: string) => {
    try {
      setLoading(true)

      if (!publicKey || !signMessage) {
        throw new Error('Wallet not connected')
      }

      const message = JSON.stringify({ commentId, timestamp: Date.now() })
      const encodedMessage = new TextEncoder().encode(message)
      const signature = await signMessage(encodedMessage)

      const response = await fetch('/api/upvote-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          signature: Buffer.from(signature).toString('base64'),
          walletAddress: publicKey.toString(),
        }),
      })

      if (!response.ok) throw new Error('Failed to toggle upvote')

      const data = await response.json()
      toast.success(data.upvoted ? 'Upvoted!' : 'Upvote removed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upvote')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { toggleUpvote, loading }
}
