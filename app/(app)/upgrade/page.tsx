"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Mic, FileText, Send, Users } from "lucide-react";

const BRAND = "#007a5e";

const SOLO_FEATURES = [
  "Unlimited estimates — no monthly cap",
  "PDF export with your company branding",
  "Email delivery to clients",
  "Client Accept / Decline link",
  "Priority support",
];

const PRO_FEATURES = [
  "Everything in Solo",
  "Team seats (+$10/mo per contractor)",
  "Per-user pricing configuration",
  "Shared estimate dashboard",
  "Seat billing management",
];

export default function UpgradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<"solo" | "pro" | null>(null);

  async function handleCheckout(tier: "solo" | "pro") {
    setLoading(tier);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong. Please try again.");
        setLoading(null);
      }
    } catch {
      alert("Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] px-4 py-16">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: BRAND }}>Upgrade Bid.Fast</p>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            One estimate won pays for<br />a year of Pro.
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            You&apos;ve used your free estimates. Pick the plan that fits your business and keep bidding.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">

          {/* Solo */}
          <div className="bg-white rounded-2xl border-2 p-8 flex flex-col relative" style={{ borderColor: BRAND }}>
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: BRAND }}>
              Most Popular
            </div>
            <p className="text-sm font-bold uppercase tracking-wide mb-1" style={{ color: BRAND }}>Solo</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-5xl font-black text-gray-900">$29</span>
              <span className="text-gray-400 font-medium">/mo</span>
            </div>
            <p className="text-sm text-gray-400 mb-8">Perfect for independent contractors</p>

            <ul className="space-y-3 mb-10 flex-1">
              {SOLO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-3 text-sm text-gray-700">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: BRAND }} />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout("solo")}
              disabled={loading !== null}
              className="w-full py-4 rounded-xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
              style={{ background: BRAND }}
            >
              {loading === "solo" ? "Redirecting…" : "Start Solo — $29/mo →"}
            </button>
          </div>

          {/* Pro */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 flex flex-col">
            <p className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-1">Pro</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-5xl font-black text-white">$49</span>
              <span className="text-gray-500 font-medium">/mo</span>
            </div>
            <p className="text-sm text-gray-500 mb-8">For growing teams and multi-crew operations</p>

            <ul className="space-y-3 mb-10 flex-1">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                  <Check className="w-4 h-4 shrink-0 mt-0.5 text-green-400" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout("pro")}
              disabled={loading !== null}
              className="w-full py-4 rounded-xl font-bold text-gray-900 bg-white text-base transition-all hover:bg-gray-100 active:scale-95 disabled:opacity-60"
            >
              {loading === "pro" ? "Redirecting…" : "Start Pro — $49/mo →"}
            </button>
          </div>
        </div>

        {/* Trust signals */}
        <div className="grid grid-cols-3 gap-4 text-center mb-10">
          {[
            { icon: Mic, label: "Voice-first estimating" },
            { icon: FileText, label: "Branded PDF export" },
            { icon: Send, label: "Client accept / decline" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="bg-white rounded-xl p-4 border border-gray-200">
              <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: BRAND }} />
              <p className="text-xs font-semibold text-gray-600">{label}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mb-8">
          Cancel anytime · No setup fees · Secure checkout via Stripe
        </p>

        <div className="text-center">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Go back
          </button>
        </div>
      </div>
    </div>
  );
}
