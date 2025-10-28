'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { LeaderboardTable } from './LeaderboardTable'

export type TabType = 'points' | 'win-rate' | 'volume' | 'creators'

const tabs = [
  { id: 'points' as TabType, label: 'Top by Points', icon: '⭐' },
  { id: 'win-rate' as TabType, label: 'Top by Win Rate', icon: '📊' },
  { id: 'volume' as TabType, label: 'Top by Volume', icon: '💰' },
  { id: 'creators' as TabType, label: 'Top Creators', icon: '🏗️' },
]

export function LeaderboardInterface() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { publicKey } = useWallet()

  // Get initial tab from URL, default to 'points'
  const initialTab = (searchParams.get('tab') as TabType) || 'points'
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  // Sync tab state with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [searchParams, activeTab])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    // Update URL without page reload
    router.push(`/leaderboard?tab=${tab}`, { scroll: false })
  }

  const currentUserWallet = publicKey?.toString() || null

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Leaderboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Top performers and rankings on BMAD-Zmart
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap relative flex items-center gap-2 ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>
            )}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <LeaderboardTable
        activeTab={activeTab}
        currentUserWallet={currentUserWallet}
      />
    </div>
  )
}
