import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";

// Tier → Stripe Price ID mapping
const PRICE_IDS: Record<string, string | undefined> = {
  solo: process.env.STRIPE_SOLO_PRICE_ID,
  pro:  process.env.STRIPE_PRO_PRICE_ID ?? process.env.STRIPE_PRICE_ID, // fallback for existing
};

export async function POST(req: NextRequest) {
  try {
    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured. Please add your Stripe API keys." },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve tier from body (default "pro" for backward compatibility)
    let tier: "solo" | "pro" = "pro";
    try {
      const body = await req.json();
      if (body.tier === "solo" || body.tier === "pro") tier = body.tier;
    } catch {
      // no body — use default
    }

    const priceId = PRICE_IDS[tier];
    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe price not configured for tier: ${tier}` },
        { status: 503 }
      );
    }

    const { data: dbUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userError || !dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let customerId = dbUser.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await supabase.from("users").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?upgraded=true`,
      cancel_url:  `${origin}/upgrade?canceled=true`,
      metadata: { userId: user.id, tier },
      client_reference_id: user.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[stripe/checkout]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
