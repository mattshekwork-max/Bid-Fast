import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Check if a user has an active subscription
 */
export async function hasActiveSubscription(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data: user } = await supabase
    .from('users')
    .select('subscription_status, subscription_ends_at')
    .eq('id', userId)
    .single();

  if (!user) {
    return false;
  }

  // Active subscription
  if (user.subscription_status === "active") {
    return true;
  }

  // Check if subscription ended but still within grace period
  if (user.subscription_status === "canceled" && user.subscription_ends_at) {
    return new Date() < new Date(user.subscription_ends_at);
  }

  return false;
}

/**
 * Get user's subscription details
 */
export async function getSubscriptionDetails(supabase: SupabaseClient, userId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('stripe_customer_id, stripe_subscription_id, polar_customer_id, polar_subscription_id, subscription_status, subscription_ends_at, subscription_created_at')
    .eq('id', userId)
    .single();

  return user || null;
}

/**
 * Get user's subscription tier
 * Returns 'free' or 'pro'
 */
export async function getSubscriptionTier(supabase: SupabaseClient, userId: string): Promise<'free' | 'pro'> {
  const hasSubscription = await hasActiveSubscription(supabase, userId);
  return hasSubscription ? 'pro' : 'free';
}
