import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering to avoid build-time env var validation
export const dynamic = 'force-dynamic'

/**
 * GET /api/proposals/next-id
 * Returns the next available proposal ID
 */
export async function GET() {
  try {
    // Create Supabase client at runtime (not build time)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('proposals')
      .select('proposal_id')
      .order('proposal_id', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching last proposal ID:', error);
      return NextResponse.json(
        { error: 'Failed to fetch proposal ID', nextId: Date.now() },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      // First proposal
      return NextResponse.json({ nextId: 1 });
    }

    const lastId = parseInt(data[0].proposal_id);
    return NextResponse.json({ nextId: lastId + 1 });
  } catch (error) {
    console.error('Error in next-id API:', error);
    // Fallback to timestamp if database is unavailable
    return NextResponse.json({ nextId: Date.now() });
  }
}
