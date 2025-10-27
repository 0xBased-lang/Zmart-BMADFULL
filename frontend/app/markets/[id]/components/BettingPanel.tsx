'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import * as anchor from '@project-serum/anchor'
import type { Market } from '@/lib/types/database'
// import { placeBet } from '@/lib/solana/betting' // TODO: Enable when Solana integration is ready
import { toast } from 'react-hot-toast'

// Temporary mock function for development
const placeBet = async (params: any) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Simulate 80% success rate
  if (Math.random() > 0.2) {
    return {
      success: true,
      txHash: 'mock' + Math.random().toString(36).substring(7)
    }
  } else {
    return {
      success: false,
      error: 'Simulated error for testing'
    }
  }
}

interface MarketStatus {
  isActive: boolean
  isResolved: boolean
  isCancelled: boolean
  isExpired: boolean
  timeLeft: number
  endingSoon: boolean
  justCreated: boolean
}

interface BettingPanelProps {
  market: Market
  marketStatus: MarketStatus | null
  currentOdds: { yes: number; no: number }
  isMobile?: boolean
}

interface FeeBreakdown {
  platform: number
  team: number
  burn: number
  creator: number
  total: number
  netAmount: number
}

export function BettingPanel({ market, marketStatus, currentOdds, isMobile }: BettingPanelProps) {
  const { publicKey, connected, connect, signTransaction } = useWallet()
  const { connection } = useConnection()

  // Betting state
  const [betAmount, setBetAmount] = useState<string>('')
  const [selectedOutcome, setSelectedOutcome] = useState<'YES' | 'NO' | null>(null)
  const [isPlacingBet, setIsPlacingBet] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)

  // Wallet state
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [fetchingBalance, setFetchingBalance] = useState(false)

  // Error state
  const [amountError, setAmountError] = useState<string | null>(null)
  const [betError, setBetError] = useState<string | null>(null)

  // Validation state
  const [touchedAmount, setTouchedAmount] = useState(false)

  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey || !connection) return

      setFetchingBalance(true)
      try {
        const balance = await connection.getBalance(publicKey)
        setWalletBalance(balance / LAMPORTS_PER_SOL)
      } catch (error) {
        console.error('Failed to fetch balance:', error)
        setWalletBalance(0)
      } finally {
        setFetchingBalance(false)
      }
    }

    fetchBalance()
    // Refresh balance every 10 seconds
    const interval = setInterval(fetchBalance, 10000)
    return () => clearInterval(interval)
  }, [publicKey, connection])

  // Calculate fees (matching Solana program logic)
  const calculateFees = useCallback((amount: number): FeeBreakdown => {
    if (!amount || amount <= 0) {
      return {
        platform: 0,
        team: 0,
        burn: 0,
        creator: 0,
        total: 0,
        netAmount: 0
      }
    }

    // Fees in basis points (100 bps = 1%)
    const platformFeeBps = 100 // 1%
    const teamFeeBps = 100 // 1%
    const burnFeeBps = 50 // 0.5%

    // Creator fee is tiered based on bond (defaulting to 1% for now)
    // In production, this would be fetched from the bond tier
    const creatorFeeBps = 100 // 1% (can be 0.5%, 1%, or 2% based on tier)

    const platform = (amount * platformFeeBps) / 10000
    const team = (amount * teamFeeBps) / 10000
    const burn = (amount * burnFeeBps) / 10000
    const creator = (amount * creatorFeeBps) / 10000

    const total = platform + team + burn + creator
    const netAmount = amount - total

    return {
      platform,
      team,
      burn,
      creator,
      total,
      netAmount
    }
  }, [])

  // Memoized fee calculation
  const fees = useMemo(() => {
    const amount = parseFloat(betAmount) || 0
    return calculateFees(amount)
  }, [betAmount, calculateFees])

  // Calculate estimated shares
  const estimatedShares = useMemo(() => {
    if (!selectedOutcome || !fees.netAmount) return 0

    const pool = selectedOutcome === 'YES'
      ? (market.yes_pool || 0) / LAMPORTS_PER_SOL
      : (market.no_pool || 0) / LAMPORTS_PER_SOL

    const totalPoolAfterBet = pool + fees.netAmount

    if (totalPoolAfterBet === 0) return fees.netAmount

    // Simple constant product formula approximation
    const sharePercentage = fees.netAmount / totalPoolAfterBet
    return sharePercentage * 100
  }, [selectedOutcome, fees.netAmount, market])

  // Validate amount
  const validateAmount = useCallback((value: string) => {
    if (!value || value === '') {
      setAmountError(null)
      return true
    }

    const amount = parseFloat(value)

    if (isNaN(amount)) {
      setAmountError('Please enter a valid number')
      return false
    }

    if (amount <= 0) {
      setAmountError('Amount must be greater than 0')
      return false
    }

    if (amount < 0.01) {
      setAmountError('Minimum bet is 0.01 SOL')
      return false
    }

    if (amount > 1000) {
      setAmountError('Maximum bet is 1000 SOL')
      return false
    }

    if (connected && amount > walletBalance) {
      setAmountError(`Insufficient balance (${walletBalance.toFixed(4)} SOL available)`)
      return false
    }

    setAmountError(null)
    return true
  }, [connected, walletBalance])

  // Handle amount change
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    // Allow empty string or valid number format
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBetAmount(value)
      if (touchedAmount) {
        validateAmount(value)
      }
    }
  }, [touchedAmount, validateAmount])

  // Handle amount blur
  const handleAmountBlur = useCallback(() => {
    setTouchedAmount(true)
    validateAmount(betAmount)
  }, [betAmount, validateAmount])

  // Quick amount buttons
  const setQuickAmount = useCallback((amount: number) => {
    setBetAmount(amount.toString())
    setTouchedAmount(true)
    validateAmount(amount.toString())
  }, [validateAmount])

  // Handle outcome selection
  const selectOutcome = useCallback((outcome: 'YES' | 'NO') => {
    setSelectedOutcome(outcome)
    setBetError(null)
  }, [])

  // Connect wallet
  const handleConnect = useCallback(async () => {
    if (!connect) return
    try {
      await connect()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      toast.error('Failed to connect wallet')
    }
  }, [connect])

  // Place bet
  const handlePlaceBet = useCallback(async () => {
    // Validation
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet')
      return
    }

    if (!selectedOutcome) {
      setBetError('Please select YES or NO')
      return
    }

    if (!validateAmount(betAmount)) {
      return
    }

    const amount = parseFloat(betAmount)
    if (amount <= 0) {
      return
    }

    setShowConfirmation(true)
  }, [connected, publicKey, selectedOutcome, betAmount, validateAmount])

  // Confirm and execute bet
  const confirmBet = useCallback(async () => {
    if (!publicKey || !signTransaction || !selectedOutcome) return

    setIsPlacingBet(true)
    setBetError(null)
    setTransactionHash(null)

    try {
      const amount = parseFloat(betAmount)
      const result = await placeBet({
        marketId: market.market_id,
        amount,
        outcome: selectedOutcome,
        publicKey,
        connection,
        signTransaction
      })

      if (result.success && result.txHash) {
        setTransactionHash(result.txHash)
        toast.success('Bet placed successfully!')

        // Reset form
        setBetAmount('')
        setSelectedOutcome(null)
        setTouchedAmount(false)

        // Refresh balance after a delay
        setTimeout(async () => {
          if (publicKey) {
            const balance = await connection.getBalance(publicKey)
            setWalletBalance(balance / LAMPORTS_PER_SOL)
          }
        }, 2000)
      } else {
        throw new Error(result.error || 'Failed to place bet')
      }
    } catch (error: any) {
      console.error('Bet placement failed:', error)

      // Parse error message
      let errorMessage = 'Failed to place bet'
      if (error.message?.includes('insufficient')) {
        errorMessage = 'Insufficient balance for transaction'
      } else if (error.message?.includes('rejected')) {
        errorMessage = 'Transaction rejected by wallet'
      } else if (error.message?.includes('Market not active')) {
        errorMessage = 'This market is no longer accepting bets'
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Transaction timed out. Please try again'
      }

      setBetError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsPlacingBet(false)
      setShowConfirmation(false)
    }
  }, [publicKey, signTransaction, selectedOutcome, betAmount, market, connection])

  // Can place bet check
  const canPlaceBet = useMemo(() => {
    return (
      connected &&
      selectedOutcome &&
      betAmount &&
      !amountError &&
      !isPlacingBet &&
      marketStatus?.isActive &&
      parseFloat(betAmount) > 0
    )
  }, [connected, selectedOutcome, betAmount, amountError, isPlacingBet, marketStatus])

  // Market not active message
  const getInactiveMessage = () => {
    if (!marketStatus) return null

    if (marketStatus.isResolved) {
      return 'This market has been resolved'
    }
    if (marketStatus.isCancelled) {
      return 'This market has been cancelled'
    }
    if (marketStatus.isExpired) {
      return 'This market has ended and is awaiting resolution'
    }
    return null
  }

  return (
    <div className={`bg-white/5 rounded-xl p-6 backdrop-blur-sm ${isMobile ? 'space-y-4' : ''}`}>
      <h3 className="text-xl font-bold text-white mb-4">Place Your Bet</h3>

      {/* Market Status Warning */}
      {!marketStatus?.isActive && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-400 text-sm">
            ⚠️ {getInactiveMessage()}
          </p>
        </div>
      )}

      {/* Wallet Connection */}
      {!connected ? (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">Connect your wallet to place bets</p>
          <button
            onClick={handleConnect}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Wallet Balance */}
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
            <span className="text-gray-400 text-sm">Wallet Balance</span>
            <span className="text-white font-medium">
              {fetchingBalance ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                `${walletBalance.toFixed(4)} SOL`
              )}
            </span>
          </div>

          {/* Outcome Selection */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Select Outcome</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => selectOutcome('YES')}
                disabled={!marketStatus?.isActive}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedOutcome === 'YES'
                    ? 'border-green-500 bg-green-500/20 text-green-400'
                    : 'border-white/20 hover:border-green-500/50 text-gray-300'
                } ${!marketStatus?.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="font-bold text-lg mb-1">YES</div>
                <div className="text-sm opacity-80">{currentOdds.yes.toFixed(1)}%</div>
              </button>
              <button
                onClick={() => selectOutcome('NO')}
                disabled={!marketStatus?.isActive}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedOutcome === 'NO'
                    ? 'border-red-500 bg-red-500/20 text-red-400'
                    : 'border-white/20 hover:border-red-500/50 text-gray-300'
                } ${!marketStatus?.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="font-bold text-lg mb-1">NO</div>
                <div className="text-sm opacity-80">{currentOdds.no.toFixed(1)}%</div>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Bet Amount (SOL)</label>
            <input
              type="text"
              value={betAmount}
              onChange={handleAmountChange}
              onBlur={handleAmountBlur}
              disabled={!marketStatus?.isActive}
              placeholder="0.00"
              className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors ${
                amountError ? 'border-red-500' : 'border-white/20'
              } ${!marketStatus?.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {amountError && touchedAmount && (
              <p className="text-red-400 text-sm mt-1">{amountError}</p>
            )}

            {/* Quick Amount Buttons */}
            <div className="flex gap-2 mt-2">
              {[0.1, 0.5, 1, 5].map(amount => (
                <button
                  key={amount}
                  onClick={() => setQuickAmount(amount)}
                  disabled={!marketStatus?.isActive || amount > walletBalance}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    amount > walletBalance
                      ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                      : 'bg-white/10 hover:bg-white/20 text-gray-300'
                  }`}
                >
                  {amount} SOL
                </button>
              ))}
            </div>
          </div>

          {/* Fee Breakdown */}
          {betAmount && parseFloat(betAmount) > 0 && (
            <div className="p-3 bg-white/5 rounded-lg space-y-2">
              <div className="text-sm text-gray-400">Fee Breakdown</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Platform (1%)</span>
                  <span className="text-gray-300">{fees.platform.toFixed(4)} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Team (1%)</span>
                  <span className="text-gray-300">{fees.team.toFixed(4)} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Burn (0.5%)</span>
                  <span className="text-gray-300">{fees.burn.toFixed(4)} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Creator (1%)</span>
                  <span className="text-gray-300">{fees.creator.toFixed(4)} SOL</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10 font-medium">
                  <span className="text-gray-400">Total Fees</span>
                  <span className="text-yellow-400">{fees.total.toFixed(4)} SOL</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-gray-300">Amount to Pool</span>
                  <span className="text-white">{fees.netAmount.toFixed(4)} SOL</span>
                </div>
              </div>

              {/* Estimated Shares */}
              {selectedOutcome && (
                <div className="pt-2 border-t border-white/10">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Est. Share of Pool</span>
                    <span className="text-purple-400 font-medium">
                      {estimatedShares.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {betError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{betError}</p>
            </div>
          )}

          {/* Place Bet Button */}
          <button
            onClick={handlePlaceBet}
            disabled={!canPlaceBet}
            className={`w-full py-3 rounded-lg font-medium transition-all ${
              canPlaceBet
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isPlacingBet ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Placing Bet...
              </span>
            ) : (
              'Place Bet'
            )}
          </button>

          {/* Transaction Success */}
          {transactionHash && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm mb-2">✓ Bet placed successfully!</p>
              <a
                href={`https://solscan.io/tx/${transactionHash}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 text-sm underline"
              >
                View on Solana Explorer →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-xl p-6 max-w-md w-full border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Your Bet</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Market</span>
                <span className="text-white">#{market.market_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Outcome</span>
                <span className={selectedOutcome === 'YES' ? 'text-green-400' : 'text-red-400'}>
                  {selectedOutcome}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount</span>
                <span className="text-white">{betAmount} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Fees</span>
                <span className="text-yellow-400">{fees.total.toFixed(4)} SOL</span>
              </div>
              <div className="flex justify-between font-bold pt-3 border-t border-white/10">
                <span className="text-gray-300">Amount to Pool</span>
                <span className="text-white">{fees.netAmount.toFixed(4)} SOL</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={isPlacingBet}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBet}
                disabled={isPlacingBet}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                {isPlacingBet ? 'Confirming...' : 'Confirm Bet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}