'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Comment } from '@/lib/types/database'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface UseCommentsReturn {
  comments: Comment[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch and subscribe to real-time comment updates for a market
 *
 * @param marketId - Market ID to fetch comments for
 * @returns Comments with real-time updates, loading state, error state, refetch function
 */
export function useComments(marketId: string | number): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .eq('market_id', parseInt(marketId.toString()))
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setComments(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch comments'))
    } finally {
      setLoading(false)
    }
  }, [marketId])

  useEffect(() => {
    fetchComments()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`comments:market_id=eq.${marketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `market_id=eq.${parseInt(marketId.toString())}`,
        },
        (payload: RealtimePostgresChangesPayload<Comment>) => {
          if (payload.eventType === 'INSERT') {
            setComments((prev) => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setComments((prev) =>
              prev.map((c) => (c.id === payload.new.id ? payload.new : c))
            )
          } else if (payload.eventType === 'DELETE') {
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [marketId, fetchComments])

  return { comments, loading, error, refetch: fetchComments }
}
