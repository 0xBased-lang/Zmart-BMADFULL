'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface PlatformMetrics {
  totalMarkets: number;
  activeUsers: number;
  volume24h: number;
  disputeRate: number;
}

export function usePlatformMetrics() {
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalMarkets: 0,
    activeUsers: 0,
    volume24h: 0,
    disputeRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Total markets
      const { count: totalMarkets } = await supabase
        .from('markets')
        .select('*', { count: 'exact', head: true });

      // Active users (bets in last 30 days)
      const { data: betUsers } = await supabase
        .from('bets')
        .select('user_wallet')
        .gte('created_at', last30Days.toISOString());

      const uniqueUsers = new Set(betUsers?.map((b) => b.user_wallet) || []);

      // 24h volume
      const { data: recentBets } = await supabase
        .from('bets')
        .select('amount')
        .gte('created_at', last24Hours.toISOString());

      const volume24h = recentBets?.reduce((sum, bet) => sum + (bet.amount || 0), 0) || 0;

      // Dispute rate
      const { count: disputedCount } = await supabase
        .from('markets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'DISPUTE_WINDOW');

      const { count: resolvedCount } = await supabase
        .from('markets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['RESOLVED', 'DISPUTE_WINDOW']);

      const disputeRate = resolvedCount ? ((disputedCount || 0) / resolvedCount) * 100 : 0;

      setMetrics({
        totalMarkets: totalMarkets || 0,
        activeUsers: uniqueUsers.size,
        volume24h,
        disputeRate,
      });
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return { metrics, loading, error, refresh: fetchMetrics };
}
