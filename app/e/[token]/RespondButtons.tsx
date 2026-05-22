"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";

const BRAND = "#007a5e";

export function RespondButtons({ token }: { token: string }) {
  const [loading, setLoading] = useState<"accepted" | "declined" | null>(null);
  const [done, setDone] = useState<"accepted" | "declined" | null>(null);
  const [error, setError] = useState("");

  async function respond(response: "accepted" | "declined") {
    setLoading(response);
    setError("");
    try {
      const res = await fetch("/api/estimates/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, response }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setDone(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(null);
    }
  }

  if (done === "accepted") {
    return (
      <div className="rounded-xl p-5 text-center" style={{ background: "#dcfce7", color: "#15803d" }}>
        <Check className="w-7 h-7 mx-auto mb-2" />
        <p className="font-bold">Estimate accepted — thank you!</p>
        <p className="text-sm opacity-80">The contractor has been notified.</p>
      </div>
    );
  }

  if (done === "declined") {
    return (
      <div className="rounded-xl p-5 text-center" style={{ background: "#fee2e2", color: "#b91c1c" }}>
        <X className="w-7 h-7 mx-auto mb-2" />
        <p className="font-bold">Estimate declined</p>
        <p className="text-sm opacity-80">The contractor has been notified.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => respond("accepted")}
          disabled={loading !== null}
          className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
          style={{ background: BRAND }}
        >
          {loading === "accepted" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          Accept
        </button>
        <button
          onClick={() => respond("declined")}
          disabled={loading !== null}
          className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-gray-700 bg-gray-100 text-base transition-all hover:bg-gray-200 active:scale-95 disabled:opacity-60"
        >
          {loading === "declined" ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
          Decline
        </button>
      </div>
      {error && <p className="text-sm text-red-500 text-center mt-3">{error}</p>}
    </div>
  );
}
