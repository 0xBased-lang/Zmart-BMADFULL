import { useMemo } from 'react'
import type { UserBet, ClaimablePayout, BetHistoryItem, PortfolioMetrics } from '@/lib/types/dashboard'

interface UsePortfolioMetricsProps {
  activeBets: UserBet[]
  claimablePayouts: ClaimablePayout[]
  betHistory: BetHistoryItem[]
}

export function usePortfolioMetrics({
  activeBets,
  claimablePayouts,
  betHistory
}: UsePortfolioMetricsProps): PortfolioMetrics {
  return useMemo(() => {
    // Calculate total invested (all active bets)
    const totalInvested = activeBets.reduce((sum, bet) => sum + bet.amount, 0)

    // Calculate current value (all active bets)
    const currentValue = activeBets.reduce((sum, bet) => sum + (bet.current_value || 0), 0)

    // Calculate unrealized P&L
    const unrealizedPnL = currentValue - totalInvested

    // Calculate claimable amount
    const claimableAmount = claimablePayouts.reduce((sum, payout) => sum + payout.amount, 0)

    // Calculate realized P&L from history (won/lost bets)
    const realizedPnL = betHistory
      .filter(bet => bet.outcome !== 'PENDING' && bet.outcome !== 'CANCELLED')
      .reduce((sum, bet) => sum + (bet.pnl || 0), 0)

    // Calculate total P&L (realized + unrealized)
    const totalPnL = realizedPnL + unrealizedPnL

    // Calculate total wagered (lifetime)
    const totalWagered = betHistory.reduce((sum, bet) => sum + bet.amount, 0) + totalInvested

    // Calculate total returns (lifetime)
    const totalReturns = betHistory
      .filter(bet => bet.outcome === 'WIN' || bet.outcome === 'CANCELLED')
      .reduce((sum, bet) => sum + (bet.payout || 0), 0) + currentValue

    // Calculate ROI percentage
    const roiPercentage = totalWagered > 0 ? (totalPnL / totalWagered) * 100 : 0

    // Calculate win rate
    const totalResolvedBets = betHistory.filter(
      bet => bet.outcome === 'WIN' || bet.outcome === 'LOSS'
    ).length
    const wins = betHistory.filter(bet => bet.outcome === 'WIN').length
    const winRate = totalResolvedBets > 0 ? (wins / totalResolvedBets) * 100 : 0

    // Count active bets
    const activeBetsCount = activeBets.length

    // Count pending resolutions
    const pendingResolutions = betHistory.filter(bet => bet.outcome === 'PENDING').length

    // Calculate average position size
    const avgPositionSize = activeBetsCount > 0 ? totalInvested / activeBetsCount : 0

    // Find best performing bet (highest ROI)
    let bestPerformingBet = ''
    let bestRoi = 0

    for (const bet of activeBets) {
      const roi = bet.pnl_percentage || 0
      if (roi > bestRoi) {
        bestRoi = roi
        bestPerformingBet = bet.market_title
      }
    }

    // Find worst performing bet (lowest ROI)
    let worstPerformingBet = ''
    let worstRoi = 0

    for (const bet of activeBets) {
      const roi = bet.pnl_percentage || 0
      if (roi < worstRoi) {
        worstRoi = roi
        worstPerformingBet = bet.market_title
      }
    }

    // Calculate profit factor from history
    const totalWins = betHistory
      .filter(bet => bet.outcome === 'WIN')
      .reduce((sum, bet) => sum + (bet.payout || 0), 0)

    const totalLosses = betHistory
      .filter(bet => bet.outcome === 'LOSS')
      .reduce((sum, bet) => sum + bet.amount, 0)

    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0

    // Calculate additional fields for compatibility
    const totalValue = currentValue + claimableAmount
    const activeBetsValue = totalInvested
    const claimableValue = claimableAmount
    const unrealizedPnLPercent = totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0

    return {
      // Core metrics
      totalInvested,
      currentValue,
      unrealizedPnL,
      realizedPnL,
      totalPnL,
      claimableAmount,
      roiPercentage,
      winRate,
      activeBetsCount,
      pendingResolutions,
      totalWagered,
      totalReturns,
      avgPositionSize,
      bestPerformingBet,
      worstPerformingBet,
      profitFactor,
      // Additional compatibility fields
      totalValue,
      activeBetsValue,
      claimableValue,
      unrealizedPnLPercent
    }
  }, [activeBets, claimablePayouts, betHistory])
}
