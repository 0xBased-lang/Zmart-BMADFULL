'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * Markets Error Boundary
 * Catches errors in markets listing and detail pages
 */
export default function MarketsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Markets page error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-red-900/20 border border-red-500 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-red-400">
            Markets Error
          </h2>
        </div>

        <p className="text-gray-300 mb-6">
          We couldn't load the markets page. This could be due to a network issue or temporary problem with our servers.
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
