import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface VoteTally {
  yesVotes: number
  noVotes: number
  totalVoters: number
  loading: boolean
  error: string | null
}

export function useVoteTally(marketId: string): VoteTally {
  const [yesVotes, setYesVotes] = useState(0)
  const [noVotes, setNoVotes] = useState(0)
  const [totalVoters, setTotalVoters] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!marketId) {
      setLoading(false)
      return
    }

    async function fetchVoteTally() {
      try {
        setLoading(true)
        setError(null)

        // Query all votes for this market
        const { data, error: fetchError } = await supabase
          .from('resolution_votes')
          .select('vote, weight')
          .eq('market_id', marketId)

        if (fetchError) {
          throw fetchError
        }

        // Calculate tallies
        let yes = 0
        let no = 0
        const voterSet = new Set<string>()

        if (data) {
          data.forEach((vote) => {
            const weight = vote.weight || 1
            if (vote.vote === 'yes') {
              yes += weight
            } else if (vote.vote === 'no') {
              no += weight
            }
          })
          // Assume each vote record represents a unique voter
          setTotalVoters(data.length)
        }

        setYesVotes(yes)
        setNoVotes(no)
      } catch (err) {
        console.error('Error fetching vote tally:', err)
        setError(err instanceof Error ? err.message : 'Failed to load vote tally')
      } finally {
        setLoading(false)
      }
    }

    fetchVoteTally()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`votes:${marketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resolution_votes',
          filter: `market_id=eq.${marketId}`,
        },
        (payload) => {
          // Refetch tally when votes change
          fetchVoteTally()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [marketId])

  return { yesVotes, noVotes, totalVoters, loading, error }
}
