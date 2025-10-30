import { supabase } from '@/lib/supabase'
/**
 * Real-time Market Creation Notifications Hook
 *
 * Subscribes to Supabase real-time events for market creation from proposals.
 * Shows toast notifications when a user's proposal is approved and becomes a market.
 *
 * Usage:
 * ```tsx
 * import { useMarketCreationNotifications } from '@/lib/hooks/useMarketCreationNotifications'
 *
 * function MyComponent() {
 *   const { wallet } = useWallet()
 *   useMarketCreationNotifications(wallet.publicKey?.toString())
 *   // ... rest of component
 * }
 * ```
 */

import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'


export interface MarketCreationNotification {
  id: string
  type: 'MARKET_CREATED'
  user_wallet: string
  market_id: number
  message: string
  read: boolean
  created_at: string
}

/**
 * Subscribe to real-time market creation notifications
 *
 * @param userWallet - Connected wallet address (or undefined if not connected)
 * @returns Subscription cleanup function
 */
export function useMarketCreationNotifications(userWallet?: string) {
  const toastShownRef = useRef(new Set<string>())

  useEffect(() => {
    if (!userWallet) {
      // User not connected, skip subscription
      return
    }

    console.log('📡 Subscribing to notifications for:', userWallet)

    // Subscribe to notifications table for this user
    const subscription = supabase
      .channel(`notifications:${userWallet}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_wallet=eq.${userWallet}`
        },
        (payload) => {
          const notification = payload.new as MarketCreationNotification

          console.log('🔔 New notification:', notification)

          // Prevent duplicate toasts (in case of re-renders)
          if (toastShownRef.current.has(notification.id)) {
            return
          }

          toastShownRef.current.add(notification.id)

          // Show different toast based on notification type
          if (notification.type === 'MARKET_CREATED') {
            toast.success(
              notification.message,
              {
                duration: 10000,
                icon: '🎉',
                style: {
                  background: '#1f2937',
                  color: '#fff',
                  border: '1px solid #10b981'
                }
              }
            )
          }

          // Mark notification as read after 2 seconds
          setTimeout(() => {
            markNotificationAsRead(notification.id)
          }, 2000)
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status)

        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to notifications')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Failed to subscribe to notifications')
        }
      })

    // Cleanup on unmount or wallet change
    return () => {
      console.log('📡 Unsubscribing from notifications')
      subscription.unsubscribe()
      toastShownRef.current.clear()
    }
  }, [userWallet])
}

/**
 * Mark a notification as read
 */
async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('Failed to mark notification as read:', error)
    }
  } catch (error) {
    console.error('Error marking notification as read:', error)
  }
}

/**
 * Fetch unread notifications for a user
 *
 * Useful for showing notification count badge or notification list
 */
export async function fetchUnreadNotifications(userWallet: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('bettor_wallet', userWallet)
      .eq('read', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data as MarketCreationNotification[]
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return []
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userWallet: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('bettor_wallet', userWallet)
      .eq('read', false)

    if (error) throw error

    console.log('✅ Marked all notifications as read')
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
  }
}
