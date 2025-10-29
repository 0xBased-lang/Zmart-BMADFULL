import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ProposalVoteTally {
  yesVotes: number
  noVotes: number
  totalVoters: number
  loading: boolean
  error: string | null
}

export function useProposalVoteTally(proposalId: string): ProposalVoteTally {
  const [yesVotes, setYesVotes] = useState(0)
  const [noVotes, setNoVotes] = useState(0)
  const [totalVoters, setTotalVoters] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!proposalId) {
      setLoading(false)
      return
    }

    async function fetchProposalVoteTally() {
      try {
        setLoading(true)
        setError(null)

        // Query all votes for this proposal
        const { data, error: fetchError } = await supabase
          .from('proposal_votes')
          .select('vote_choice')
          .eq('proposal_id', proposalId)

        if (fetchError) {
          throw fetchError
        }

        // Calculate tallies (democratic voting: 1 wallet = 1 vote)
        let yes = 0
        let no = 0

        if (data) {
          data.forEach((vote) => {
            if (vote.vote_choice === 'YES' || vote.vote_choice === 'yes') {
              yes += 1
            } else if (vote.vote_choice === 'NO' || vote.vote_choice === 'no') {
              no += 1
            }
          })
          // Each vote record represents a unique voter
          setTotalVoters(data.length)
        }

        setYesVotes(yes)
        setNoVotes(no)
      } catch (err) {
        console.error('Error fetching proposal vote tally:', err)
        setError(err instanceof Error ? err.message : 'Failed to load vote tally')
      } finally {
        setLoading(false)
      }
    }

    fetchProposalVoteTally()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`proposal-votes:${proposalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'proposal_votes',
          filter: `proposal_id=eq.${proposalId}`,
        },
        (payload) => {
          // Refetch tally when votes change
          fetchProposalVoteTally()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [proposalId])

  return { yesVotes, noVotes, totalVoters, loading, error }
}
