import type { SupabaseClient } from "@supabase/supabase-js";
import { stripe, isStripeConfigured } from "@/lib/stripe";

/**
 * Ensure a Stripe customer exists for a user
 * Creates one if it doesn't exist, returns the customer ID
 */
export async function ensureStripeCustomer(supabase: SupabaseClient, userId: string, email: string, name?: string): Promise<string> {
  if (!isStripeConfigured || !stripe) {
    throw new Error("Stripe is not configured. Add your Stripe keys to .env to enable billing.");
  }

  try {
    // Check if user already has a Stripe customer ID
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (user?.stripe_customer_id) {
      return user.stripe_customer_id;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
      metadata: {
        userId,
      },
    });

    // Save customer ID to database
    await supabase
      .from('users')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);

    console.log(`[STRIPE] Created customer ${customer.id} for user ${userId}`);

    return customer.id;
  } catch (error) {
    console.error("[STRIPE] Error ensuring customer:", error);
    throw error;
  }
}
