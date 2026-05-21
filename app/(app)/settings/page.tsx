import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import AccountCard from "./AccountCard";
import BillingCard from "./BillingCard";
import CompanyCard from "./CompanyCard";
import PricingCard from "./PricingCard";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = getSupabaseAdmin();
  const [{ data: userData }, { count: estimateCount }] = await Promise.all([
    admin.from("users").select("subscription_status, subscription_ends_at").eq("id", user.id).single(),
    admin.from("estimates").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Settings</h1>

      <AccountCard email={user.email ?? ""} createdAt={user.created_at} />

      <BillingCard
        subscriptionStatus={userData?.subscription_status ?? "free"}
        estimateCount={estimateCount ?? 0}
        subscriptionEndsAt={userData?.subscription_ends_at}
      />

      <CompanyCard />
      <PricingCard />
    </div>
  );
}
