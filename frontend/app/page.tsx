import { getActiveMarkets } from '@/lib/data/markets'
import { MarketsPageClient } from './components/MarketsPageClient'

/**
 * Homepage - Server Component
 * Fetches markets data server-side for instant page load
 */
export default async function Home() {
  // Fetch markets server-side
  const markets = await getActiveMarkets()

  // Pass data to Client Component for interactivity
  return <MarketsPageClient initialMarkets={markets} />
}
