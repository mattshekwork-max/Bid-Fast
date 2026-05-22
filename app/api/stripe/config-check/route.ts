import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/stripe";

// GET /api/stripe/config-check
// Returns whether Stripe is properly configured
export async function GET() {
  return NextResponse.json({
    configured: isStripeConfigured()
  });
}
