import { Webhooks } from "@polar-sh/nextjs";
import { getSupabaseAdmin } from "@/lib/supabase";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (event) => {
    const supabase = getSupabaseAdmin();

    switch (event.type) {
      case "subscription.created":
      case "subscription.active": {
        const subscription = event.data;
        const customerId = subscription.customerId;

        // Look up user by Polar customer ID
        const { data: users } = await supabase
          .from("users")
          .select("id")
          .eq("polar_customer_id", customerId)
          .limit(1);

        if (!users || users.length === 0) {
          console.error(
            "[POLAR WEBHOOK] User not found for customer:",
            customerId
          );
          break;
        }

        await supabase
          .from("users")
          .update({
            polar_subscription_id: subscription.id,
            subscription_status: "active",
            subscription_created_at: new Date().toISOString(),
          })
          .eq("polar_customer_id", customerId);

        console.log(
          "[POLAR WEBHOOK] Subscription activated for customer:",
          customerId
        );
        break;
      }

      case "subscription.updated": {
        const subscription = event.data;
        const customerId = subscription.customerId;

        const { data: users } = await supabase
          .from("users")
          .select("id")
          .eq("polar_customer_id", customerId)
          .limit(1);

        if (!users || users.length === 0) {
          console.error(
            "[POLAR WEBHOOK] User not found for customer:",
            customerId
          );
          break;
        }

        const status = subscription.status === "active" ? "active" : subscription.status;
        const endDate = subscription.currentPeriodEnd
          ? new Date(subscription.currentPeriodEnd).toISOString()
          : null;

        await supabase
          .from("users")
          .update({
            subscription_status: status,
            subscription_ends_at: endDate,
          })
          .eq("polar_customer_id", customerId);

        console.log(
          "[POLAR WEBHOOK] Subscription updated for customer:",
          customerId
        );
        break;
      }

      case "subscription.canceled": {
        const subscription = event.data;
        const customerId = subscription.customerId;

        const { data: users } = await supabase
          .from("users")
          .select("id")
          .eq("polar_customer_id", customerId)
          .limit(1);

        if (!users || users.length === 0) {
          console.error(
            "[POLAR WEBHOOK] User not found for customer:",
            customerId
          );
          break;
        }

        const endDate = subscription.currentPeriodEnd
          ? new Date(subscription.currentPeriodEnd).toISOString()
          : new Date().toISOString();

        await supabase
          .from("users")
          .update({
            subscription_status: "canceled",
            subscription_ends_at: endDate,
          })
          .eq("polar_customer_id", customerId);

        console.log(
          "[POLAR WEBHOOK] Subscription canceled for customer:",
          customerId
        );
        break;
      }

      case "subscription.revoked": {
        const subscription = event.data;
        const customerId = subscription.customerId;

        const { data: users } = await supabase
          .from("users")
          .select("id")
          .eq("polar_customer_id", customerId)
          .limit(1);

        if (!users || users.length === 0) {
          console.error(
            "[POLAR WEBHOOK] User not found for customer:",
            customerId
          );
          break;
        }

        await supabase
          .from("users")
          .update({
            subscription_status: "canceled",
            subscription_ends_at: new Date().toISOString(),
          })
          .eq("polar_customer_id", customerId);

        console.log(
          "[POLAR WEBHOOK] Subscription revoked for customer:",
          customerId
        );
        break;
      }

      default:
        console.log(`[POLAR WEBHOOK] Unhandled event type: ${event.type}`);
    }
  },
});
