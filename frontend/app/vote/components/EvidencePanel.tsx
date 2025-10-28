'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MarketComment } from '@/lib/types/database'
import { formatDistanceToNow } from 'date-fns'

interface EvidencePanelProps {
  marketId: string
}

type SortOption = 'newest' | 'oldest' | 'mostHelpful'

export function EvidencePanel({ marketId }: EvidencePanelProps) {
  const [comments, setComments] = useState<MarketComment[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [evidenceLinks, setEvidenceLinks] = useState<string[]>([])

  useEffect(() => {
    async function fetchEvidence() {
      try {
        setLoading(true)

        // Fetch comments for this market
        const { data: commentsData, error: commentsError } = await supabase
          .from('market_comments')
          .select('*')
          .eq('market_id', marketId)
          .eq('flagged', false) // Only show non-flagged comments
          .order('created_at', { ascending: sortBy === 'oldest' })

        if (commentsError) {
          console.error('Error fetching comments:', commentsError)
        } else {
          let sortedComments = commentsData || []

          // Apply sorting
          if (sortBy === 'mostHelpful') {
            sortedComments = [...sortedComments].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
          }

          setComments(sortedComments)
        }

        // Fetch market details for evidence links (if any)
        const { data: marketData, error: marketError } = await supabase
          .from('markets')
          .select('resolution_criteria')
          .eq('id', marketId)
          .single()

        if (!marketError && marketData?.resolution_criteria) {
          // Extract URLs from resolution criteria (simple regex)
          const urlRegex = /(https?:\/\/[^\s]+)/g
          const urls = marketData.resolution_criteria.match(urlRegex) || []
          setEvidenceLinks(urls)
        }
      } catch (err) {
        console.error('Error in fetchEvidence:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEvidence()
  }, [marketId, sortBy])

  return (
    <div className="mb-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg animate-slideDown">
      {/* Header with sorting */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-white">Evidence & Comments</h4>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="text-xs bg-gray-700 text-gray-300 rounded px-2 py-1 border border-gray-600"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="mostHelpful">Most Helpful</option>
        </select>
      </div>

      {/* Evidence Links */}
      {evidenceLinks.length > 0 && (
        <div className="mb-4">
          <h5 className="text-xs font-semibold text-gray-400 mb-2">Evidence Links</h5>
          <div className="space-y-2">
            {evidenceLinks.map((link, index) => (
              <a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-green-400 hover:text-green-300 underline break-all"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div>
        <h5 className="text-xs font-semibold text-gray-400 mb-2">Community Comments</h5>
        {loading ? (
          <div className="text-center text-gray-500 py-4 text-sm">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center text-gray-500 py-4 text-sm">
            No comments yet. Be the first to add evidence!
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-900/50 rounded p-3 border border-gray-700">
                <p className="text-sm text-gray-300 mb-2">{comment.comment_text}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="truncate">
                    {comment.commenter_wallet.slice(0, 6)}...{comment.commenter_wallet.slice(-4)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                      {comment.upvotes || 0}
                    </span>
                    <span>
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
