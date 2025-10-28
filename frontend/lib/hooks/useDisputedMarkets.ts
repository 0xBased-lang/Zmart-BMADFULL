'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface DisputedMarket {
  id: string;
  title: string;
  endDate: string;
  voteOutcome: 'YES' | 'NO';
  disputeWindowStart: string;
  timeRemaining: number; // seconds
  disputes: Array<{
    id: string;
    flagger: string;
    reason: string;
    evidence?: string;
    createdAt: string;
  }>;
}

export function useDisputedMarkets() {
  const [markets, setMarkets] = useState<DisputedMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisputedMarkets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query markets with DISPUTE_WINDOW status
      const { data, error: queryError } = await supabase
        .from('markets')
        .select(`
          id,
          title,
          end_date,
          vote_outcome,
          dispute_window_start,
          disputes (
            id,
            flagger_wallet,
            reason,
            evidence,
            created_at
          )
        `)
        .eq('status', 'DISPUTE_WINDOW')
        .order('dispute_window_start', { ascending: true });

      if (queryError) {
        throw queryError;
      }

      // Transform data and calculate time remaining
      const now = Date.now() / 1000;
      const transformedMarkets: DisputedMarket[] = (data || []).map((market: any) => {
        const disputeWindowStart = new Date(market.dispute_window_start).getTime() / 1000;
        const timeRemaining = Math.max(0, disputeWindowStart + 48 * 3600 - now);

        return {
          id: market.id,
          title: market.title,
          endDate: market.end_date,
          voteOutcome: market.vote_outcome,
          disputeWindowStart: market.dispute_window_start,
          timeRemaining,
          disputes: (market.disputes || []).map((d: any) => ({
            id: d.id,
            flagger: d.flagger_wallet,
            reason: d.reason,
            evidence: d.evidence,
            createdAt: d.created_at,
          })),
        };
      });

      setMarkets(transformedMarkets);
    } catch (err) {
      console.error('Error fetching disputed markets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch disputed markets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputedMarkets();

    // Set up real-time subscription
    const channel = supabase
      .channel('disputed-markets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'markets', filter: 'status=eq.DISPUTE_WINDOW' }, () => {
        fetchDisputedMarkets();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disputes' }, () => {
        fetchDisputedMarkets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { markets, loading, error, refresh: fetchDisputedMarkets };
}
