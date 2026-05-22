import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ShareLink } from "./ShareLink";

export const dynamic = "force-dynamic";

const BRAND = "#007a5e";

function money(n: number | null | undefined): string {
  const v = Number(n) || 0;
  const abs = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v < 0 ? `-$${abs}` : `$${abs}`;
}

function statusStyle(status: string): { bg: string; color: string; label: string } {
  switch (status) {
    case "accepted": return { bg: "#dcfce7", color: "#15803d", label: "Accepted" };
    case "declined": return { bg: "#fee2e2", color: "#b91c1c", label: "Declined" };
    case "sent":     return { bg: "#dbeafe", color: "#1d4ed8", label: "Sent" };
    default:          return { bg: "#f3f4f6", color: "#6b7280", label: "Draft" };
  }
}

export default async function EstimateView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getSupabaseAdmin();

  const { data: estimate } = await admin
    .from("estimates")
    .select("*")
    .eq("id", id)
    .single();

  if (!estimate || estimate.user_id !== user.id) notFound();

  const { data: lineItems } = await admin
    .from("estimate_line_items")
    .select("*")
    .eq("estimate_id", estimate.id)
    .order("sort_order");

  const labor = (lineItems ?? []).filter((i) => i.item_type === "labor");
  const materials = (lineItems ?? []).filter((i) => i.item_type === "material");
  const adjustments = (lineItems ?? []).filter((i) => i.item_type === "adjustment");
  const s = statusStyle(estimate.status);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">

        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to estimates
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-2xl font-black text-gray-900">{estimate.title}</h1>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: s.bg, color: s.color }}>
              {s.label}
            </span>
          </div>
          {estimate.parsed_description && (
            <p className="text-gray-600 text-sm leading-relaxed">{estimate.parsed_description}</p>
          )}
          {(estimate.client_name || estimate.client_email) && (
            <p className="text-sm text-gray-500 mt-3">
              {estimate.client_name}{estimate.client_email ? ` · ${estimate.client_email}` : ""}
            </p>
          )}
        </div>

        {/* Labor */}
        {labor.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Labor</h2>
            <div className="divide-y divide-gray-100">
              {labor.map((i) => (
                <div key={i.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="text-gray-800 truncate">{i.description}</p>
                    <p className="text-gray-400 text-xs">{Number(i.quantity)} {i.unit} × {money(i.unit_cost)}</p>
                  </div>
                  <span className="font-semibold text-gray-900 shrink-0 ml-4">{money(i.total_cost)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-3 mt-1 text-sm font-bold">
              <span className="text-gray-500">Labor subtotal</span>
              <span className="text-gray-900">{money(estimate.total_labor_cost)}</span>
            </div>
          </div>
        )}

        {/* Materials */}
        {materials.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Materials</h2>
            <div className="divide-y divide-gray-100">
              {materials.map((i) => (
                <div key={i.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="text-gray-800 truncate">{i.description}</p>
                    <p className="text-gray-400 text-xs">{Number(i.quantity)} {i.unit} × {money(i.unit_cost)}</p>
                  </div>
                  <span className="font-semibold text-gray-900 shrink-0 ml-4">{money(i.total_cost)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-3 mt-1 text-sm font-bold">
              <span className="text-gray-500">Materials subtotal</span>
              <span className="text-gray-900">{money(estimate.total_material_cost)}</span>
            </div>
          </div>
        )}

        {/* Adjustments */}
        {adjustments.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Adjustments</h2>
            <div className="divide-y divide-gray-100">
              {adjustments.map((i) => (
                <div key={i.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-gray-800">{i.description}</span>
                  <span className="font-semibold text-gray-900">{money(i.total_cost)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="rounded-2xl p-6 mb-4 text-white flex items-center justify-between" style={{ background: BRAND }}>
          <span className="text-lg font-bold">Total</span>
          <span className="text-3xl font-black">{money(estimate.total_cost)}</span>
        </div>

        {/* Share with client */}
        {estimate.client_token && <ShareLink token={estimate.client_token} />}

        {/* Transcript */}
        {estimate.voice_transcript && (
          <details className="bg-white rounded-2xl border border-gray-200 p-6">
            <summary className="text-xs font-bold uppercase tracking-wide text-gray-400 cursor-pointer">Original walkthrough</summary>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">{estimate.voice_transcript}</p>
          </details>
        )}
      </div>
    </div>
  );
}
