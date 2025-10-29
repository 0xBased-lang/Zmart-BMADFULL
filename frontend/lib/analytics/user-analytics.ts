import { supabase } from '@/lib/supabase'
/**
 * User Analytics Service
 *
 * Comprehensive analytics and statistics for user betting activity.
 * Calculates performance metrics, portfolio value, and historical data.
 *
 * Following Web3 dApp best practices:
 * - Type-safe data structures
 * - Efficient data fetching with caching
 * - Real-time calculation of metrics
 * - Blockchain data integration
 */



// ============================================================================
// Type Definitions
// ============================================================================

export interface UserBet {
  id: string
  market_id: number
  user_wallet: string
  outcome: 'YES' | 'NO'
  amount: number // in lamports
  shares: number // amount after fees
  claimed: boolean
  created_at: string
  updated_at: string
}

export interface Market {
  market_id: number
  title: string // Database uses 'title' not 'question'
  question?: string // Backwards compatibility alias
  description: string
  category: string
  creator_wallet: string
  end_date: string
  resolution_time: string | null
  status: 'active' | 'locked' | 'resolved' | 'cancelled'
  winning_outcome: 'yes' | 'no' | null
  resolved_outcome: 'yes' | 'no' | null
  yes_pool: number
  no_pool: number
  total_volume: number
  total_bets: number
  created_at: string
}

export interface PortfolioPosition {
  market: Market
  bets: UserBet[]
  totalStaked: number // Total amount bet on this market
  currentValue: number // Current value if resolved/claimable
  potentialWinnings: number // Potential winnings if user wins
  status: 'active' | 'won' | 'lost' | 'claimable' | 'claimed'
}

export interface PerformanceMetrics {
  totalBets: number
  totalWagered: number // Total SOL wagered (in SOL, not lamports)
  totalWon: number // Total SOL won
  totalLost: number // Total SOL lost
  netProfit: number // totalWon - totalWagered
  winRate: number // Percentage of winning bets
  roi: number // Return on investment percentage
  averageBetSize: number // Average bet amount in SOL
  largestWin: number // Largest single win
  largestLoss: number // Largest single loss
  activePositions: number // Number of active bets
  resolvedBets: number // Number of resolved bets
  claimableAmount: number // Total claimable winnings
}

export interface ActivityItem {
  id: string
  type: 'bet_placed' | 'bet_won' | 'bet_lost' | 'payout_claimed' | 'market_created'
  market_id: number
  market_title: string
  amount: number
  outcome?: 'yes' | 'no'
  timestamp: string
  txHash?: string
}

export interface UserAnalytics {
  portfolio: PortfolioPosition[]
  performance: PerformanceMetrics
  recentActivity: ActivityItem[]
  chartData: {
    profitOverTime: Array<{ date: string; profit: number }>
    betsByCategory: Array<{ category: string; count: number; amount: number }>
  }
}

// ============================================================================
// Analytics Functions
// ============================================================================

/**
 * Get complete user analytics
 *
 * Fetches all user data and calculates comprehensive metrics
 */
export async function getUserAnalytics(userWallet: string): Promise<UserAnalytics> {
  console.log('📊 Fetching analytics for:', userWallet)

  try {
    // Fetch user bets with market data
    const { data: betsData, error: betsError } = await supabase
      .from('user_bets')
      .select(`
        *,
        markets (*)
      `)
      .eq('user_wallet', userWallet)
      .order('created_at', { ascending: false })

    if (betsError) throw betsError

    const bets = (betsData || []) as Array<UserBet & { markets: Market }>

    // Calculate portfolio positions
    const portfolio = calculatePortfolio(bets)

    // Calculate performance metrics
    const performance = calculatePerformance(bets, portfolio)

    // Generate recent activity
    const recentActivity = generateActivityTimeline(bets)

    // Generate chart data
    const chartData = generateChartData(bets)

    return {
      portfolio,
      performance,
      recentActivity,
      chartData
    }

  } catch (error) {
    console.error('Failed to fetch user analytics:', error)
    throw error
  }
}

/**
 * Calculate portfolio positions
 *
 * Groups bets by market and calculates current value and potential winnings
 */
function calculatePortfolio(
  bets: Array<UserBet & { markets: Market }>
): PortfolioPosition[] {

  // Group bets by market
  const marketBetsMap = new Map<number, Array<UserBet & { markets: Market }>>()

  bets.forEach(bet => {
    if (!bet.markets) return // Skip bets without market data

    const marketId = bet.markets.market_id
    if (!marketBetsMap.has(marketId)) {
      marketBetsMap.set(marketId, [])
    }
    marketBetsMap.get(marketId)!.push(bet)
  })

  // Calculate position for each market
  const positions: PortfolioPosition[] = []

  marketBetsMap.forEach((marketBets, marketId) => {
    const market = marketBets[0].markets

    // Calculate total staked on this market
    const totalStaked = marketBets.reduce((sum, bet) => sum + bet.amount, 0)

    // Calculate current value and potential winnings
    const { currentValue, potentialWinnings, status } = calculatePositionValue(
      marketBets,
      market
    )

    positions.push({
      market,
      bets: marketBets,
      totalStaked: totalStaked / 1_000_000_000, // Convert to SOL
      currentValue: currentValue / 1_000_000_000,
      potentialWinnings: potentialWinnings / 1_000_000_000,
      status
    })
  })

  // Sort by most recent first
  positions.sort((a, b) =>
    new Date(b.market.created_at).getTime() - new Date(a.market.created_at).getTime()
  )

  return positions
}

/**
 * Calculate position value and status
 */
function calculatePositionValue(
  bets: UserBet[],
  market: Market
): { currentValue: number; potentialWinnings: number; status: PortfolioPosition['status'] } {

  const totalStaked = bets.reduce((sum, bet) => sum + bet.amount, 0)

  // Market not resolved yet - calculate potential winnings
  if (market.status === 'active' || market.status === 'locked') {
    // Group bets by outcome
    const yesBets = bets.filter(b => b.outcome === 'YES')
    const noBets = bets.filter(b => b.outcome === 'NO')

    const yesStake = yesBets.reduce((sum, b) => sum + b.shares, 0)
    const noStake = noBets.reduce((sum, b) => sum + b.shares, 0)

    // Calculate potential winnings for each side
    const yesPotential = calculatePotentialPayout(yesStake, market.yes_pool, market.no_pool)
    const noPotential = calculatePotentialPayout(noStake, market.no_pool, market.yes_pool)

    const maxPotential = Math.max(yesPotential, noPotential)

    return {
      currentValue: totalStaked, // Active positions valued at cost
      potentialWinnings: maxPotential,
      status: 'active'
    }
  }

  // Market resolved - check if user won
  if (market.status === 'resolved' && market.resolved_outcome) {
    const winningBets = bets.filter(
      b => b.outcome.toLowerCase() === market.resolved_outcome!.toLowerCase()
    )
    const losingBets = bets.filter(
      b => b.outcome.toLowerCase() !== market.resolved_outcome!.toLowerCase()
    )

    if (winningBets.length > 0) {
      // User has winning bets
      const winningStake = winningBets.reduce((sum, b) => sum + b.shares, 0)
      const winningPool = market.resolved_outcome === 'yes' ? market.yes_pool : market.no_pool
      const losingPool = market.resolved_outcome === 'yes' ? market.no_pool : market.yes_pool

      const payout = calculatePotentialPayout(winningStake, winningPool, losingPool)

      const allClaimed = winningBets.every(b => b.claimed)

      return {
        currentValue: allClaimed ? 0 : payout,
        potentialWinnings: allClaimed ? 0 : payout,
        status: allClaimed ? 'claimed' : 'claimable'
      }
    } else {
      // User lost
      return {
        currentValue: 0,
        potentialWinnings: 0,
        status: 'lost'
      }
    }
  }

  // Market cancelled
  return {
    currentValue: totalStaked, // Refundable
    potentialWinnings: 0,
    status: 'active'
  }
}

/**
 * Calculate potential payout for a bet
 */
function calculatePotentialPayout(
  userStake: number,
  winningPool: number,
  losingPool: number
): number {
  if (winningPool === 0) return userStake

  const shareOfWinnings = (userStake * losingPool) / winningPool
  return userStake + shareOfWinnings
}

/**
 * Calculate performance metrics
 */
function calculatePerformance(
  bets: Array<UserBet & { markets: Market }>,
  portfolio: PortfolioPosition[]
): PerformanceMetrics {

  const resolvedBets = bets.filter(b =>
    b.markets && b.markets.status === 'resolved'
  )

  const wonBets = resolvedBets.filter(b =>
    b.markets.resolved_outcome &&
    b.outcome.toLowerCase() === b.markets.resolved_outcome.toLowerCase()
  )

  const lostBets = resolvedBets.filter(b =>
    b.markets.resolved_outcome &&
    b.outcome.toLowerCase() !== b.markets.resolved_outcome.toLowerCase()
  )

  // Calculate totals in SOL
  const totalWagered = bets.reduce((sum, b) => sum + b.amount, 0) / 1_000_000_000

  const totalWon = wonBets.reduce((sum, b) => {
    const market = b.markets
    const winningPool = market.resolved_outcome === 'yes' ? market.yes_pool : market.no_pool
    const losingPool = market.resolved_outcome === 'yes' ? market.no_pool : market.yes_pool
    const payout = calculatePotentialPayout(b.shares, winningPool, losingPool)
    return sum + payout
  }, 0) / 1_000_000_000

  const totalLost = lostBets.reduce((sum, b) => sum + b.amount, 0) / 1_000_000_000

  const netProfit = totalWon - (wonBets.reduce((sum, b) => sum + b.amount, 0) / 1_000_000_000) - totalLost

  const winRate = resolvedBets.length > 0
    ? (wonBets.length / resolvedBets.length) * 100
    : 0

  const roi = totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0

  const averageBetSize = bets.length > 0 ? totalWagered / bets.length : 0

  // Find largest win/loss
  const wins = wonBets.map(b => {
    const market = b.markets
    const winningPool = market.resolved_outcome === 'yes' ? market.yes_pool : market.no_pool
    const losingPool = market.resolved_outcome === 'yes' ? market.no_pool : market.yes_pool
    const payout = calculatePotentialPayout(b.shares, winningPool, losingPool)
    return (payout - b.amount) / 1_000_000_000
  })

  const losses = lostBets.map(b => b.amount / 1_000_000_000)

  const largestWin = wins.length > 0 ? Math.max(...wins) : 0
  const largestLoss = losses.length > 0 ? Math.max(...losses) : 0

  const activePositions = portfolio.filter(p => p.status === 'active').length
  const claimableAmount = portfolio
    .filter(p => p.status === 'claimable')
    .reduce((sum, p) => sum + p.potentialWinnings, 0)

  return {
    totalBets: bets.length,
    totalWagered,
    totalWon,
    totalLost,
    netProfit,
    winRate,
    roi,
    averageBetSize,
    largestWin,
    largestLoss,
    activePositions,
    resolvedBets: resolvedBets.length,
    claimableAmount
  }
}

/**
 * Generate activity timeline
 */
function generateActivityTimeline(
  bets: Array<UserBet & { markets: Market }>
): ActivityItem[] {

  const activities: ActivityItem[] = []

  // Add bet placed activities
  bets.forEach(bet => {
    if (!bet.markets) return

    activities.push({
      id: bet.id,
      type: 'bet_placed',
      market_id: bet.markets.market_id,
      market_title: bet.markets.title,
      amount: bet.amount / 1_000_000_000,
      outcome: bet.outcome.toLowerCase() as 'yes' | 'no',
      timestamp: bet.created_at
    })

    // Add win/loss/claim activities for resolved markets
    if (bet.markets.status === 'resolved' && bet.markets.resolved_outcome) {
      const won = bet.outcome.toLowerCase() === bet.markets.resolved_outcome.toLowerCase()

      if (won) {
        if (bet.claimed) {
          const winningPool = bet.markets.resolved_outcome === 'yes' ? bet.markets.yes_pool : bet.markets.no_pool
          const losingPool = bet.markets.resolved_outcome === 'yes' ? bet.markets.no_pool : bet.markets.yes_pool
          const payout = calculatePotentialPayout(bet.shares, winningPool, losingPool)

          activities.push({
            id: `${bet.id}-claimed`,
            type: 'payout_claimed',
            market_id: bet.markets.market_id,
            market_title: bet.markets.title,
            amount: payout / 1_000_000_000,
            timestamp: bet.updated_at
          })
        } else {
          activities.push({
            id: `${bet.id}-won`,
            type: 'bet_won',
            market_id: bet.markets.market_id,
            market_title: bet.markets.title,
            amount: bet.amount / 1_000_000_000,
            outcome: bet.outcome.toLowerCase() as 'yes' | 'no',
            timestamp: bet.markets.resolution_time || bet.markets.end_date
          })
        }
      } else {
        activities.push({
          id: `${bet.id}-lost`,
          type: 'bet_lost',
          market_id: bet.markets.market_id,
          market_title: bet.markets.title,
          amount: bet.amount / 1_000_000_000,
          outcome: bet.outcome.toLowerCase() as 'yes' | 'no',
          timestamp: bet.markets.resolution_time || bet.markets.end_date
        })
      }
    }
  })

  // Sort by most recent first
  activities.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return activities.slice(0, 20) // Return most recent 20 activities
}

/**
 * Generate chart data
 */
function generateChartData(
  bets: Array<UserBet & { markets: Market }>
): UserAnalytics['chartData'] {

  // Profit over time
  const resolvedBets = bets.filter(b =>
    b.markets && b.markets.status === 'resolved'
  ).sort((a, b) =>
    new Date(a.markets.resolution_time || a.markets.end_date).getTime() -
    new Date(b.markets.resolution_time || b.markets.end_date).getTime()
  )

  let cumulativeProfit = 0
  const profitOverTime = resolvedBets.map(bet => {
    const won = bet.markets.resolved_outcome &&
      bet.outcome.toLowerCase() === bet.markets.resolved_outcome.toLowerCase()

    if (won) {
      const winningPool = bet.markets.resolved_outcome === 'yes' ? bet.markets.yes_pool : bet.markets.no_pool
      const losingPool = bet.markets.resolved_outcome === 'yes' ? bet.markets.no_pool : bet.markets.yes_pool
      const payout = calculatePotentialPayout(bet.shares, winningPool, losingPool)
      cumulativeProfit += (payout - bet.amount) / 1_000_000_000
    } else {
      cumulativeProfit -= bet.amount / 1_000_000_000
    }

    return {
      date: bet.markets.resolution_time || bet.markets.end_date,
      profit: cumulativeProfit
    }
  })

  // Bets by category
  const categoryMap = new Map<string, { count: number; amount: number }>()

  bets.forEach(bet => {
    if (!bet.markets) return

    const category = bet.markets.category || 'General'
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { count: 0, amount: 0 })
    }

    const stats = categoryMap.get(category)!
    stats.count += 1
    stats.amount += bet.amount / 1_000_000_000
  })

  const betsByCategory = Array.from(categoryMap.entries()).map(([category, stats]) => ({
    category,
    count: stats.count,
    amount: stats.amount
  }))

  return {
    profitOverTime,
    betsByCategory
  }
}

/**
 * Get user rank/leaderboard position
 */
export async function getUserRank(userWallet: string): Promise<{
  rank: number
  totalUsers: number
  percentile: number
}> {
  try {
    // Get all users' net profit
    const { data: allBets, error } = await supabase
      .from('user_bets')
      .select(`
        user_wallet,
        amount,
        outcome,
        markets (
          resolved_outcome,
          yes_pool,
          no_pool,
          status
        )
      `)

    if (error) throw error

    // Calculate net profit for each user
    const userProfits = new Map<string, number>()

    allBets?.forEach((bet: any) => {
      if (!bet.markets || bet.markets.status !== 'resolved') return

      const wallet = bet.user_wallet
      const won = bet.markets.resolved_outcome &&
        bet.outcome.toLowerCase() === bet.markets.resolved_outcome.toLowerCase()

      if (!userProfits.has(wallet)) {
        userProfits.set(wallet, 0)
      }

      if (won) {
        const winningPool = bet.markets.resolved_outcome === 'yes' ? bet.markets.yes_pool : bet.markets.no_pool
        const losingPool = bet.markets.resolved_outcome === 'yes' ? bet.markets.no_pool : bet.markets.yes_pool
        const payout = calculatePotentialPayout(bet.amount, winningPool, losingPool)
        userProfits.set(wallet, userProfits.get(wallet)! + (payout - bet.amount))
      } else {
        userProfits.set(wallet, userProfits.get(wallet)! - bet.amount)
      }
    })

    // Sort users by profit
    const sortedUsers = Array.from(userProfits.entries())
      .sort((a, b) => b[1] - a[1])

    const rank = sortedUsers.findIndex(([wallet]) => wallet === userWallet) + 1
    const totalUsers = sortedUsers.length
    const percentile = totalUsers > 0 ? ((totalUsers - rank + 1) / totalUsers) * 100 : 0

    return { rank, totalUsers, percentile }

  } catch (error) {
    console.error('Failed to get user rank:', error)
    return { rank: 0, totalUsers: 0, percentile: 0 }
  }
}
