"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FREE_TIER_LIMIT } from "@/lib/stripe";

interface Props {
  subscriptionStatus: string;
  estimateCount: number;
  subscriptionEndsAt?: string | null;
}

export default function BillingCard({ subscriptionStatus, estimateCount, subscriptionEndsAt }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPro = subscriptionStatus === "pro";
  const isPastDue = subscriptionStatus === "past_due";
  const used = estimateCount;
  const pct = Math.min(100, Math.round((used / FREE_TIER_LIMIT) * 100));

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  async function handlePortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <Card className="rounded-[6px]">
      <CardHeader>
        <CardTitle>Billing &amp; Plan</CardTitle>
        <CardDescription>Manage your subscription and usage.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Current plan badge */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Current plan</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-[4px] text-xs font-bold uppercase tracking-wide ${
                isPro ? "bg-[#007a5e]/10 text-[#007a5e]" : "bg-muted text-muted-foreground"
              }`}>
                {isPro ? "Pro" : isPastDue ? "Past Due" : "Free"}
              </span>
              {isPro && <span className="text-xs text-muted-foreground">Unlimited estimates</span>}
            </div>
          </div>
          {isPro && subscriptionEndsAt && (
            <p className="text-xs text-muted-foreground">
              Renews {new Date(subscriptionEndsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>

        {/* Free tier usage bar */}
        {!isPro && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimates used</span>
              <span className={`font-semibold ${used >= FREE_TIER_LIMIT ? "text-destructive" : "text-foreground"}`}>
                {used} / {FREE_TIER_LIMIT}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-amber-500" : "bg-[#007a5e]"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {used >= FREE_TIER_LIMIT && (
              <p className="text-xs text-destructive font-medium">
                You&apos;ve reached the free limit. Upgrade to create unlimited estimates.
              </p>
            )}
          </div>
        )}

        {/* What's included */}
        <div className="rounded-[6px] border border-border p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {isPro ? "Pro includes" : "Upgrade to Pro"}
          </p>
          {[
            "Unlimited estimates",
            "Per-user pricing config",
            "Company branding on estimates",
            "Email delivery to clients",
            "PDF export",
            "Priority support",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${isPro ? "bg-[#007a5e]/10 text-[#007a5e]" : "bg-muted text-muted-foreground"}`}>
                ✓
              </span>
              <span className={isPro ? "text-foreground" : "text-muted-foreground"}>{feature}</span>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {isPastDue && (
          <div className="p-3 rounded-[6px] bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            Your last payment failed. Update your payment method to keep Pro access.
          </div>
        )}

        <div className="flex gap-3">
          {!isPro ? (
            <Button
              onClick={handleUpgrade}
              disabled={loading}
              className="rounded-[6px] font-semibold bg-[#007a5e] hover:bg-[#006b52]"
            >
              {loading ? "Redirecting…" : "Upgrade to Pro"}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handlePortal}
              disabled={loading}
              className="rounded-[6px]"
            >
              {loading ? "Loading…" : "Manage Subscription"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
