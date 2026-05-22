import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";

// Single paid plan ("Pro" — $29/mo). Uses the $29 price already configured
// in STRIPE_SOLO_PRICE_ID. Falls back to legacy vars if that's unset.
const PRO_PRICE_ID =
  process.env.STRIPE_SOLO_PRICE_ID ??
  process.env.STRIPE_PRICE_ID ??
  process.env.STRIPE_PRO_PRICE_ID;

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

    const priceId = PRO_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price not configured. Set STRIPE_SOLO_PRICE_ID." },
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
      metadata: { userId: user.id, tier: "pro" },
      client_reference_id: user.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[stripe/checkout]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
