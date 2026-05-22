"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Mic, FileText, Send } from "lucide-react";

const BRAND = "#007a5e";

const PRO_FEATURES = [
  "Unlimited estimates — no monthly cap",
  "Voice-to-estimate in 90 seconds",
  "PDF export with your company branding",
  "Email delivery to clients",
  "Client Accept / Decline link",
  "Full Spanish (EN + ES) support",
  "Team seats — add contractors at $10/mo each",
  "Priority support",
];

export default function UpgradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] px-4 py-16">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: BRAND }}>Upgrade Bid.Fast</p>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            One estimate won pays for<br />a year of Pro.
          </h1>
          <p className="text-lg text-gray-500">
            You&apos;ve used your free estimates. Go unlimited and keep bidding.
          </p>
        </div>

        {/* Pro plan */}
        <div className="bg-white rounded-2xl border-2 p-8 flex flex-col relative" style={{ borderColor: BRAND }}>
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: BRAND }}>
            Most Popular
          </div>
          <p className="text-sm font-bold uppercase tracking-wide mb-1" style={{ color: BRAND }}>Pro</p>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-5xl font-black text-gray-900">$29</span>
            <span className="text-gray-400 font-medium">/mo</span>
          </div>
          <p className="text-sm text-gray-400 mb-8">Everything you need to win more bids</p>

          <ul className="space-y-3 mb-10 flex-1">
            {PRO_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-3 text-sm text-gray-700">
                <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: BRAND }} />
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ background: BRAND }}
          >
            {loading ? "Redirecting…" : "Go Pro — $29/mo →"}
          </button>
        </div>

        {/* Trust signals */}
        <div className="grid grid-cols-3 gap-4 text-center mt-8 mb-8">
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
