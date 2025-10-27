import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, signature, voter_wallet } = body

    // Validate input
    if (!message || !signature || !voter_wallet) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!message.market_id || !message.vote_choice || !message.timestamp) {
      return NextResponse.json(
        { error: 'Invalid vote message structure' },
        { status: 400 }
      )
    }

    // Validate vote choice
    if (!['YES', 'NO'].includes(message.vote_choice)) {
      return NextResponse.json(
        { error: 'Invalid vote choice. Must be YES or NO' },
        { status: 400 }
      )
    }

    // Call Supabase Edge Function to verify signature and store vote
    // Note: In Epic 2, submit-vote Edge Function handles both verification and storage
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/submit-vote`

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        market_id: message.market_id,
        voter_wallet,
        vote_choice: message.vote_choice.toLowerCase(), // Convert to lowercase for DB
        signature,
        message: JSON.stringify(message),
        vote_weight: 1, // Default to democratic mode (weight=1)
        timestamp: message.timestamp,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))

      // Handle specific errors
      if (response.status === 409 || errorData.message?.includes('duplicate') || errorData.message?.includes('already voted')) {
        return NextResponse.json(
          { error: 'You have already voted on this market' },
          { status: 409 }
        )
      }

      if (response.status === 401 || errorData.message?.includes('signature')) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }

      throw new Error(errorData.message || `Edge function returned ${response.status}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      vote_id: result.vote_id,
      message: 'Vote submitted successfully',
    })
  } catch (error) {
    console.error('Vote submission API error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
