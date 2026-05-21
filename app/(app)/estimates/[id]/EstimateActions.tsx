"use client";

import { useState } from "react";

interface Props {
  estimateId: string;
  status: string;
  clientEmail: string;
}

export default function EstimateActions({ estimateId, status, clientEmail }: Props) {
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ link?: string; error?: string } | null>(null);
  const [showMaterials, setShowMaterials] = useState(false);
  const [materials, setMaterials] = useState<{ material_name: string; quantity: number; unit: string; supplier_note?: string | null }[]>([]);
  const [copied, setCopied] = useState(false);

  async function handleSend() {
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch(`/api/estimates/${estimateId}/send`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Send failed");
      setSendResult({ link: json.clientUrl });
    } catch (err) {
      setSendResult({ error: err instanceof Error ? err.message : "Send failed" });
    } finally {
      setSending(false);
    }
  }

  async function handleExportMaterials() {
    const res = await fetch(`/api/estimates/${estimateId}/materials`);
    const json = await res.json();
    setMaterials(json.materials ?? []);
    setShowMaterials(true);
  }

  function handleDownloadPDF() {
    window.open(`/api/estimates/${estimateId}/pdf`, "_blank");
  }

  async function copyMaterials(format: "text" | "csv") {
    let text = "";
    if (format === "csv") {
      text = "Item,Qty,Unit,Supplier\n" + materials.map((m) => `"${m.material_name}",${m.quantity},${m.unit},"${m.supplier_note ?? ""}"`).join("\n");
    } else {
      text = materials.map((m) => `${m.material_name} — ${m.quantity} ${m.unit}${m.supplier_note ? ` (${m.supplier_note})` : ""}`).join("\n");
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Mark as exported
    await fetch(`/api/estimates/${estimateId}/materials`, { method: "PATCH" }).catch(() => {});
  }

  async function handleShare() {
    const text = materials.map((m) => `${m.material_name} — ${m.quantity} ${m.unit}`).join("\n");
    if (navigator.share) {
      await navigator.share({ title: "Material List", text });
      await fetch(`/api/estimates/${estimateId}/materials`, { method: "PATCH" }).catch(() => {});
    } else {
      await copyMaterials("text");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Send to Client */}
      {status !== "accepted" && status !== "declined" && (
        <div>
          <button
            onClick={handleSend}
            disabled={sending}
            className="h-9 px-4 text-sm font-medium bg-[#0C1F3D] hover:bg-[#071529] disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {sending ? "Sending…" : "Send to Client"}
          </button>
          {sendResult?.link && (
            <div className="mt-2 p-3 rounded-lg bg-green-50 border border-green-200 text-xs">
              <p className="text-green-700 font-medium mb-1">Link ready!</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={sendResult.link}
                  className="flex-1 text-green-800 bg-transparent text-xs truncate"
                />
                <button
                  onClick={() => { navigator.clipboard.writeText(sendResult.link!); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="text-green-600 hover:text-green-800 font-medium"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
          {sendResult?.error && (
            <p className="mt-2 text-xs text-red-600">{sendResult.error}</p>
          )}
        </div>
      )}

      {/* Export Materials */}
      <button
        onClick={handleExportMaterials}
        className="h-9 px-4 text-sm font-medium border border-gray-200 hover:border-gray-300 bg-white text-gray-700 rounded-lg transition-colors"
      >
        Export Materials
      </button>

      {/* Download PDF */}
      <button
        onClick={handleDownloadPDF}
        className="h-9 px-4 text-sm font-medium border border-gray-200 hover:border-gray-300 bg-white text-gray-700 rounded-lg transition-colors"
      >
        Download PDF
      </button>

      {/* Materials Sheet */}
      {showMaterials && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/40" onClick={() => setShowMaterials(false)}>
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Material List</h3>
              <button onClick={() => setShowMaterials(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {materials.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No materials in this estimate</p>
              ) : (
                <ul className="space-y-2">
                  {materials.map((m, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-900">{m.material_name}</span>
                      <span className="text-gray-500 tabular-nums">{m.quantity} {m.unit}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
              <button onClick={() => copyMaterials("text")} className="flex-1 h-9 text-sm font-medium border border-gray-200 hover:bg-gray-50 rounded-lg">
                {copied ? "Copied!" : "Copy Text"}
              </button>
              <button onClick={() => copyMaterials("csv")} className="flex-1 h-9 text-sm font-medium border border-gray-200 hover:bg-gray-50 rounded-lg">
                Copy CSV
              </button>
              <button onClick={handleShare} className="flex-1 h-9 text-sm font-medium bg-[#F97316] hover:bg-[#ea6c0a] text-white rounded-lg">
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
