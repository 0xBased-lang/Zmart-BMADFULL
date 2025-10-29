import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Lazy Supabase client - only created when first accessed (not at import time)
let _supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (!_supabaseClient) {
    // Read env vars at runtime (not build time)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase credentials not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }

    _supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Don't persist auth (wallet-based auth)
      },
      realtime: {
        params: {
          eventsPerSecond: 10, // Throttle real-time events
        },
      },
    })
  }
  return _supabaseClient
}

// Export Proxy for backward compatibility - all property access goes through getter
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabaseClient()
    const value = (client as any)[prop]
    // Bind methods to the client instance
    return typeof value === 'function' ? value.bind(client) : value
  }
})

// Type helper for database queries
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Database schema types (will be generated from Supabase)
export interface Database {
  public: {
    Tables: {
      markets: {
        Row: {
          id: string
          program_market_id: string
          question: string
          description: string | null
          category: string | null
          creator_wallet: string
          end_time: string
          resolution_time: string | null
          status: 'active' | 'locked' | 'resolved' | 'cancelled'
          winning_outcome: 'yes' | 'no' | null
          yes_pool: number
          no_pool: number
          total_volume: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['markets']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['markets']['Insert']>
      }
      bets: {
        Row: {
          id: string
          market_id: string
          wallet_address: string
          side: 'yes' | 'no'
          amount: number
          odds_at_bet: number
          potential_payout: number
          claimed: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bets']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bets']['Insert']>
      }
      resolution_votes: {
        Row: {
          id: string
          market_id: string
          voter_wallet: string
          vote: 'yes' | 'no' | 'invalid'
          weight: number
          signature: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['resolution_votes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['resolution_votes']['Insert']>
      }
    }
  }
}
