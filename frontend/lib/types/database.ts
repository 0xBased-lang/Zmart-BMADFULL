// Database types for BMAD-Zmart

export interface Market {
  id: string
  market_id: number // Program market ID (numeric)
  program_market_id?: string // Alternative field name
  question: string
  description?: string | null
  category?: string | null
  creator_wallet: string | null
  end_time: string
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

export interface Proposal {
  id: string
  proposal_id: number
  proposer_wallet: string
  proposal_type: 'create_market' | 'resolve_market' | 'parameter_change'
  title: string
  description: string
  market_question?: string | null
  market_description?: string | null
  market_category?: string | null
  market_end_time?: string | null
  target_market_id?: number | null
  proposed_outcome?: 'yes' | 'no' | null
  parameter_name?: string | null
  new_value?: string | null
  status: 'pending' | 'active' | 'passed' | 'failed' | 'executed' | 'cancelled'
  voting_ends_at: string
  created_at: string
  updated_at: string
}