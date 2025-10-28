'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ProposalCard } from './ProposalCard'

type TabType = 'pending' | 'approved' | 'rejected'

interface Proposal {
  id: string
  proposal_id: string
  creator_wallet: string
  title: string
  description: string
  bond_amount: number
  bond_tier: string
  status: string
  yes_votes: number
  no_votes: number
  total_voters: number
  created_at: string
  end_date: string
}

export function ProposalsInterface() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Get initial tab from URL, default to 'pending'
  const initialTab = (searchParams.get('tab') as TabType) || 'pending'
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  // Proposals state
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sync tab state with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [searchParams, activeTab])

  // Fetch proposals based on active tab
  useEffect(() => {
    async function fetchProposals() {
      try {
        setLoading(true)
        setError(null)

        // Map tab to database status
        // Note: 'pending' tab shows PENDING or VOTING status proposals
        let statusFilter: string[]
        if (activeTab === 'pending') {
          statusFilter = ['PENDING', 'VOTING']
        } else if (activeTab === 'approved') {
          statusFilter = ['APPROVED']
        } else {
          statusFilter = ['REJECTED']
        }

        const { data, error: fetchError } = await supabase
          .from('proposals')
          .select('*')
          .in('status', statusFilter)
          .order('created_at', { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        setProposals(data || [])
      } catch (err) {
        console.error('Error fetching proposals:', err)
        setError(err instanceof Error ? err.message : 'Failed to load proposals')
      } finally {
        setLoading(false)
      }
    }

    fetchProposals()
  }, [activeTab])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    // Update URL without page reload
    router.push(`/proposals?tab=${tab}`, { scroll: false })
  }

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        <button
          onClick={() => handleTabChange('pending')}
          className={`px-6 py-3 font-semibold transition-colors relative ${
            activeTab === 'pending'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Pending Votes
          {activeTab === 'pending' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400"></div>
          )}
        </button>

        <button
          onClick={() => handleTabChange('approved')}
          className={`px-6 py-3 font-semibold transition-colors relative ${
            activeTab === 'approved'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Approved
          {activeTab === 'approved' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400"></div>
          )}
        </button>

        <button
          onClick={() => handleTabChange('rejected')}
          className={`px-6 py-3 font-semibold transition-colors relative ${
            activeTab === 'rejected'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Rejected
          {activeTab === 'rejected' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400"></div>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Loading State */}
        {loading && (
          <div className="text-center text-gray-400 py-12">
            <svg className="animate-spin h-8 w-8 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading proposals...
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center text-red-400 py-12">
            <p className="text-lg mb-2">Error loading proposals</p>
            <p className="text-sm text-gray-400">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && proposals.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg mb-2">
              {activeTab === 'pending' && 'No proposals currently in voting period'}
              {activeTab === 'approved' && 'No approved proposals yet'}
              {activeTab === 'rejected' && 'No rejected proposals yet'}
            </p>
            <p className="text-sm text-gray-500">
              {activeTab === 'pending' && 'Check back later or create a new proposal'}
            </p>
          </div>
        )}

        {/* Proposals Grid */}
        {!loading && !error && proposals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
