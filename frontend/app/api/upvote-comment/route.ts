import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { commentId, signature, walletAddress } = body

    if (!commentId || !signature || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already upvoted
    const { data: existingUpvote } = await supabase
      .from('comment_upvotes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('voter_wallet', walletAddress)
      .single()

    if (existingUpvote) {
      // Remove upvote (toggle off)
      await supabase
        .from('comment_upvotes')
        .delete()
        .eq('comment_id', commentId)
        .eq('voter_wallet', walletAddress)

      // Get current upvotes count and decrement
      const { data: currentComment } = await supabase
        .from('comments')
        .select('upvotes')
        .eq('id', commentId)
        .single()

      const newUpvotes = Math.max(0, (currentComment?.upvotes || 1) - 1)

      const { data: comment } = await supabase
        .from('comments')
        .update({ upvotes: newUpvotes })
        .eq('id', commentId)
        .select('upvotes')
        .single()

      return NextResponse.json({
        success: true,
        upvoted: false,
        upvotes: comment?.upvotes || 0,
      })
    } else {
      // Add upvote
      await supabase
        .from('comment_upvotes')
        .insert({ comment_id: commentId, voter_wallet: walletAddress })

      // Get current upvotes count and increment
      const { data: currentComment } = await supabase
        .from('comments')
        .select('upvotes')
        .eq('id', commentId)
        .single()

      const newUpvotes = (currentComment?.upvotes || 0) + 1

      const { data: comment } = await supabase
        .from('comments')
        .update({ upvotes: newUpvotes })
        .eq('id', commentId)
        .select('upvotes')
        .single()

      return NextResponse.json({
        success: true,
        upvoted: true,
        upvotes: comment?.upvotes || 1,
      })
    }
  } catch (error) {
    console.error('Upvote error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
