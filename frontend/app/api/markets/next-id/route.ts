/**
 * GET /api/markets/next-id
 *
 * Returns the next available market ID for on-chain market creation.
 * Ensures uniqueness by checking the highest market_id in the database.
 *
 * Strategy:
 * 1. Query markets table for highest market_id
 * 2. Return highest + 1
 * 3. Fallback to timestamp if database is empty or unavailable
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering to avoid build-time env var validation
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    // Query for highest market_id
    const { data, error } = await supabase
      .from('markets')
      .select('market_id')
      .order('market_id', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching last market ID:', error)
      // Fallback to timestamp on error
      return NextResponse.json(
        { nextId: Date.now(), source: 'timestamp_fallback' },
        { status: 200 }
      )
    }

    if (!data || data.length === 0) {
      // First market - start at timestamp
      const firstId = Date.now()
      return NextResponse.json({ nextId: firstId, source: 'first_market' })
    }

    // Return highest + 1
    const lastId = parseInt(data[0].market_id.toString())
    const nextId = lastId + 1

    return NextResponse.json({
      nextId,
      source: 'database',
      lastId
    })

  } catch (error: any) {
    console.error('Error in markets/next-id API:', error)

    // Fallback to timestamp if database is unavailable
    return NextResponse.json({
      nextId: Date.now(),
      source: 'error_fallback',
      error: error.message
    })
  }
}
