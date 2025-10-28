import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Constants
const MAX_COMMENT_LENGTH = 2000
const MIN_COMMENT_LENGTH = 1
const RATE_LIMIT_HOURS = 1
const MAX_COMMENTS_PER_HOUR = 10

// HTML escape function for XSS prevention
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
  }
  return text.replace(/[&<>"'\/]/g, (char) => map[char])
}

// Sanitize comment text to prevent XSS
function sanitizeCommentText(text: string): string {
  // Trim whitespace
  let sanitized = text.trim()

  // Escape HTML characters
  sanitized = escapeHtml(sanitized)

  // Remove any remaining script tags (defense in depth)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  return sanitized
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { marketId, commentText, signature, walletAddress } = body

    // ============================================================================
    // VALIDATION: Required fields
    // ============================================================================

    if (!marketId || !commentText || !signature || !walletAddress) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: 'marketId, commentText, signature, and walletAddress are required',
        },
        { status: 400 }
      )
    }

    // ============================================================================
    // VALIDATION: Comment text length
    // ============================================================================

    const trimmedText = commentText.trim()
    if (trimmedText.length < MIN_COMMENT_LENGTH || trimmedText.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        {
          error: 'Invalid comment length',
          details: `Comment must be between ${MIN_COMMENT_LENGTH} and ${MAX_COMMENT_LENGTH} characters`,
        },
        { status: 400 }
      )
    }

    // ============================================================================
    // VALIDATION: Wallet signature
    // ============================================================================

    // TODO: Implement full Ed25519 signature verification using @solana/web3.js or tweetnacl
    // For MVP: Basic signature format validation
    // Production: Verify signature matches walletAddress and message content

    if (typeof signature !== 'string' || signature.length < 10) {
      return NextResponse.json(
        { error: 'Invalid signature format' },
        { status: 401 }
      )
    }

    // Validate wallet address format (Solana addresses are base58, typically 32-44 chars)
    if (typeof walletAddress !== 'string' || walletAddress.length < 32 || walletAddress.length > 44) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 401 }
      )
    }

    // ============================================================================
    // VALIDATION: Market exists
    // ============================================================================

    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('id')
      .eq('id', marketId)
      .single()

    if (marketError || !market) {
      return NextResponse.json(
        {
          error: 'Market not found',
          details: `No market exists with ID: ${marketId}`,
        },
        { status: 404 }
      )
    }

    // ============================================================================
    // RATE LIMITING: Check comments per hour
    // ============================================================================

    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_HOURS * 60 * 60 * 1000).toISOString()

    const { count, error: countError } = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('commenter_wallet', walletAddress)
      .gte('created_at', oneHourAgo)

    if (countError) {
      console.error('Rate limit check error:', countError)
      return NextResponse.json(
        { error: 'Failed to check rate limit' },
        { status: 500 }
      )
    }

    if (count !== null && count >= MAX_COMMENTS_PER_HOUR) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          details: `Maximum ${MAX_COMMENTS_PER_HOUR} comments per hour allowed`,
          retryAfter: 3600, // seconds
        },
        { status: 429 }
      )
    }

    // ============================================================================
    // SANITIZATION: Clean comment text
    // ============================================================================

    const sanitizedText = sanitizeCommentText(commentText)

    // ============================================================================
    // DATABASE: Insert comment
    // ============================================================================

    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert({
        market_id: parseInt(marketId), // Convert to integer for DB compatibility
        commenter_wallet: walletAddress,
        comment_text: sanitizedText,
        upvotes: 0,
        flagged: false,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Comment insertion error:', insertError)

      // Check for specific database constraint violations
      if (insertError.message?.includes('comments_comment_text_check')) {
        return NextResponse.json(
          { error: 'Comment text violates length constraints' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          error: 'Failed to create comment',
          details: insertError.message,
        },
        { status: 500 }
      )
    }

    // ============================================================================
    // SUCCESS: Return created comment
    // ============================================================================

    return NextResponse.json({
      success: true,
      comment: {
        id: newComment.id,
        market_id: newComment.market_id,
        commenter_wallet: newComment.commenter_wallet,
        comment_text: newComment.comment_text,
        created_at: newComment.created_at,
        upvotes: newComment.upvotes,
        flagged: newComment.flagged,
      },
      message: 'Comment posted successfully',
    })

  } catch (error) {
    console.error('Comment submission API error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
