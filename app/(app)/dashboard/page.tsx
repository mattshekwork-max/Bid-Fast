import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hasActiveSubscription } from "@/lib/subscription";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Mic, FileText, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

const BRAND = "#007a5e";
const FREE_LIMIT = 3;

function money(n: number | null | undefined): string {
  return `$${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function statusStyle(status: string): { bg: string; color: string; label: string } {
  switch (status) {
    case "accepted": return { bg: "#dcfce7", color: "#15803d", label: "Accepted" };
    case "declined": return { bg: "#fee2e2", color: "#b91c1c", label: "Declined" };
    case "sent":     return { bg: "#dbeafe", color: "#1d4ed8", label: "Sent" };
    default:          return { bg: "#f3f4f6", color: "#6b7280", label: "Draft" };
  }
}

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getSupabaseAdmin();

  const { data: estimates } = await admin
    .from("estimates")
    .select("id, title, status, total_cost, client_name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = estimates ?? [];
  const subscribed = await hasActiveSubscription(admin, user.id);
  const used = list.length;
  const remaining = Math.max(0, FREE_LIMIT - used);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Your Estimates</h1>
            <p className="text-gray-500 text-sm mt-1">{used} total</p>
          </div>
          <Link
            href="/estimates/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white text-sm shadow-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: BRAND }}
          >
            <Mic className="w-4 h-4" /> New Estimate
          </Link>
        </div>

        {/* Free usage banner */}
        {!subscribed && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {remaining > 0
                ? <><span className="font-bold text-gray-900">{remaining}</span> of {FREE_LIMIT} free estimates remaining</>
                : <>You&apos;ve used all {FREE_LIMIT} free estimates.</>}
            </p>
            <Link href="/upgrade" className="text-sm font-bold inline-flex items-center gap-1" style={{ color: BRAND }}>
              Upgrade to Pro <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Estimates list */}
        {list.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "#ecfdf5" }}>
              <FileText className="w-7 h-7" style={{ color: BRAND }} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">No estimates yet</h2>
            <p className="text-gray-500 text-sm mb-6">Record a job walkthrough and we&apos;ll build your first estimate.</p>
            <Link
              href="/estimates/new"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: BRAND }}
            >
              <Mic className="w-4 h-4" /> Record Your First Estimate
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((e) => {
              const s = statusStyle(e.status);
              return (
                <Link
                  key={e.id}
                  href={`/dashboard/estimates/${e.id}`}
                  className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 truncate">{e.title}</h3>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {e.client_name ? `${e.client_name} · ` : ""}
                        {new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-gray-900">{money(e.total_cost)}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
