/**
 * Real-Time Subscription Manager
 *
 * Manages Supabase real-time subscriptions with limits to prevent abuse
 * and resource exhaustion.
 *
 * Security Benefits:
 * - Limits concurrent subscriptions per user
 * - Prevents WebSocket resource exhaustion
 * - Automatic cleanup on unmount
 * - Connection pooling
 */

import { supabase } from './supabase';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

/**
 * Subscription configuration
 */
export interface SubscriptionConfig {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  schema?: string;
}

/**
 * Subscription callback type
 */
export type SubscriptionCallback<T = any> = (
  payload: RealtimePostgresChangesPayload<T>
) => void;

/**
 * Subscription Manager Class
 *
 * Limits and manages real-time subscriptions to prevent resource abuse
 */
class SubscriptionManager {
  private subscriptions = new Map<string, RealtimeChannel>();
  private readonly MAX_SUBSCRIPTIONS = 3;

  /**
   * Subscribe to database changes
   *
   * @param channelName - Unique channel identifier
   * @param config - Subscription configuration
   * @param callback - Callback function for changes
   * @returns Channel instance or null if limit exceeded
   *
   * @throws Error if max subscriptions exceeded
   *
   * Usage:
   * ```typescript
   * const channel = subscriptionManager.subscribe(
   *   'notifications',
   *   {
   *     table: 'notifications',
   *     event: 'INSERT',
   *     filter: 'user_id=eq.123'
   *   },
   *   (payload) => {
   *     console.log('New notification:', payload.new);
   *   }
   * );
   * ```
   */
  async subscribe<T = any>(
    channelName: string,
    config: SubscriptionConfig,
    callback: SubscriptionCallback<T>
  ): Promise<RealtimeChannel> {
    // Check if subscription already exists
    if (this.subscriptions.has(channelName)) {
      console.warn(`Subscription "${channelName}" already exists. Reusing existing subscription.`);
      return this.subscriptions.get(channelName)!;
    }

    // Check subscription limit
    if (this.subscriptions.size >= this.MAX_SUBSCRIPTIONS) {
      throw new Error(
        `Maximum ${this.MAX_SUBSCRIPTIONS} concurrent subscriptions allowed. ` +
          `Unsubscribe from existing channels before creating new ones.`
      );
    }

    // Create channel
    const channel = supabase.channel(channelName);

    // Configure postgres changes listener
    channel.on(
      'postgres_changes',
      {
        event: config.event,
        schema: config.schema || 'public',
        table: config.table,
        filter: config.filter,
      },
      callback as any
    );

    // Subscribe to channel
    const subscription = channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to channel: ${channelName}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Error subscribing to channel: ${channelName}`);
        this.unsubscribe(channelName);
      }
    });

    // Store subscription
    this.subscriptions.set(channelName, channel);

    return channel;
  }

  /**
   * Unsubscribe from a channel
   *
   * @param channelName - Channel identifier to unsubscribe
   * @returns True if unsubscribed, false if channel not found
   */
  async unsubscribe(channelName: string): Promise<boolean> {
    const channel = this.subscriptions.get(channelName);

    if (!channel) {
      console.warn(`Subscription "${channelName}" not found`);
      return false;
    }

    await channel.unsubscribe();
    this.subscriptions.delete(channelName);

    console.log(`🔌 Unsubscribed from channel: ${channelName}`);
    return true;
  }

  /**
   * Unsubscribe from all channels
   *
   * Call this on component unmount or user logout
   */
  async cleanup(): Promise<void> {
    console.log(`🧹 Cleaning up ${this.subscriptions.size} subscriptions`);

    const unsubscribePromises = Array.from(this.subscriptions.keys()).map((channelName) =>
      this.unsubscribe(channelName)
    );

    await Promise.all(unsubscribePromises);
    this.subscriptions.clear();
  }

  /**
   * Get active subscription count
   */
  getActiveCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get list of active subscription names
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Check if subscription exists
   */
  hasSubscription(channelName: string): boolean {
    return this.subscriptions.has(channelName);
  }
}

/**
 * Singleton instance of subscription manager
 */
export const subscriptionManager = new SubscriptionManager();

/**
 * React hook for managing subscriptions with automatic cleanup
 *
 * @param channelName - Unique channel identifier
 * @param config - Subscription configuration
 * @param callback - Callback function for changes
 * @param enabled - Whether subscription is enabled (default: true)
 *
 * Usage:
 * ```typescript
 * useSubscription(
 *   'my-notifications',
 *   {
 *     table: 'notifications',
 *     event: 'INSERT',
 *     filter: `user_id=eq.${userId}`
 *   },
 *   (payload) => {
 *     setNotifications(prev => [payload.new, ...prev]);
 *   },
 *   !!userId // Only subscribe if userId exists
 * );
 * ```
 */
export function useSubscription<T = any>(
  channelName: string,
  config: SubscriptionConfig,
  callback: SubscriptionCallback<T>,
  enabled: boolean = true
) {
  const [isSubscribed, setIsSubscribed] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!enabled) return;

    let channel: RealtimeChannel | null = null;

    const setupSubscription = async () => {
      try {
        channel = await subscriptionManager.subscribe(channelName, config, callback);
        setIsSubscribed(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Subscription failed');
        setIsSubscribed(false);
        console.error('Subscription error:', err);
      }
    };

    setupSubscription();

    // Cleanup on unmount
    return () => {
      if (channel) {
        subscriptionManager.unsubscribe(channelName);
        setIsSubscribed(false);
      }
    };
  }, [channelName, config.table, config.event, config.filter, enabled]);

  return {
    isSubscribed,
    error,
    unsubscribe: () => subscriptionManager.unsubscribe(channelName),
  };
}

// Import React for the hook
import React from 'react';

/**
 * Notification subscription helper
 *
 * Convenience function for subscribing to user notifications
 *
 * @param userId - User ID to filter notifications
 * @param callback - Callback for new notifications
 * @returns Channel instance
 */
export async function subscribeToNotifications(
  userId: string,
  callback: SubscriptionCallback
): Promise<RealtimeChannel> {
  return subscriptionManager.subscribe(
    'notifications',
    {
      table: 'notifications',
      event: 'INSERT',
      filter: `user_id=eq.${userId}`,
    },
    callback
  );
}

/**
 * Group activity subscription helper
 *
 * Subscribe to group member activities
 *
 * @param groupId - Group ID to monitor
 * @param callback - Callback for group activities
 * @returns Channel instance
 */
export async function subscribeToGroupActivity(
  groupId: string,
  callback: SubscriptionCallback
): Promise<RealtimeChannel> {
  return subscriptionManager.subscribe(
    `group-${groupId}`,
    {
      table: 'enrollments',
      event: 'UPDATE',
      filter: `group_id=eq.${groupId}`,
    },
    callback
  );
}

/**
 * Clean up all subscriptions on logout
 *
 * Call this when user logs out to prevent memory leaks
 */
export async function cleanupSubscriptions(): Promise<void> {
  await subscriptionManager.cleanup();
}
