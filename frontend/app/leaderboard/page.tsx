import { Suspense } from 'react'
import { LeaderboardInterface } from './components/LeaderboardInterface'

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-center"><div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" /><p className="text-gray-500">Loading leaderboard...</p></div></div>}>
      <LeaderboardInterface />
    </Suspense>
  )
}

// Metadata for SEO
export const metadata = {
  title: 'Leaderboard | BMAD-Zmart',
  description: 'Top performers and rankings on BMAD-Zmart prediction markets',
}
