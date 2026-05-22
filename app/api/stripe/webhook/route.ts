import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import Stripe from "stripe";

// Disable caching and force dynamic rendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  console.log("[WEBHOOK] Received webhook request");
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        console.log("[WEBHOOK] checkout.session.completed", {
          sessionId: session.id,
          userId,
          customerId: session.customer,
          subscriptionId: session.subscription,
        });

        if (!userId) {
          console.error("[WEBHOOK] No userId in session metadata");
          break;
        }

        await supabase
          .from('users')
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_status: "active",
            subscription_created_at: new Date().toISOString(),
          })
          .eq('id', userId);

        console.log("[WEBHOOK] ✅ User subscription activated:", userId);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .limit(1);

        if (!users || users.length === 0) {
          console.error("User not found for customer:", customerId);
          break;
        }

        const endDate = subscription.cancel_at
          ? new Date(subscription.cancel_at * 1000).toISOString()
          : (subscription as any).current_period_end
          ? new Date((subscription as any).current_period_end * 1000).toISOString()
          : null;

        await supabase
          .from('users')
          .update({
            subscription_status: subscription.status as string,
            subscription_ends_at: endDate,
          })
          .eq('stripe_customer_id', customerId);

        console.log("[WEBHOOK] ✅ Subscription updated:", customerId);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .limit(1);

        if (!users || users.length === 0) {
          console.error("User not found for customer:", customerId);
          break;
        }

        await supabase
          .from('users')
          .update({
            subscription_status: "canceled",
            subscription_ends_at: new Date(subscription.ended_at! * 1000).toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        console.log("[WEBHOOK] ✅ Subscription canceled:", customerId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .limit(1);

        if (!users || users.length === 0) {
          console.error("User not found for customer:", customerId);
          break;
        }

        await supabase
          .from('users')
          .update({
            subscription_status: "past_due",
          })
          .eq('stripe_customer_id', customerId);

        console.log("[WEBHOOK] ⚠️ Payment failed for:", customerId);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
