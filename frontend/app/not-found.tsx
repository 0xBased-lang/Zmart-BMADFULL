import Link from 'next/link'

/**
 * 404 Not Found Page
 * Displayed when a route doesn't exist
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            404
          </h1>
          <p className="text-2xl font-semibold text-gray-300 mt-4">
            Page Not Found
          </p>
        </div>

        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all transform hover:scale-105"
          >
            Go Home
          </Link>
          <Link
            href="/markets"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
          >
            View Markets
          </Link>
        </div>

        <div className="mt-12 p-6 bg-white/5 rounded-xl border border-white/10">
          <p className="text-sm text-gray-400 mb-4">
            Looking for something specific?
          </p>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/markets" className="text-purple-400 hover:text-purple-300">
              → Browse Markets
            </Link>
            <Link href="/leaderboard" className="text-purple-400 hover:text-purple-300">
              → View Leaderboard
            </Link>
            <Link href="/dashboard" className="text-purple-400 hover:text-purple-300">
              → My Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
