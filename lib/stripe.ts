import Stripe from "stripe";

// Check if Stripe is configured
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith("sk_");
}

// Only initialize Stripe if configured
export const stripe = isStripeConfigured()
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-09-30.clover",
      typescript: true,
    })
  : null;
