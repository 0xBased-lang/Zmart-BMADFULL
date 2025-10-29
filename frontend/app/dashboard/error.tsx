'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * Dashboard Error Boundary
 * Catches errors in dashboard page
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-red-900/20 border border-red-500 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-2xl font-bold text-red-400">
            Dashboard Error
          </h2>
        </div>

        <p className="text-gray-300 mb-6">
          We couldn't load your dashboard. This could be due to a wallet connection issue or temporary problem.
        </p>

        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500 rounded-lg">
          <p className="text-sm text-yellow-300">
            💡 <strong>Tip:</strong> Try disconnecting and reconnecting your wallet.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 p-4 bg-black/30 rounded-lg">
            <summary className="cursor-pointer text-sm text-gray-400 mb-2">
              Error Details
            </summary>
            <pre className="text-xs text-red-300 overflow-auto max-h-40">
              {error.message}
            </pre>
          </details>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
