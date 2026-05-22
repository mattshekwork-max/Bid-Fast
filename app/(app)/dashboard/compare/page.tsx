"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

const BRAND = "#007a5e";

type LaborItem = { description: string; quantity: number; unit: string; unitCost: number };
type Material = { name: string; quantity: number; unit: string; unitPrice: number };
type Estimate = { title: string; description?: string; laborItems: LaborItem[]; materials: Material[]; notes?: string };
type Totals = { labor: number; material: number; total: number };
type Result = { ok: boolean; model?: string; estimate?: Estimate; totals?: Totals; error?: string };

const SAMPLE =
  "Full kitchen remodel, about 200 square feet. New cabinets, 22 linear feet. Quartz countertops, 55 square feet. New sink, faucet, garbage disposal. Move the gas line for the range. Tile backsplash, 40 square feet. Six recessed lights plus under-cabinet LED. New LVP flooring. Demo and haul-off. Permit required.";

function money(n: number): string {
  return `$${(Number(n) || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function Column({ result }: { result: Result }) {
  if (!result.ok) {
    return (
      <div className="flex-1 rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-bold text-red-700 mb-1">Unavailable</p>
        <p className="text-xs text-red-600">{result.error}</p>
      </div>
    );
  }
  const e = result.estimate!;
  const t = result.totals!;
  return (
    <div className="flex-1 rounded-xl border border-gray-200 bg-white p-4 min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: BRAND }}>{result.model}</p>
      <h3 className="font-black text-gray-900 text-sm mb-3">{e.title}</h3>

      <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Labor</p>
      <div className="space-y-1 mb-3">
        {(e.laborItems ?? []).map((i, idx) => (
          <div key={idx} className="flex justify-between text-xs gap-2">
            <span className="text-gray-600 truncate">{i.description} <span className="text-gray-400">({i.quantity} {i.unit} × {money(i.unitCost)})</span></span>
            <span className="font-semibold text-gray-900 shrink-0">{money(i.quantity * i.unitCost)}</span>
          </div>
        ))}
      </div>

      <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Materials</p>
      <div className="space-y-1 mb-3">
        {(e.materials ?? []).map((m, idx) => (
          <div key={idx} className="flex justify-between text-xs gap-2">
            <span className="text-gray-600 truncate">{m.name} <span className="text-gray-400">({m.quantity} {m.unit} × {money(m.unitPrice)})</span></span>
            <span className="font-semibold text-gray-900 shrink-0">{money(m.quantity * m.unitPrice)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-2 space-y-0.5 text-xs">
        <div className="flex justify-between text-gray-500"><span>Labor</span><span>{money(t.labor)}</span></div>
        <div className="flex justify-between text-gray-500"><span>Materials</span><span>{money(t.material)}</span></div>
        <div className="flex justify-between font-black text-gray-900 text-sm pt-1"><span>Total</span><span>{money(t.total)}</span></div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const [transcript, setTranscript] = useState(SAMPLE);
  const [lang, setLang] = useState<"en" | "es">("en");
  const [loading, setLoading] = useState(false);
  const [groq, setGroq] = useState<Result | null>(null);
  const [gemini, setGemini] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    setGroq(null);
    setGemini(null);
    try {
      const res = await fetch("/api/estimates/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, language: lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Compare failed");
      setGroq(data.groq);
      setGemini(data.gemini);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Model Compare</h1>
        <p className="text-sm text-gray-500 mb-5">Same transcript, both models, side by side. Nothing is saved.</p>

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-gray-200 p-3 text-sm mb-3"
          placeholder="Paste or type a job walkthrough…"
        />

        <div className="flex items-center gap-3 mb-6">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
            {(["en", "es"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-4 py-2 text-sm font-bold"
                style={lang === l ? { background: BRAND, color: "white" } : { color: "#6b7280" }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={run}
            disabled={loading || !transcript.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-white text-sm disabled:opacity-60"
            style={{ background: BRAND }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? "Running both…" : "Compare"}
          </button>
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {(groq || gemini) && (
          <div className="flex flex-col md:flex-row gap-4">
            {groq && <Column result={groq} />}
            {gemini && <Column result={gemini} />}
          </div>
        )}
      </div>
    </div>
  );
}
