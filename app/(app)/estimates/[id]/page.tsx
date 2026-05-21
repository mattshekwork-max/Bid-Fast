import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";
import EstimateActions from "./EstimateActions";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
};

type Params = Promise<{ id: string }>;

export default async function EstimatePage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: estimate, error: estError } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (estError || !estimate) notFound();

  const { data: lineItems } = await supabase
    .from("estimate_line_items")
    .select("*")
    .eq("estimate_id", id)
    .order("sort_order");

  const { data: materials } = await supabase
    .from("material_list_items")
    .select("*")
    .eq("estimate_id", id)
    .order("sort_order");

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">← Estimates</Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{estimate.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-[4px] text-xs font-medium uppercase tracking-wide ${STATUS_STYLES[estimate.status] ?? STATUS_STYLES.draft}`}>
              {estimate.status}
            </span>
            {estimate.client_name && (
              <span className="text-sm text-gray-500">{estimate.client_name}</span>
            )}
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(estimate.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
        <EstimateActions estimateId={id} status={estimate.status} clientEmail={estimate.client_email ?? ""} />
      </div>

      {estimate.status === "accepted" && (
        <div className="mb-6 p-4 rounded-[6px] bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
          ✓ Client accepted this estimate
          {estimate.client_responded_at && ` · ${formatDistanceToNow(new Date(estimate.client_responded_at), { addSuffix: true })}`}
        </div>
      )}
      {estimate.status === "declined" && (
        <div className="mb-6 p-4 rounded-[6px] bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          ✗ Client declined this estimate
          {estimate.client_responded_at && ` · ${formatDistanceToNow(new Date(estimate.client_responded_at), { addSuffix: true })}`}
        </div>
      )}

      <div className="grid gap-6">
        {/* Line Items */}
        <div className="bg-white rounded-[6px] border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Labor &amp; Work</h2>
          </div>
          {!lineItems || lineItems.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">No line items</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-2.5">Description</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-2.5">Qty</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-2.5">Unit</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-2.5">Unit $</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-2.5">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lineItems.map((item) => (
                  <tr key={item.id} className="text-sm">
                    <td className="px-6 py-3 text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-right text-gray-600 tabular-nums">{Number(item.quantity).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                    <td className="px-4 py-3 text-right text-gray-600 tabular-nums">${Number(item.unit_cost).toLocaleString()}</td>
                    <td className="px-6 py-3 text-right font-medium text-gray-900 tabular-nums">${Number(item.total_cost).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-100">
                  <td colSpan={4} className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">Labor Subtotal</td>
                  <td className="px-6 py-3 text-right font-bold text-gray-900 tabular-nums">${Number(estimate.total_labor_cost).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Materials */}
        <div className="bg-white rounded-[6px] border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Materials</h2>
          </div>
          {!materials || materials.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">No materials</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-2.5">Item</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-2.5">Qty</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-2.5">Unit</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-2.5">Unit Cost</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-2.5">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {materials.map((item) => (
                  <tr key={item.id} className="text-sm">
                    <td className="px-6 py-3">
                      <span className="text-gray-900">{item.material_name}</span>
                      {item.supplier_note && <span className="text-xs text-gray-400 ml-2">· {item.supplier_note}</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 tabular-nums">{Number(item.quantity).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                    <td className="px-4 py-3 text-right text-gray-600 tabular-nums">${Number(item.unit_price).toLocaleString()}</td>
                    <td className="px-6 py-3 text-right font-medium text-gray-900 tabular-nums">${Number(item.total_price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-100">
                  <td colSpan={4} className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">Material Subtotal</td>
                  <td className="px-6 py-3 text-right font-bold text-gray-900 tabular-nums">${Number(estimate.total_material_cost).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Grand Total */}
        <div className="bg-[#1E3A5F] rounded-[6px] p-6 flex items-center justify-between">
          <span className="text-white font-semibold">Grand Total</span>
          <span className="text-3xl font-bold text-white tabular-nums">${Number(estimate.total_cost).toLocaleString()}</span>
        </div>

        {/* Notes */}
        {estimate.parsed_description && (
          <div className="bg-white rounded-[6px] border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Notes</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{estimate.parsed_description}</p>
          </div>
        )}

        {/* Transcript */}
        {estimate.voice_transcript && (
          <details className="bg-white rounded-[6px] border border-gray-200 shadow-sm p-6">
            <summary className="font-semibold text-gray-900 cursor-pointer text-sm">View original transcript</summary>
            <p className="text-sm text-gray-600 leading-relaxed mt-3 whitespace-pre-wrap">{estimate.voice_transcript}</p>
          </details>
        )}
      </div>
    </div>
  );
}
