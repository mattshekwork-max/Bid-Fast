import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { RespondButtons } from "./RespondButtons";

export const dynamic = "force-dynamic";

const BRAND = "#007a5e";

function money(n: number | null | undefined): string {
  const v = Number(n) || 0;
  const abs = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v < 0 ? `-$${abs}` : `$${abs}`;
}

export default async function PublicEstimate({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = getSupabaseAdmin();

  const { data: estimate } = await admin
    .from("estimates")
    .select("*")
    .eq("client_token", token)
    .maybeSingle();

  if (!estimate) notFound();

  const { data: businessUser } = await admin
    .from("users")
    .select("first_name, last_name")
    .eq("id", estimate.user_id)
    .maybeSingle();

  const { data: lineItems } = await admin
    .from("estimate_line_items")
    .select("*")
    .eq("estimate_id", estimate.id)
    .order("sort_order");

  const labor = (lineItems ?? []).filter((i) => i.item_type === "labor");
  const materials = (lineItems ?? []).filter((i) => i.item_type === "material");
  const adjustments = (lineItems ?? []).filter((i) => i.item_type === "adjustment");
  const contractor = [businessUser?.first_name, businessUser?.last_name].filter(Boolean).join(" ");

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Brand header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: BRAND }}>
            <span className="text-white text-sm font-black">B</span>
          </div>
          <span className="font-bold text-lg text-gray-900">Bid<span style={{ color: BRAND }}>.Fast</span></span>
        </div>

        {/* Estimate */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Estimate</p>
          <h1 className="text-2xl font-black text-gray-900 mb-2">{estimate.title}</h1>
          {contractor && <p className="text-sm text-gray-500">Prepared by {contractor}</p>}
          {estimate.parsed_description && (
            <p className="text-gray-600 text-sm leading-relaxed mt-3">{estimate.parsed_description}</p>
          )}
        </div>

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
          </div>
        )}

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
          </div>
        )}

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
        <div className="rounded-2xl p-6 mb-6 text-white flex items-center justify-between" style={{ background: BRAND }}>
          <span className="text-lg font-bold">Total</span>
          <span className="text-3xl font-black">{money(estimate.total_cost)}</span>
        </div>

        {/* Response */}
        {estimate.client_response ? (
          <div
            className="rounded-xl p-5 text-center"
            style={
              estimate.client_response === "accepted"
                ? { background: "#dcfce7", color: "#15803d" }
                : { background: "#fee2e2", color: "#b91c1c" }
            }
          >
            <p className="font-bold">
              You {estimate.client_response} this estimate
              {estimate.client_responded_at
                ? ` on ${new Date(estimate.client_responded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                : ""}.
            </p>
          </div>
        ) : (
          <RespondButtons token={token} />
        )}

        <p className="text-center text-xs text-gray-400 mt-8">Powered by Bid.Fast</p>
      </div>
    </div>
  );
}
