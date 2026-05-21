import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { stripePost } from "@/lib/stripe";

export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRO_PRICE_ID) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: userData } = await admin
    .from("users")
    .select("stripe_customer_id, subscription_status")
    .eq("id", user.id)
    .single();

  // Already subscribed
  if (userData?.subscription_status === "pro") {
    return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const params: Record<string, string> = {
    "mode": "subscription",
    "line_items[0][price]": process.env.STRIPE_PRO_PRICE_ID,
    "line_items[0][quantity]": "1",
    "success_url": `${appUrl}/dashboard?upgraded=1`,
    "cancel_url": `${appUrl}/settings?tab=billing`,
    "metadata[user_id]": user.id,
    "allow_promotion_codes": "true",
  };

  // Attach existing customer or pre-fill email
  if (userData?.stripe_customer_id) {
    params["customer"] = userData.stripe_customer_id;
  } else if (user.email) {
    params["customer_email"] = user.email;
  }

  try {
    const session = await stripePost("/checkout/sessions", params);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Stripe error" }, { status: 500 });
  }
}
