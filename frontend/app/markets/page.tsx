import { getActiveMarkets } from '@/lib/data/markets'
import { MarketsListClient } from './components/MarketsListClient'

/**
 * Markets Page - Server Component
 * Fetches markets data server-side for instant page load
 */
export default async function MarketsPage() {
  // Fetch markets server-side
  const markets = await getActiveMarkets()

  // Pass data to Client Component for interactivity
  return <MarketsListClient initialMarkets={markets} />
}

// Metadata for SEO
export const metadata = {
  title: 'All Markets | BMAD-Zmart',
  description: 'Browse all prediction markets on BMAD-Zmart',
}
