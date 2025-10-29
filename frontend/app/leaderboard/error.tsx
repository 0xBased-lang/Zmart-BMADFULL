'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * Leaderboard Error Boundary
 * Catches errors in leaderboard page
 */
export default function LeaderboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Leaderboard error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-red-900/20 border border-red-500 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <h2 className="text-2xl font-bold text-red-400">
            Leaderboard Error
          </h2>
        </div>

        <p className="text-gray-300 mb-6">
          We couldn't load the leaderboard. Please try again in a moment.
        </p>

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
