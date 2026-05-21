"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import EstimateActions from "./EstimateActions";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
};

const UNITS_LABOR = ["hr", "ea", "lf", "sf", "sq", "ls", "day"];
const UNITS_MATERIAL = ["ea", "lf", "sf", "box", "roll", "bag", "sheet", "gal", "sq"];

interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
}

interface Material {
  material_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  supplier_note: string;
}

interface Estimate {
  id: number;
  title: string;
  status: string;
  client_name: string | null;
  client_email: string | null;
  parsed_description: string | null;
  voice_transcript: string | null;
  total_labor_cost: number | string;
  total_material_cost: number | string;
  total_cost: number | string;
  created_at: string;
  client_responded_at?: string | null;
}

interface Props {
  estimate: Estimate;
  lineItems: LineItem[];
  materials: Material[];
}

function num(v: number | string) { return Number(v); }

export default function EstimateEditView({ estimate, lineItems: initLineItems, materials: initMaterials }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editable state
  const [title, setTitle] = useState(estimate.title);
  const [clientName, setClientName] = useState(estimate.client_name ?? "");
  const [clientEmail, setClientEmail] = useState(estimate.client_email ?? "");
  const [notes, setNotes] = useState(estimate.parsed_description ?? "");
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initLineItems.map((li) => ({ ...li, quantity: num(li.quantity), unit_cost: num(li.unit_cost), total_cost: num(li.total_cost) }))
  );
  const [materials, setMaterials] = useState<Material[]>(
    initMaterials.map((m) => ({ ...m, quantity: num(m.quantity), unit_price: num(m.unit_price), total_price: num(m.total_price), supplier_note: m.supplier_note ?? "" }))
  );

  // Live totals
  const laborTotal = lineItems.reduce((s, li) => s + li.total_cost, 0);
  const materialTotal = materials.reduce((s, m) => s + m.total_price, 0);
  const grandTotal = laborTotal + materialTotal;

  // Line item helpers
  function updateLI(i: number, field: keyof LineItem, val: string | number) {
    setLineItems((prev) => {
      const next = [...prev];
      const row = { ...next[i], [field]: val };
      if (field === "quantity" || field === "unit_cost") {
        row.total_cost = Math.round(Number(row.quantity) * Number(row.unit_cost) * 100) / 100;
      }
      next[i] = row;
      return next;
    });
  }
  function addLI() {
    setLineItems((p) => [...p, { description: "", quantity: 1, unit: "hr", unit_cost: 0, total_cost: 0 }]);
  }
  function removeLI(i: number) {
    setLineItems((p) => p.filter((_, idx) => idx !== i));
  }

  // Material helpers
  function updateMat(i: number, field: keyof Material, val: string | number) {
    setMaterials((prev) => {
      const next = [...prev];
      const row = { ...next[i], [field]: val };
      if (field === "quantity" || field === "unit_price") {
        row.total_price = Math.round(Number(row.quantity) * Number(row.unit_price) * 100) / 100;
      }
      next[i] = row;
      return next;
    });
  }
  function addMat() {
    setMaterials((p) => [...p, { material_name: "", quantity: 1, unit: "ea", unit_price: 0, total_price: 0, supplier_note: "" }]);
  }
  function removeMat(i: number) {
    setMaterials((p) => p.filter((_, idx) => idx !== i));
  }

  function cancelEdit() {
    setTitle(estimate.title);
    setClientName(estimate.client_name ?? "");
    setClientEmail(estimate.client_email ?? "");
    setNotes(estimate.parsed_description ?? "");
    setLineItems(initLineItems.map((li) => ({ ...li, quantity: num(li.quantity), unit_cost: num(li.unit_cost), total_cost: num(li.total_cost) })));
    setMaterials(initMaterials.map((m) => ({ ...m, quantity: num(m.quantity), unit_price: num(m.unit_price), total_price: num(m.total_price), supplier_note: m.supplier_note ?? "" })));
    setEditing(false);
    setSaveError(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/estimates/${estimate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          client_name: clientName || null,
          client_email: clientEmail || null,
          parsed_description: notes || null,
          line_items: lineItems,
          materials,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setEditing(false);
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "border border-gray-200 rounded-[4px] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#007a5e]/30 focus:border-[#007a5e] w-full bg-white";
  const numInputCls = `${inputCls} text-right tabular-nums`;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">← Estimates</Link>
          {editing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full text-2xl font-bold text-gray-900 border-b-2 border-[#007a5e] bg-transparent focus:outline-none"
            />
          ) : (
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{title}</h1>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-[4px] text-xs font-medium uppercase tracking-wide ${STATUS_STYLES[estimate.status] ?? STATUS_STYLES.draft}`}>
              {estimate.status}
            </span>
            {editing ? (
              <div className="flex gap-2">
                <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name" className={`${inputCls} w-36`} />
                <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Client email" className={`${inputCls} w-48`} />
              </div>
            ) : (
              clientName && <span className="text-sm text-gray-500">{clientName}</span>
            )}
            <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(estimate.created_at), { addSuffix: true })}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {!editing ? (
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                onClick={() => setEditing(true)}
                className="h-9 px-4 text-sm font-medium border border-gray-200 hover:border-gray-300 bg-white text-gray-700 rounded-lg transition-colors"
              >
                Edit
              </button>
              <EstimateActions estimateId={String(estimate.id)} status={estimate.status} clientEmail={estimate.client_email ?? ""} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={cancelEdit} className="h-9 px-4 text-sm font-medium border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-9 px-4 text-sm font-semibold bg-[#007a5e] hover:bg-[#006b52] disabled:opacity-50 text-white rounded-lg uppercase tracking-wide transition-colors"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}
          {saveError && <p className="text-xs text-red-600">{saveError}</p>}
        </div>
      </div>

      {/* Accepted / Declined banners */}
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
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Labor &amp; Work</h2>
            {editing && (
              <button onClick={addLI} className="text-xs text-[#007a5e] hover:underline font-medium">+ Add row</button>
            )}
          </div>
          {lineItems.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">
              {editing ? "No line items — click \"+ Add row\" to add one." : "No line items"}
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-2.5">Description</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-3 py-2.5">Qty</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-3 py-2.5">Unit</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-3 py-2.5">Unit $</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-2.5">Total</th>
                  {editing && <th className="w-8" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lineItems.map((item, i) => (
                  <tr key={i} className="text-sm">
                    <td className="px-6 py-2">
                      {editing
                        ? <input value={item.description} onChange={(e) => updateLI(i, "description", e.target.value)} className={inputCls} placeholder="Description" />
                        : <span className="text-gray-900">{item.description}</span>}
                    </td>
                    <td className="px-3 py-2 w-20">
                      {editing
                        ? <input type="number" min={0} value={item.quantity} onChange={(e) => updateLI(i, "quantity", Number(e.target.value))} className={numInputCls} />
                        : <span className="block text-right text-gray-600 tabular-nums">{item.quantity.toLocaleString()}</span>}
                    </td>
                    <td className="px-3 py-2 w-20">
                      {editing
                        ? <select value={item.unit} onChange={(e) => updateLI(i, "unit", e.target.value)} className={`${inputCls} pr-1`}>
                            {UNITS_LABOR.map((u) => <option key={u}>{u}</option>)}
                          </select>
                        : <span className="text-gray-500">{item.unit}</span>}
                    </td>
                    <td className="px-3 py-2 w-28">
                      {editing
                        ? <input type="number" min={0} value={item.unit_cost} onChange={(e) => updateLI(i, "unit_cost", Number(e.target.value))} className={numInputCls} />
                        : <span className="block text-right text-gray-600 tabular-nums">${item.unit_cost.toLocaleString()}</span>}
                    </td>
                    <td className="px-6 py-2 text-right font-medium text-gray-900 tabular-nums w-28">
                      ${item.total_cost.toLocaleString()}
                    </td>
                    {editing && (
                      <td className="pr-3 py-2 w-8">
                        <button onClick={() => removeLI(i)} className="text-gray-300 hover:text-red-500 text-lg leading-none">×</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-100">
                  <td colSpan={editing ? 5 : 4} className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">Labor Subtotal</td>
                  <td className="px-6 py-3 text-right font-bold text-gray-900 tabular-nums">${laborTotal.toLocaleString()}</td>
                  {editing && <td />}
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Materials */}
        <div className="bg-white rounded-[6px] border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Materials</h2>
            {editing && (
              <button onClick={addMat} className="text-xs text-[#007a5e] hover:underline font-medium">+ Add row</button>
            )}
          </div>
          {materials.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">
              {editing ? "No materials — click \"+ Add row\" to add one." : "No materials"}
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-2.5">Item</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-3 py-2.5">Qty</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-3 py-2.5">Unit</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-3 py-2.5">Unit Cost</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-2.5">Total</th>
                  {editing && <th className="w-8" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {materials.map((item, i) => (
                  <tr key={i} className="text-sm">
                    <td className="px-6 py-2">
                      {editing ? (
                        <div className="space-y-1">
                          <input value={item.material_name} onChange={(e) => updateMat(i, "material_name", e.target.value)} className={inputCls} placeholder="Material name" />
                          <input value={item.supplier_note} onChange={(e) => updateMat(i, "supplier_note", e.target.value)} className={`${inputCls} text-xs text-gray-400`} placeholder="Supplier note (optional)" />
                        </div>
                      ) : (
                        <>
                          <span className="text-gray-900">{item.material_name}</span>
                          {item.supplier_note && <span className="text-xs text-gray-400 ml-2">· {item.supplier_note}</span>}
                        </>
                      )}
                    </td>
                    <td className="px-3 py-2 w-20">
                      {editing
                        ? <input type="number" min={0} value={item.quantity} onChange={(e) => updateMat(i, "quantity", Number(e.target.value))} className={numInputCls} />
                        : <span className="block text-right text-gray-600 tabular-nums">{item.quantity.toLocaleString()}</span>}
                    </td>
                    <td className="px-3 py-2 w-20">
                      {editing
                        ? <select value={item.unit} onChange={(e) => updateMat(i, "unit", e.target.value)} className={`${inputCls} pr-1`}>
                            {UNITS_MATERIAL.map((u) => <option key={u}>{u}</option>)}
                          </select>
                        : <span className="text-gray-500">{item.unit}</span>}
                    </td>
                    <td className="px-3 py-2 w-28">
                      {editing
                        ? <input type="number" min={0} value={item.unit_price} onChange={(e) => updateMat(i, "unit_price", Number(e.target.value))} className={numInputCls} />
                        : <span className="block text-right text-gray-600 tabular-nums">${item.unit_price.toLocaleString()}</span>}
                    </td>
                    <td className="px-6 py-2 text-right font-medium text-gray-900 tabular-nums w-28">
                      ${item.total_price.toLocaleString()}
                    </td>
                    {editing && (
                      <td className="pr-3 py-2 w-8">
                        <button onClick={() => removeMat(i)} className="text-gray-300 hover:text-red-500 text-lg leading-none">×</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-100">
                  <td colSpan={editing ? 5 : 4} className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">Material Subtotal</td>
                  <td className="px-6 py-3 text-right font-bold text-gray-900 tabular-nums">${materialTotal.toLocaleString()}</td>
                  {editing && <td />}
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Grand Total */}
        <div className="bg-[#065f46] rounded-[6px] p-6 flex items-center justify-between">
          <span className="text-white font-semibold">Grand Total</span>
          <span className="text-3xl font-bold text-white tabular-nums">${grandTotal.toLocaleString()}</span>
        </div>

        {/* Notes */}
        {(editing || notes) && (
          <div className="bg-white rounded-[6px] border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Notes</h2>
            {editing ? (
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Assumptions, exclusions, special conditions…"
                className="w-full rounded-[4px] border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007a5e]/30 focus:border-[#007a5e] resize-none"
              />
            ) : (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{notes}</p>
            )}
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
