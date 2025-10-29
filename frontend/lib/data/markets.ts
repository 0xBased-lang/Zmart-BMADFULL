/**
 * Server-side data fetching for markets
 * Used in Server Components for SSR
 */

import { supabase } from '@/lib/supabase'
import type { Market } from '@/lib/types/database'

/**
 * Fetch all active markets from database
 * Server-side function for SSR
 *
 * @returns Promise<Market[]> Array of active markets
 */
export async function getActiveMarkets(): Promise<Market[]> {
  try {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch markets:', error)
      return []
    }

    // Map data to ensure market_id is set and add backward compatibility
    const markets = (data || []).map((item: any) => ({
      ...item,
      market_id: item.market_id || parseInt(item.program_market_id || item.id || '0'),
      // Backward compatibility: map title to question for components expecting 'question'
      question: item.title || item.question,
      // Backward compatibility: map end_date to end_time for components expecting 'end_time'
      end_time: item.end_date || item.end_time,
      // Normalize status to lowercase for component compatibility
      status: item.status?.toLowerCase() || 'active'
    })) as Market[]

    return markets
  } catch (error) {
    console.error('Error fetching markets:', error)
    return []
  }
}

/**
 * Fetch a single market by ID
 * Server-side function for SSR
 *
 * @param marketId - The market ID to fetch
 * @returns Promise<Market | null> Market or null if not found
 */
export async function getMarketById(marketId: string): Promise<Market | null> {
  try {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('id', marketId)
      .single()

    if (error) {
      console.error('Failed to fetch market:', error)
      return null
    }

    if (!data) return null

    // Map data to ensure market_id is set and add backward compatibility
    const market = {
      ...data,
      market_id: data.market_id || parseInt(data.program_market_id || data.id || '0'),
      // Backward compatibility
      question: data.title || data.question,
      end_time: data.end_date || data.end_time,
      status: data.status?.toLowerCase() || 'active'
    } as Market

    return market
  } catch (error) {
    console.error('Error fetching market:', error)
    return null
  }
}
