"use client";

import { useEffect, useState } from "react";
import { Mic, Loader2, Check } from "lucide-react";

const BRAND = "#007a5e";

const WORDS = ["I", "need", "a", "30-square", "comp", "shingle", "tear-off", "and", "full", "re-roof."];

const ITEMS = [
  { label: "Tear-off & disposal", value: "$1,800" },
  { label: "Deck repair & inspection", value: "$650" },
  { label: "Architectural shingles", value: "$4,200" },
  { label: "Synthetic underlayment", value: "$720" },
  { label: "Drip edge & flashing", value: "$480" },
  { label: "Ridge vent & caps", value: "$540" },
  { label: "Install labor", value: "$3,600" },
];
const TOTAL = "$11,990";

const STEP_MS = 280;
const TOTAL_STEPS = 32;

export function DemoAnimation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % TOTAL_STEPS), STEP_MS);
    return () => clearInterval(t);
  }, []);

  // Scene windows
  const recording = step < 11;            // 0–10  record + transcribe
  const building = step >= 11 && step < 14; // 11–13 building
  const bid = step >= 14;                  // 14–31 finished bid

  const wordsShown = Math.min(WORDS.length, step + 1);
  const itemsShown = bid ? Math.min(ITEMS.length, step - 13) : 0;
  const showTotal = step >= 23;

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Step dots */}
      <div className="flex justify-center gap-2 mb-4">
        {[recording, building, bid].map((active, i) => (
          <span
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{ width: active ? 24 : 8, background: active ? BRAND : "#d1d5db" }}
          />
        ))}
      </div>

      <div className="relative h-80 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

        {/* SCENE 1 — Recording */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 transition-opacity duration-300"
          style={{ opacity: recording ? 1 : 0, pointerEvents: "none" }}
        >
          <div className="relative mb-5">
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: "rgba(0,122,94,0.25)" }}
            />
            <div
              className="relative w-16 h-16 rounded-full flex items-center justify-center text-white"
              style={{ background: BRAND }}
            >
              <Mic className="w-7 h-7" />
            </div>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Recording…</p>
          <p className="text-center text-gray-800 font-medium leading-snug min-h-[2.5rem]">
            {WORDS.slice(0, wordsShown).map((w, i) => (
              <span key={i}>{w} </span>
            ))}
            <span className="inline-block w-0.5 h-4 align-middle animate-pulse" style={{ background: BRAND }} />
          </p>
        </div>

        {/* SCENE 2 — Building */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300"
          style={{ opacity: building ? 1 : 0, pointerEvents: "none" }}
        >
          <Loader2 className="w-9 h-9 animate-spin mb-3" style={{ color: BRAND }} />
          <p className="text-sm font-semibold text-gray-500">Building your estimate…</p>
        </div>

        {/* SCENE 3 — Finished bid */}
        <div
          className="absolute inset-0 flex flex-col px-5 py-4 transition-opacity duration-300"
          style={{ opacity: bid ? 1 : 0, pointerEvents: "none" }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4" style={{ color: BRAND }} />
              <span className="text-sm font-black text-gray-900">Comp Shingle Re-Roof</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#dcfce7", color: "#15803d" }}>
              Ready
            </span>
          </div>

          <div className="flex-1 space-y-1">
            {ITEMS.map((it, i) => (
              <div
                key={it.label}
                className="flex items-center justify-between text-xs transition-all duration-200"
                style={{
                  opacity: i < itemsShown ? 1 : 0,
                  transform: i < itemsShown ? "translateY(0)" : "translateY(5px)",
                }}
              >
                <span className="text-gray-600">{it.label}</span>
                <span className="font-semibold text-gray-900">{it.value}</span>
              </div>
            ))}
          </div>

          <div
            className="mt-2.5 rounded-xl px-4 py-2.5 flex items-center justify-between text-white transition-all duration-300"
            style={{
              background: BRAND,
              opacity: showTotal ? 1 : 0,
              transform: showTotal ? "scale(1)" : "scale(0.96)",
            }}
          >
            <span className="text-sm font-bold">Total</span>
            <span className="text-xl font-black">{TOTAL}</span>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-3">Talk it through → done in ~90 seconds</p>
    </div>
  );
}
