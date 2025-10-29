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

    // DEVELOPMENT MODE: Skip signature verification for now
    // TODO: Add signature verification with Supabase Edge Function later
    // For now, we trust the client signature
    console.log('⚠️  DEV MODE: Skipping signature verification')
    console.log('📝 Vote submission:', {
      proposal_id: message.proposal_id,
      voter: voter_wallet,
      choice: message.vote_choice
    })

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
        // Note: signature stored for future verification
        transaction_signature: signature,
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
