import type { SupabaseClient } from "@supabase/supabase-js";
import { polar, isPolarConfigured } from "@/lib/polar";

/**
 * Ensure a Polar customer exists for a user.
 * Creates one if it doesn't exist, returns the customer ID.
 */
export async function ensurePolarCustomer(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  if (!isPolarConfigured() || !polar) {
    throw new Error(
      "Polar is not configured. Add your POLAR_ACCESS_TOKEN to .env to enable billing."
    );
  }

  try {
    // Check if user already has a Polar customer ID
    const { data: user } = await supabase
      .from("users")
      .select("polar_customer_id")
      .eq("id", userId)
      .single();

    if (user?.polar_customer_id) {
      return user.polar_customer_id;
    }

    // Create new Polar customer using native externalId mapping
    const customer = await polar.customers.create({
      email,
      name: name || undefined,
      externalId: userId,
    });

    // Save customer ID to database
    await supabase
      .from("users")
      .update({ polar_customer_id: customer.id })
      .eq("id", userId);

    console.log(
      `[POLAR] Created customer ${customer.id} for user ${userId}`
    );

    return customer.id;
  } catch (error) {
    console.error("[POLAR] Error ensuring customer:", error);
    throw error;
  }
}
