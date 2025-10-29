// Database types for BMAD-Zmart

export interface Market {
  id: string
  market_id: number // Program market ID (numeric)
  program_market_id?: string // Alternative field name
  question: string
  description?: string | null
  category?: string | null
  creator_wallet: string | null
  end_date: string // Changed from end_time to match database column
  end_time?: string // Legacy alias for backwards compatibility
  resolution_time?: string | null
  status: 'active' | 'locked' | 'resolved' | 'cancelled'
  winning_outcome?: 'yes' | 'no' | null
  resolved_outcome?: 'yes' | 'no' | null
  yes_pool?: number | null
  no_pool?: number | null
  total_volume?: number | null
  total_bets?: number | null
  unique_bettors?: number | null
  bond_amount?: number | null
  resolution_criteria?: string | null
  created_at: string
  updated_at: string
}

export interface UserBet {
  id: string
  market_id: number
  user_wallet: string
  outcome: 'YES' | 'NO'
  amount: number
  shares: number
  claimed: boolean
  created_at: string
  updated_at: string
}

// Comment on market for discussion and evidence sharing
export interface Comment {
  id: string
  market_id: number
  commenter_wallet: string
  comment_text: string
  upvotes: number
  flagged: boolean
  created_at: string
  updated_at: string
}

// Comment upvote tracking (one upvote per user per comment)
export interface CommentUpvote {
  id: string
  comment_id: string
  voter_wallet: string
  created_at: string
}

// Comment flag for moderation
export interface CommentFlag {
  id: string
  comment_id: string
  flagger_wallet: string
  reason: string | null
  created_at: string
}

// Legacy alias (deprecated - use Comment instead)
export interface MarketComment extends Comment {}

export interface Vote {
  id: string
  proposal_id: number
  voter_wallet: string
  vote_power: number
  vote_side: 'for' | 'against'
  created_at: string
}

// Proposal interface matching ACTUAL database schema (001_initial_schema.sql)
export interface Proposal {
  id: number
  proposal_id: number
  creator_wallet: string

  // Proposal details
  title: string
  description: string
  bond_amount: number         // in lamports
  bond_tier: 'TIER1' | 'TIER2' | 'TIER3'
  proposal_tax: number        // 1% non-refundable

  // Voting
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  yes_votes: number
  no_votes: number
  total_voters: number

  // Timestamps
  created_at: string
  end_date: string
  processed_at?: string | null

  // Market creation
  market_id?: number | null

  // On-chain reference
  on_chain_address?: string | null
}