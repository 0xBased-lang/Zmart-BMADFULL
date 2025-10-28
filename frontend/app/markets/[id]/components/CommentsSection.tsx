'use client'

import { useComments } from '@/lib/hooks/useComments'
import { CommentCard } from './CommentCard'
import { CommentForm } from './CommentForm'

interface CommentsSectionProps {
  marketId: string | number
}

export function CommentsSection({ marketId }: CommentsSectionProps) {
  const { comments, loading, error, refetch } = useComments(marketId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Discussion</h2>
        <CommentForm marketId={marketId} onSuccess={refetch} />
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="text-center py-8 text-gray-400">
            Loading comments...
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-400">
            Error loading comments: {error.message}
          </div>
        )}

        {!loading && !error && comments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No comments yet</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
        )}

        {!loading && !error && comments.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-gray-400">
                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </p>
            </div>

            {comments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
