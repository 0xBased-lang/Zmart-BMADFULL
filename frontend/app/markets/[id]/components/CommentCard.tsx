'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { formatDistanceToNow } from 'date-fns'
import { useCommentUpvote } from '@/lib/hooks/useCommentUpvote'
import { useFlagComment } from '@/lib/hooks/useFlagComment'
import toast from 'react-hot-toast'
import type { Comment } from '@/lib/types/database'

interface CommentCardProps {
  comment: Comment
}

export function CommentCard({ comment }: CommentCardProps) {
  const { publicKey } = useWallet()
  const { toggleUpvote, loading: upvoteLoading } = useCommentUpvote()
  const { flagComment, loading: flagLoading } = useFlagComment()
  const [showFlagDialog, setShowFlagDialog] = useState(false)
  const [flagReason, setFlagReason] = useState('')

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`
  }

  const handleUpvote = async () => {
    if (!publicKey) {
      toast.error('Connect wallet to upvote')
      return
    }
    try {
      await toggleUpvote(comment.id)
    } catch (err) {
      // Error handled in hook
    }
  }

  const handleFlag = async () => {
    if (!publicKey) {
      toast.error('Connect wallet to flag comments')
      return
    }

    try {
      await flagComment(comment.id, flagReason.trim() || undefined)
      setShowFlagDialog(false)
      setFlagReason('')
    } catch (err) {
      // Error already handled in hook with toast
    }
  }

  return (
    <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="font-mono">{formatWallet(comment.commenter_wallet)}</span>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
        </div>
        <button
          onClick={() => setShowFlagDialog(true)}
          className="text-gray-500 hover:text-red-400 transition-colors"
          title="Flag inappropriate content"
        >
          ⚑
        </button>
      </div>

      <p className="text-gray-200 mb-3">{comment.comment_text}</p>

      <div className="flex items-center gap-4">
        <button
          onClick={handleUpvote}
          disabled={upvoteLoading || !publicKey}
          className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
            upvoteLoading
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <span>↑</span>
          <span>{comment.upvotes}</span>
        </button>
      </div>

      {showFlagDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Flag Comment</h3>
            <p className="text-gray-400 mb-4">
              Flag this comment as inappropriate?
            </p>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={handleFlag}
                disabled={flagLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50"
              >
                {flagLoading ? 'Flagging...' : 'Flag Comment'}
              </button>
              <button
                onClick={() => setShowFlagDialog(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
