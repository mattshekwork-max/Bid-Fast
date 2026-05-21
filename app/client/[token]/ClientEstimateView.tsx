"use client";

import { useState } from "react";
import type { Estimate, EstimateLineItem, MaterialListItem } from "@/db/schema";

interface ContractorProfile {
  company_name?: string | null;
  company_phone?: string | null;
  company_address?: string | null;
  company_logo_url?: string | null;
  company_website?: string | null;
  company_license?: string | null;
}

interface Props {
  estimate: Estimate;
  lineItems: EstimateLineItem[];
  materials: MaterialListItem[];
  contractor: ContractorProfile;
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-gray-100 text-gray-600" },
  sent: { label: "Pending your response", cls: "bg-blue-100 text-blue-700" },
  accepted: { label: "Accepted", cls: "bg-green-100 text-green-700" },
  declined: { label: "Declined", cls: "bg-red-100 text-red-700" },
};

export default function ClientEstimateView({ estimate, lineItems, materials, contractor }: Props) {
  const [responding, setResponding] = useState(false);
  const [responseResult, setResponseResult] = useState<"accepted" | "declined" | null>(
    (estimate.client_response as "accepted" | "declined" | null) ?? null
  );
  const [error, setError] = useState<string | null>(null);

  const status = responseResult ?? estimate.status;
  const statusInfo = STATUS_LABEL[status] ?? STATUS_LABEL.sent;
  const canRespond = !responseResult && estimate.status !== "accepted" && estimate.status !== "declined";

  async function respond(response: "accepted" | "declined") {
    setResponding(true);
    setError(null);
    try {
      const res = await fetch(`/api/estimates/${estimate.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: estimate.client_token, response }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setResponseResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setResponding(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            {/* Company branding */}
            {contractor.company_logo_url ? (
              <img
                src={contractor.company_logo_url}
                alt={contractor.company_name ?? "Company logo"}
                className="h-12 object-contain mb-3"
              />
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-[6px] bg-[#065f46] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {contractor.company_name ? contractor.company_name.slice(0, 2).toUpperCase() : "BF"}
                  </span>
                </div>
                <span className="font-bold text-[#065f46]">{contractor.company_name ?? "Bid.Fast"}</span>
              </div>
            )}
            {contractor.company_name && contractor.company_logo_url && (
              <p className="font-bold text-[#065f46] mb-1">{contractor.company_name}</p>
            )}
            {(contractor.company_phone || contractor.company_address) && (
              <div className="text-xs text-gray-500 space-y-0.5 mb-2">
                {contractor.company_phone && <p>{contractor.company_phone}</p>}
                {contractor.company_address && <p>{contractor.company_address}</p>}
                {contractor.company_license && <p>Lic# {contractor.company_license}</p>}
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900 mt-3">{estimate.title}</h1>
            {estimate.client_name && <p className="text-sm text-gray-500 mt-1">Prepared for {estimate.client_name}</p>}
          </div>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-[4px] text-xs font-semibold uppercase tracking-wide ${statusInfo.cls}`}>
            {statusInfo.label}
          </span>
        </div>

        <div className="space-y-6">
          {/* Line Items */}
          {lineItems.length > 0 && (
            <div className="bg-white rounded-[6px] border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Labor &amp; Work</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-2.5">Description</th>
                    <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-2.5">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lineItems.map((item) => (
                    <tr key={item.id} className="text-sm">
                      <td className="px-6 py-3 text-gray-900">
                        {item.description}
                        <span className="text-gray-400 ml-2 text-xs">{Number(item.quantity)} {item.unit}</span>
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-gray-900 tabular-nums">${Number(item.total_cost).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-100">
                    <td className="px-6 py-3 text-sm font-semibold text-gray-700">Labor Subtotal</td>
                    <td className="px-6 py-3 text-right font-bold text-gray-900 tabular-nums">${Number(estimate.total_labor_cost).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Materials */}
          {materials.length > 0 && (
            <div className="bg-white rounded-[6px] border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Materials</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-2.5">Item</th>
                    <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-2.5">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {materials.map((item) => (
                    <tr key={item.id} className="text-sm">
                      <td className="px-6 py-3 text-gray-900">
                        {item.material_name}
                        <span className="text-gray-400 ml-2 text-xs">{Number(item.quantity)} {item.unit}</span>
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-gray-900 tabular-nums">${Number(item.total_price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-100">
                    <td className="px-6 py-3 text-sm font-semibold text-gray-700">Material Subtotal</td>
                    <td className="px-6 py-3 text-right font-bold text-gray-900 tabular-nums">${Number(estimate.total_material_cost).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Grand Total */}
          <div className="bg-[#065f46] rounded-[6px] p-6 flex items-center justify-between">
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

          {/* Response buttons */}
          {canRespond && (
            <div className="bg-white rounded-[6px] border border-gray-200 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-2">Ready to proceed?</h2>
              <p className="text-sm text-gray-500 mb-6">Accept this estimate to get the job scheduled, or decline if you&apos;d like to discuss.</p>
              {error && (
                <div className="p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-700 text-sm mb-4">{error}</div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => respond("declined")}
                  disabled={responding}
                  className="flex-1 h-11 text-sm font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-700 rounded-[6px] transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={() => respond("accepted")}
                  disabled={responding}
                  className="flex-1 h-11 text-sm font-semibold bg-[#007a5e] hover:bg-[#006b52] disabled:opacity-50 text-white rounded-[6px] uppercase tracking-wide transition-colors"
                >
                  {responding ? "Submitting…" : "Accept Estimate"}
                </button>
              </div>
            </div>
          )}

          {/* Post-response message */}
          {responseResult === "accepted" && (
            <div className="p-6 rounded-[6px] bg-green-50 border border-green-200 text-center">
              <p className="text-2xl mb-2">✓</p>
              <p className="font-semibold text-green-800 text-lg">Estimate Accepted</p>
              <p className="text-sm text-green-700 mt-1">You&apos;ll hear from us shortly to get scheduled.</p>
            </div>
          )}
          {responseResult === "declined" && (
            <div className="p-6 rounded-[6px] bg-gray-100 border border-gray-200 text-center">
              <p className="font-semibold text-gray-700 text-lg">Estimate Declined</p>
              <p className="text-sm text-gray-500 mt-1">Thanks for letting us know. Feel free to reach out if you&apos;d like to revisit.</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-12">Powered by Bid.Fast · Built with HeiloTech</p>
      </div>
    </div>
  );
}
