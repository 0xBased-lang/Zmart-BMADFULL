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

    if (!message.proposal_id || !message.vote_choice || !message.timestamp) {
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
    // Note: We'll use verify-vote-signature from Epic 2, Story 2.1
    // Then store directly in proposal_votes table
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/verify-vote-signature`

    const verifyResponse = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        message: JSON.stringify(message),
        signature,
        voter_wallet,
      }),
    })

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json().catch(() => ({ message: 'Signature verification failed' }))
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Signature verified, now store vote in proposal_votes table
    // Use Supabase REST API to insert vote
    const insertUrl = `${SUPABASE_URL}/rest/v1/proposal_votes`

    const insertResponse = await fetch(insertUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY || '',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        proposal_id: message.proposal_id,
        voter_wallet,
        vote_choice: message.vote_choice,
        signature,
        vote_weight: 1, // Default to democratic mode (weight=1)
        timestamp: new Date(message.timestamp).toISOString(),
      }),
    })

    if (!insertResponse.ok) {
      const errorData = await insertResponse.json().catch(() => ({ message: 'Unknown error' }))

      // Handle specific errors
      if (insertResponse.status === 409 || errorData.message?.includes('duplicate') || errorData.message?.includes('proposal_vote_unique')) {
        return NextResponse.json(
          { error: 'You have already voted on this proposal' },
          { status: 409 }
        )
      }

      throw new Error(errorData.message || `Database insert returned ${insertResponse.status}`)
    }

    const result = await insertResponse.json()

    return NextResponse.json({
      success: true,
      vote_id: result[0]?.id || 'unknown',
      message: 'Vote submitted successfully',
    })
  } catch (error) {
    console.error('Proposal vote submission API error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
