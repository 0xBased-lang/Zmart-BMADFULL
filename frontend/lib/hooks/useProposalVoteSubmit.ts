import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'

interface ProposalVoteSubmission {
  proposal_id: string
  vote_choice: 'YES' | 'NO'
  timestamp: number
  nonce: number
}

interface UseProposalVoteSubmitResult {
  submitVote: (proposalId: string, voteChoice: 'YES' | 'NO') => Promise<boolean>
  isSubmitting: boolean
  userVote: string | null
}

export function useProposalVoteSubmit(): UseProposalVoteSubmitResult {
  const { publicKey, signMessage } = useWallet()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userVote, setUserVote] = useState<string | null>(null)

  async function submitVote(proposalId: string, voteChoice: 'YES' | 'NO'): Promise<boolean> {
    if (!publicKey || !signMessage) {
      toast.error('Please connect your wallet first')
      return false
    }

    try {
      setIsSubmitting(true)

      // Create vote message (Snapshot-style)
      const voteMessage: ProposalVoteSubmission = {
        proposal_id: proposalId,
        vote_choice: voteChoice,
        timestamp: Date.now(),
        nonce: Math.floor(Math.random() * 1000000),
      }

      // Convert message to bytes for signing
      const message = new TextEncoder().encode(JSON.stringify(voteMessage))

      // Sign the message with wallet (NOT a transaction - gas-free!)
      let signature: Uint8Array
      try {
        signature = await signMessage(message)
      } catch (signError) {
        if (signError instanceof Error) {
          if (signError.message.includes('User rejected')) {
            toast.error('Signature request was rejected')
          } else {
            toast.error(`Signing failed: ${signError.message}`)
          }
        } else {
          toast.error('Failed to sign vote message')
        }
        return false
      }

      // Convert signature to base64 for transmission
      const signatureBase64 = Buffer.from(signature).toString('base64')

      // Submit to backend API
      const response = await fetch('/api/submit-proposal-vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: voteMessage,
          signature: signatureBase64,
          voter_wallet: publicKey.toString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Vote submission failed')
      }

      const result = await response.json()

      // Update local state
      setUserVote(voteChoice)

      // Show success message
      toast.success(`Vote submitted: ${voteChoice}`, {
        icon: voteChoice === 'YES' ? '✅' : '❌',
        duration: 4000,
      })

      return true
    } catch (error) {
      console.error('Proposal vote submission error:', error)

      if (error instanceof Error) {
        // Handle duplicate vote error
        if (error.message.includes('already voted') || error.message.includes('duplicate')) {
          toast.error('You have already voted on this proposal')
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error('Failed to submit vote. Please try again.')
      }

      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    submitVote,
    isSubmitting,
    userVote,
  }
}
