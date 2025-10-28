'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useCommentSubmit } from '@/lib/hooks/useCommentSubmit'

interface CommentFormProps {
  marketId: string | number
  onSuccess?: () => void
}

const MAX_LENGTH = 2000

export function CommentForm({ marketId, onSuccess }: CommentFormProps) {
  const { publicKey } = useWallet()
  const { submitComment, loading } = useCommentSubmit()
  const [text, setText] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!text.trim()) return

    try {
      await submitComment(marketId, text.trim())
      setText('')
      onSuccess?.()
    } catch (err) {
      // Error handled in hook
    }
  }

  if (!publicKey) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-400 mb-4">Connect your wallet to comment</p>
        {/* Wallet connection button would go here */}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
        placeholder="Share your thoughts or evidence..."
        className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        rows={3}
        maxLength={MAX_LENGTH}
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-gray-500">
          {text.length}/{MAX_LENGTH}
        </span>
        <button
          type="submit"
          disabled={loading || !text.trim() || text.length > MAX_LENGTH}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md transition-colors font-medium"
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  )
}
