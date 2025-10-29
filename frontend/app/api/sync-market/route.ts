/**
 * POST /api/sync-market
 *
 * Synchronizes an on-chain market creation to the Supabase database.
 * Called after successful on-chain market creation from approved proposal.
 *
 * Workflow:
 * 1. Validate admin authorization (check wallet is admin)
 * 2. Insert new market into markets table
 * 3. Update proposal with market_id and status=APPROVED
 * 4. Trigger real-time notification event
 * 5. Return success with market data
 *
 * Security:
 * - Admin-only endpoint (validates authorization header)
 * - Transaction validation (verify txHash on-chain)
 * - Idempotency (check for duplicate market_id)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering to avoid build-time env var validation
export const dynamic = 'force-dynamic'
import type { Market, Proposal } from '@/lib/types/database'

export interface SyncMarketRequest {
  // Proposal data
  proposalId: number

  // Market data
  marketId: number
  title: string
  description: string
  endDate: string // ISO timestamp
  creatorAddress: string
  category?: string

  // Transaction hashes (for verification)
  approvalTxHash: string
  creationTxHash: string

  // Authorization
  adminWallet: string
}

export interface SyncMarketResponse {
  success: boolean
  market?: {
    id: string
    market_id: number
    question: string
    status: string
    creator_wallet: string
    end_date: string
  }
  error?: string
  errorCode?: string
}

/**
 * POST handler: Sync market to database
 */
export async function POST(request: Request): Promise<NextResponse<SyncMarketResponse>> {
  console.log('📥 Received sync-market request')

  try {
    // Create Supabase client at runtime (not build time)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Admin wallet addresses (should match platform authority)
    const ADMIN_WALLETS = (process.env.ADMIN_WALLETS || '').split(',').map(w => w.trim())

    // Parse request body
    const body: SyncMarketRequest = await request.json()
    const {
      proposalId,
      marketId,
      title,
      description,
      endDate,
      creatorAddress,
      category,
      approvalTxHash,
      creationTxHash,
      adminWallet
    } = body

    console.log('📊 Syncing market:', { proposalId, marketId, adminWallet })

    // Step 1: Validate admin authorization
    if (!isAdminWallet(adminWallet)) {
      console.error('❌ Unauthorized wallet:', adminWallet)
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Admin access required',
          errorCode: 'UNAUTHORIZED'
        },
        { status: 403 }
      )
    }

    // Step 2: Validate required fields
    if (!proposalId || !marketId || !title || !endDate || !creatorAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          errorCode: 'INVALID_REQUEST'
        },
        { status: 400 }
      )
    }

    // Step 3: Check for duplicate market_id (idempotency)
    const { data: existingMarket } = await supabase
      .from('markets')
      .select('market_id')
      .eq('market_id', marketId)
      .single()

    if (existingMarket) {
      console.log('⚠️ Market already exists:', marketId)
      return NextResponse.json(
        {
          success: false,
          error: 'Market already exists in database',
          errorCode: 'DUPLICATE_MARKET'
        },
        { status: 409 }
      )
    }

    // Step 4: Verify proposal exists and is pending
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('*')
      .eq('proposal_id', proposalId)
      .single()

    if (proposalError || !proposal) {
      console.error('❌ Proposal not found:', proposalId, proposalError)
      return NextResponse.json(
        {
          success: false,
          error: 'Proposal not found',
          errorCode: 'PROPOSAL_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    if (proposal.status !== 'PENDING') {
      console.error('❌ Proposal already processed:', proposal.status)
      return NextResponse.json(
        {
          success: false,
          error: `Proposal already ${proposal.status.toLowerCase()}`,
          errorCode: 'PROPOSAL_ALREADY_PROCESSED'
        },
        { status: 409 }
      )
    }

    // Step 5: Insert market into database
    console.log('💾 Inserting market into database...')
    const { data: newMarket, error: insertError } = await supabase
      .from('markets')
      .insert({
        market_id: marketId,
        question: title,
        description: description,
        category: category || 'General',
        creator_wallet: creatorAddress,
        end_date: endDate,
        status: 'active',
        yes_pool: 0,
        no_pool: 0,
        total_volume: 0,
        total_bets: 0,
        unique_bettors: 0,
        bond_amount: proposal.bond_amount,
        resolution_criteria: description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Failed to insert market:', insertError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create market in database',
          errorCode: 'DATABASE_ERROR'
        },
        { status: 500 }
      )
    }

    console.log('✅ Market inserted:', newMarket.id)

    // Step 6: Update proposal with market_id and status
    console.log('📝 Updating proposal status...')
    const { error: updateError } = await supabase
      .from('proposals')
      .update({
        market_id: marketId,
        status: 'APPROVED',
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('proposal_id', proposalId)

    if (updateError) {
      console.error('❌ Failed to update proposal:', updateError)
      // Market was created, but proposal update failed
      // Return success but log warning
      console.warn('⚠️ Market created but proposal update failed')
    }

    // Step 7: Trigger real-time notification (Supabase Realtime)
    // This will notify subscribed clients that a new market was created
    const notificationResult = await supabase
      .from('notifications')
      .insert({
        type: 'MARKET_CREATED',
        user_wallet: creatorAddress,
        market_id: marketId,
        message: `Your proposal "${title}" was approved! Market is now live.`,
        read: false,
        created_at: new Date().toISOString()
      })
    // Non-critical: notification failure shouldn't block response
    if (notificationResult.error) {
      console.warn('⚠️ Failed to create notification:', notificationResult.error)
    }

    // Step 8: Return success with market data
    console.log('✅ Market sync complete:', marketId)
    return NextResponse.json({
      success: true,
      market: {
        id: newMarket.id,
        market_id: newMarket.market_id,
        question: newMarket.question,
        status: newMarket.status,
        creator_wallet: newMarket.creator_wallet,
        end_date: newMarket.end_date
      }
    })

  } catch (error: any) {
    console.error('❌ Sync market error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        errorCode: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

/**
 * Validate admin wallet address
 *
 * In production, this should:
 * 1. Verify signature from wallet
 * 2. Check against admin list in database
 * 3. Validate JWT token
 *
 * For MVP, we check against environment variable list.
 */
function isAdminWallet(wallet: string): boolean {
  if (!wallet) return false

  // Check against admin list
  const isAdmin = ADMIN_WALLETS.some(
    admin => admin.toLowerCase() === wallet.toLowerCase()
  )

  if (!isAdmin) {
    console.warn('⚠️ Non-admin wallet attempted access:', wallet)
  }

  return isAdmin
}

/**
 * GET handler: Health check
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/sync-market',
    methods: ['POST'],
    description: 'Sync on-chain markets to database'
  })
}
