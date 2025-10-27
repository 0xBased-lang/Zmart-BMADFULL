import { MarketDetailClient } from './MarketDetailClient'
import { notFound } from 'next/navigation'

interface MarketDetailPageProps {
  params: {
    id: string
  }
}

export default async function MarketDetailPage({ params }: MarketDetailPageProps) {
  // Validate market ID
  const marketId = parseInt(params.id)

  if (isNaN(marketId) || marketId < 0) {
    notFound()
  }

  // Pass validated ID to client component
  return <MarketDetailClient marketId={marketId} />
}

// Generate metadata for SEO
export async function generateMetadata({ params }: MarketDetailPageProps) {
  const marketId = parseInt(params.id)

  if (isNaN(marketId)) {
    return {
      title: 'Market Not Found',
      description: 'This market does not exist'
    }
  }

  // In production, fetch market data here for metadata
  return {
    title: `Market #${marketId} | BMAD-Zmart`,
    description: 'View market details and place your predictions',
  }
}