"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

const BRAND = "#007a5e";

export function ShareLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/e/${token}` : `/e/${token}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
      <h2 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Share with client</h2>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 min-w-0 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 truncate"
          onFocus={(e) => e.currentTarget.select()}
        />
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-white text-sm shrink-0 transition-all hover:opacity-90 active:scale-95"
          style={{ background: BRAND }}
        >
          {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">Send this link to your client. They can Accept or Decline with one tap.</p>
    </div>
  );
}
