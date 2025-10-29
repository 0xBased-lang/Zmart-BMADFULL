import { getMarketById } from '@/lib/data/markets'
import { MarketDetailClient } from './MarketDetailClient'
import { notFound } from 'next/navigation'

interface MarketDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function MarketDetailPage({ params }: MarketDetailPageProps) {
  // Await params (Next.js 15 requirement)
  const { id } = await params

  // Validate market ID
  const marketId = parseInt(id)

  if (isNaN(marketId) || marketId < 0) {
    notFound()
  }

  // Fetch market data server-side
  const market = await getMarketById(id)

  if (!market) {
    notFound()
  }

  // Pass market data to client component
  return <MarketDetailClient marketId={marketId} initialMarket={market} />
}

// Generate metadata for SEO
export async function generateMetadata({ params }: MarketDetailPageProps) {
  // Await params (Next.js 15 requirement)
  const { id } = await params
  const marketId = parseInt(id)

  if (isNaN(marketId)) {
    return {
      title: 'Market Not Found',
      description: 'This market does not exist'
    }
  }

  // Fetch market data for metadata
  const market = await getMarketById(id)

  if (!market) {
    return {
      title: 'Market Not Found',
      description: 'This market does not exist'
    }
  }

  return {
    title: `${market.question} | BMAD-Zmart`,
    description: market.description || 'View market details and place your predictions',
  }
}
