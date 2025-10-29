import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering to avoid build-time env var validation
export const dynamic = 'force-dynamic'

/**
 * POST /api/proposals/create-test
 * DEVELOPMENT ONLY: Creates a proposal directly in database
 * Bypasses on-chain validation for testing
 */
export async function POST(request: Request) {
  try {
    // Create Supabase client at runtime (not build time)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const body = await request.json();
    const { title, description, bondAmount, endTimestamp, creatorWallet } = body;

    // Validate required fields
    if (!title || !description || !bondAmount || !endTimestamp || !creatorWallet) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get next proposal ID
    const { data: existingProposals } = await supabase
      .from('proposals')
      .select('proposal_id')
      .order('proposal_id', { ascending: false })
      .limit(1);

    const nextId = existingProposals && existingProposals.length > 0
      ? parseInt(existingProposals[0].proposal_id) + 1
      : 1;

    // Determine bond tier (UPPERCASE as per database schema)
    let bondTier = 'TIER1';
    if (bondAmount >= 500) {
      bondTier = 'TIER3';
    } else if (bondAmount >= 100) {
      bondTier = 'TIER2';
    }

    // Calculate proposal tax (1% non-refundable)
    const proposalTax = Math.floor(bondAmount * 0.01);

    // Create proposal in database (matching ACTUAL database schema from 001_initial_schema.sql)
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        proposal_id: nextId,
        creator_wallet: creatorWallet,          // Actual field name
        title,
        description,
        bond_amount: bondAmount,                // Exists in actual schema
        bond_tier: bondTier,                    // TIER1, TIER2, TIER3 (uppercase)
        proposal_tax: proposalTax,              // Required field
        status: 'PENDING',                      // UPPERCASE enum value
        yes_votes: 0,
        no_votes: 0,
        total_voters: 0,
        end_date: new Date(endTimestamp * 1000).toISOString(),
        on_chain_address: 'TEST_' + nextId,     // Mark as test proposal
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create proposal', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      proposal: data,
      proposalId: nextId.toString(),
      message: 'Test proposal created successfully (database only, not on-chain)',
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
