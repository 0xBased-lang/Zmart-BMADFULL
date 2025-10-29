'use client'

/**
 * Direct Market Creation (Admin Only)
 * Bypass proposal/voting - create markets instantly
 * For testing and admin control
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { createMarket } from '@/lib/solana/market-creation'
import { toast } from 'react-hot-toast'

export default function CreateMarketPage() {
  const router = useRouter()
  const { publicKey, connected } = useWallet()

  const [formData, setFormData] = useState({
    question: '',
    description: '',
    category: '',
    endDate: '',
    bondAmount: '100'
  })
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!connected || !publicKey) {
      toast.error('Please connect your wallet')
      return
    }

    setIsCreating(true)

    try {
      // Create market on-chain
      const result = await createMarket({
        question: formData.question,
        description: formData.description,
        category: formData.category,
        endTimestamp: Math.floor(new Date(formData.endDate).getTime() / 1000),
        bondAmount: parseFloat(formData.bondAmount),
        creator: publicKey
      })

      if (result.success) {
        toast.success(`Market created! ID: ${result.marketId}`)

        // Navigate to the new market
        router.push(`/markets/${result.marketId}`)
      } else {
        toast.error(result.error || 'Failed to create market')
      }
    } catch (error: any) {
      console.error('Market creation error:', error)
      toast.error(error.message || 'Failed to create market')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Create Market (Admin)
          </h1>
          <p className="text-gray-300">
            Direct market creation - bypasses proposal/voting flow
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 rounded-xl p-6 backdrop-blur-sm">
          {/* Question */}
          <div>
            <label className="block text-white font-medium mb-2">
              Market Question *
            </label>
            <input
              type="text"
              required
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="Will BTC reach $100k by end of 2025?"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed market description and resolution criteria..."
              rows={4}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-white font-medium mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Select category</option>
              <option value="Cryptocurrency">Cryptocurrency</option>
              <option value="Technology">Technology</option>
              <option value="Politics">Politics</option>
              <option value="Sports">Sports</option>
              <option value="Finance">Finance</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-white font-medium mb-2">
              End Date *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Bond Amount */}
          <div>
            <label className="block text-white font-medium mb-2">
              Creator Bond (SOL) *
            </label>
            <input
              type="number"
              required
              min="0.1"
              step="0.1"
              value={formData.bondAmount}
              onChange={(e) => setFormData({ ...formData, bondAmount: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
            <p className="text-sm text-gray-400 mt-1">
              Minimum: 0.1 SOL
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !connected}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating Market...' : 'Create Market'}
            </button>
          </div>

          {!connected && (
            <p className="text-center text-yellow-400 text-sm">
              ⚠️ Please connect your wallet to create markets
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
