// Dashboard types for BMAD-Zmart

// Active bet with current market data
export interface UserBet {
  id: string
  market_id: number
  market_title: string
  user_wallet: string
  outcome: 'YES' | 'NO'
  amount: number // SOL amount bet
  shares: number // Number of shares received
  current_odds: number // Current odds percentage (0-100)
  current_value: number // Current value of position
  unrealized_pnl: number // Unrealized P&L
  pnl_percentage: number // P&L as percentage
  created_at: string // When bet was placed
  end_date: string // When market ends
  status: 'ACTIVE' // Market status
}

// Bet on market pending resolution
export interface PendingBet {
  id: string
  market_id: number
  market_title: string
  user_wallet: string
  outcome: 'YES' | 'NO'
  amount: number
  shares: number
  potential_payout: number
  created_at: string
  end_date: string
  status: 'PENDING_RESOLUTION'
}

// Claimable payout from won bet
export interface ClaimablePayout {
  market_id: number
  market_title: string
  amount: number // Claimable amount in SOL
  winning_outcome: 'YES' | 'NO' | null
  resolved_at: string
}

// Historical bet record
export interface BetHistoryItem {
  id: string
  market_id: number
  market_title: string
  user_wallet: string
  outcome: 'WIN' | 'LOSS' | 'PENDING' | 'CANCELLED'
  bet_outcome: 'YES' | 'NO'
  amount: number // Original bet amount
  payout: number // Actual payout (0 if lost)
  pnl: number // Profit/Loss
  roi_percentage: number // ROI percentage
  created_at: string
  resolved_at: string
  winning_outcome: 'YES' | 'NO' | null
  claimed: boolean
}

// Portfolio metrics
export interface PortfolioMetrics {
  // Investment metrics
  totalInvested: number // Total SOL in active bets
  currentValue: number // Current value of all positions
  unrealizedPnL: number // Unrealized profit/loss
  realizedPnL: number // Realized profit/loss from history
  totalPnL: number // Total P&L (realized + unrealized)
  claimableAmount: number // Total claimable from won bets

  // Performance metrics
  roiPercentage: number // Overall ROI percentage
  winRate: number // Win rate percentage
  activeBetsCount: number // Number of active bets
  pendingResolutions: number // Number of bets pending resolution

  // Lifetime metrics
  totalWagered: number // Total amount ever wagered
  totalReturns: number // Total returns from all bets
  avgPositionSize: number // Average bet size

  // Best/worst
  bestPerformingBet: string // Title of best performing active bet
  worstPerformingBet: string // Title of worst performing active bet
  profitFactor: number // Total wins / total losses

  // Additional compatibility fields
  totalValue: number // currentValue + claimableAmount
  activeBetsValue: number // Same as totalInvested
  claimableValue: number // Same as claimableAmount
  unrealizedPnLPercent: number // Unrealized P&L as percentage
}
