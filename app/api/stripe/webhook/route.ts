import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyStripeWebhook } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  if (!verifyStripeWebhook(payload, signature, process.env.STRIPE_WEBHOOK_SECRET)) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const obj = event.data.object;

  switch (event.type) {
    case "checkout.session.completed": {
      const userId = obj.metadata && (obj.metadata as Record<string, string>).user_id;
      const customerId = obj.customer as string;
      const subscriptionId = obj.subscription as string;
      if (!userId) break;

      await admin.from("users").update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_status: "pro",
        subscription_created_at: new Date().toISOString(),
      }).eq("id", userId);
      break;
    }

    case "customer.subscription.updated": {
      const customerId = obj.customer as string;
      const status = obj.status as string;
      const cancelAt = obj.cancel_at as number | null;
      const currentPeriodEnd = obj.current_period_end as number;

      const subStatus = status === "active" ? "pro" : status === "past_due" ? "past_due" : "free";

      await admin.from("users").update({
        subscription_status: subStatus,
        subscription_ends_at: cancelAt
          ? new Date(cancelAt * 1000).toISOString()
          : new Date(currentPeriodEnd * 1000).toISOString(),
      }).eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.deleted": {
      const customerId = obj.customer as string;
      await admin.from("users").update({
        subscription_status: "free",
        stripe_subscription_id: null,
        subscription_ends_at: null,
      }).eq("stripe_customer_id", customerId);
      break;
    }

    case "invoice.payment_failed": {
      const customerId = obj.customer as string;
      await admin.from("users").update({
        subscription_status: "past_due",
      }).eq("stripe_customer_id", customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
