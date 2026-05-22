import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureStripeCustomer } from "@/lib/stripe-customer";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = await ensureStripeCustomer(supabase, user.id, user.email);

    return NextResponse.json({ customerId });
  } catch (error: any) {
    console.error("Error ensuring Stripe customer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create customer" },
      { status: 500 }
    );
  }
}
