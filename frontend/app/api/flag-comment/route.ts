import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const FLAG_THRESHOLD = 3 // Number of flags before marking comment as flagged

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { commentId, reason, signature, walletAddress } = body

    if (!commentId || !signature || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already flagged this comment
    const { data: existingFlag } = await supabase
      .from('comment_flags')
      .select('id')
      .eq('comment_id', commentId)
      .eq('flagger_wallet', walletAddress)
      .single()

    if (existingFlag) {
      return NextResponse.json(
        { error: 'You have already flagged this comment' },
        { status: 409 }
      )
    }

    // Insert flag
    await supabase
      .from('comment_flags')
      .insert({
        comment_id: commentId,
        flagger_wallet: walletAddress,
        reason: reason || null,
      })

    // Count total flags for this comment
    const { count } = await supabase
      .from('comment_flags')
      .select('id', { count: 'exact', head: true })
      .eq('comment_id', commentId)

    // If threshold exceeded, mark comment as flagged
    if (count && count >= FLAG_THRESHOLD) {
      await supabase
        .from('comments')
        .update({ flagged: true })
        .eq('id', commentId)
    }

    return NextResponse.json({
      success: true,
      message: 'Comment flagged for review',
    })
  } catch (error) {
    console.error('Flag error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
