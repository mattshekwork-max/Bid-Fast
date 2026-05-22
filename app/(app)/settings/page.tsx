"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

const PAYMENT_PROVIDER = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || "stripe";

interface UserData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  subscription_status?: string;
  subscription_ends_at?: string;
  labor_rate?: number | null;
  markup_percent?: number | null;
  expense_flat?: number | null;
  discount_flat?: number | null;
  show_adjustments?: boolean | null;
  trade?: string | null;
}

interface PriceItem {
  id: number;
  item_name: string;
  unit: string;
  unit_price: number;
}

const BRAND = "#007a5e";

const TRADES = [
  "General Contractor", "Painter", "Concrete / Flatwork", "Plumber", "Electrician",
  "Paver / Hardscape", "Roofer", "HVAC", "Landscaper", "Carpenter / Framing",
  "Drywall", "Flooring", "Solar", "Fencing", "Other",
];

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estimate pricing defaults
  const [laborRate, setLaborRate] = useState("");
  const [markupPercent, setMarkupPercent] = useState("");
  const [expenseFlat, setExpenseFlat] = useState("");
  const [discountFlat, setDiscountFlat] = useState("");
  const [showAdjustments, setShowAdjustments] = useState(true);
  const [trade, setTrade] = useState("");
  const [savingPricing, setSavingPricing] = useState(false);

  // Price book
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [newItem, setNewItem] = useState({ item_name: "", unit: "each", unit_price: "" });
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUserEmail(user?.email || null);

        const response = await fetch("/api/users");
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        const u = data.user as UserData;
        setUserData(u);
        setLaborRate(u.labor_rate != null ? String(u.labor_rate) : "");
        setMarkupPercent(u.markup_percent != null ? String(u.markup_percent) : "");
        setExpenseFlat(u.expense_flat != null ? String(u.expense_flat) : "");
        setDiscountFlat(u.discount_flat != null ? String(u.discount_flat) : "");
        setShowAdjustments(u.show_adjustments !== false);
        setTrade(u.trade ?? "");

        const pbRes = await fetch("/api/price-book");
        if (pbRes.ok) {
          const pb = await pbRes.json();
          setPriceItems(pb.items ?? []);
        }
      } catch {
        setError("Failed to load user data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  async function addPriceItem() {
    if (!newItem.item_name.trim()) return;
    setAddingItem(true);
    try {
      const res = await fetch("/api/price-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Could not add"); return; }
      setPriceItems((prev) => [...prev, data.item].sort((a, b) => a.item_name.localeCompare(b.item_name)));
      setNewItem({ item_name: "", unit: "each", unit_price: "" });
    } catch {
      toast.error("Could not add item");
    } finally {
      setAddingItem(false);
    }
  }

  async function deletePriceItem(id: number) {
    const prev = priceItems;
    setPriceItems((p) => p.filter((i) => i.id !== id));
    const res = await fetch(`/api/price-book/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Could not remove"); setPriceItems(prev); }
  }

  async function savePricing() {
    setSavingPricing(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          labor_rate: laborRate,
          markup_percent: markupPercent,
          expense_flat: expenseFlat,
          discount_flat: discountFlat,
          show_adjustments: showAdjustments,
          trade,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not save");
        return;
      }
      toast.success("Estimate defaults saved");
    } catch {
      toast.error("Could not save settings");
    } finally {
      setSavingPricing(false);
    }
  }

  async function openBillingPortal() {
    setPortalLoading(true);
    try {
      const portalUrl =
        PAYMENT_PROVIDER === "polar"
          ? "/api/polar/create-portal-session"
          : "/api/stripe/create-portal-session";
      const res = await fetch(portalUrl, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not open billing portal");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading your settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <Card className="w-full max-w-md bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = userData?.subscription_status === "active";

  return (
    <div className="flex min-h-screen flex-col items-center p-6 md:p-24">
      <div className="w-full max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="mt-1">{userData?.email || userEmail}</p>
            </div>
            {userData?.first_name && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="mt-1">{userData.first_name} {userData.last_name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estimate Defaults */}
        <Card>
          <CardHeader>
            <CardTitle>Estimate Defaults</CardTitle>
            <CardDescription>
              Your rates and markups, applied automatically to every new estimate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Your trade</label>
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                className="mt-1 w-full sm:w-72 rounded-md border border-input bg-background py-2 px-3 text-sm outline-none"
              >
                <option value="">Select your trade…</option>
                {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <p className="text-xs text-muted-foreground mt-1">Tunes every estimate to your trade&apos;s units, line items, and rates.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Labor rate ($/hr)</label>
                <div className="mt-1 flex items-center rounded-md border border-input bg-background px-3">
                  <span className="text-muted-foreground text-sm">$</span>
                  <input
                    type="number" inputMode="decimal" min="0" step="1"
                    value={laborRate}
                    onChange={(e) => setLaborRate(e.target.value)}
                    placeholder="75"
                    className="w-full bg-transparent py-2 px-1 text-sm outline-none"
                  />
                  <span className="text-muted-foreground text-xs">/hr</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Profit / markup (%)</label>
                <div className="mt-1 flex items-center rounded-md border border-input bg-background px-3">
                  <input
                    type="number" inputMode="decimal" min="0" step="1"
                    value={markupPercent}
                    onChange={(e) => setMarkupPercent(e.target.value)}
                    placeholder="15"
                    className="w-full bg-transparent py-2 px-1 text-sm outline-none"
                  />
                  <span className="text-muted-foreground text-sm">%</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Expenses / gas ($)</label>
                <div className="mt-1 flex items-center rounded-md border border-input bg-background px-3">
                  <span className="text-muted-foreground text-sm">$</span>
                  <input
                    type="number" inputMode="decimal" min="0" step="1"
                    value={expenseFlat}
                    onChange={(e) => setExpenseFlat(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent py-2 px-1 text-sm outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Discount ($)</label>
                <div className="mt-1 flex items-center rounded-md border border-input bg-background px-3">
                  <span className="text-muted-foreground text-sm">$</span>
                  <input
                    type="number" inputMode="decimal" min="0" step="1"
                    value={discountFlat}
                    onChange={(e) => setDiscountFlat(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent py-2 px-1 text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showAdjustments}
                onChange={(e) => setShowAdjustments(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#007a5e]"
              />
              <span className="text-sm">
                <span className="font-medium">Show markup &amp; expenses on the client bid</span>
                <span className="block text-muted-foreground">
                  On: they appear as their own line items. Off: they&apos;re folded into the line prices, so the client only sees a higher total.
                </span>
              </span>
            </label>

            <Button onClick={savePricing} disabled={savingPricing} style={{ background: BRAND }}>
              {savingPricing ? "Saving…" : "Save defaults"}
            </Button>
          </CardContent>
        </Card>

        {/* Price Book */}
        <Card>
          <CardHeader>
            <CardTitle>Price Book</CardTitle>
            <CardDescription>
              Your real prices for materials &amp; equipment. The AI uses these exact rates when a job matches — so estimates reflect your costs, not guesses. Anything not listed is estimated for your trade.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {priceItems.length > 0 && (
              <div className="divide-y divide-border rounded-md border border-border">
                {priceItems.map((it) => (
                  <div key={it.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="font-medium truncate">{it.item_name}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-muted-foreground">${Number(it.unit_price).toLocaleString()} / {it.unit}</span>
                      <button
                        onClick={() => deletePriceItem(it.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Item</label>
                <input
                  value={newItem.item_name}
                  onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                  placeholder="e.g. Interior paint (Sherwin)"
                  className="mt-1 w-full rounded-md border border-input bg-background py-2 px-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Unit</label>
                <input
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  placeholder="gal"
                  className="mt-1 w-24 rounded-md border border-input bg-background py-2 px-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Price ($)</label>
                <input
                  type="number" inputMode="decimal" min="0"
                  value={newItem.unit_price}
                  onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
                  placeholder="55"
                  className="mt-1 w-28 rounded-md border border-input bg-background py-2 px-3 text-sm outline-none"
                />
              </div>
              <Button onClick={addPriceItem} disabled={addingItem || !newItem.item_name.trim()} style={{ background: BRAND }}>
                {addingItem ? "Adding…" : "Add"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Common big-ticket items (water heaters, HVAC units, panels, etc.) are already built in — add your trade&apos;s items or override any price here.
            </p>
          </CardContent>
        </Card>

        {/* Billing */}
        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
            <CardDescription>Manage your subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-muted-foreground">Plan</p>
              {isActive ? (
                <Badge variant="default">Active</Badge>
              ) : userData?.subscription_status === "canceled" ? (
                <Badge variant="secondary">Canceled</Badge>
              ) : userData?.subscription_status === "past_due" ? (
                <Badge variant="destructive">Past due</Badge>
              ) : (
                <Badge variant="outline">Free</Badge>
              )}
            </div>

            {userData?.subscription_ends_at && isActive && (
              <p className="text-sm text-muted-foreground">
                Current period ends{" "}
                {new Date(userData.subscription_ends_at).toLocaleDateString()}
              </p>
            )}

            {isActive ? (
              <Button
                variant="outline"
                onClick={openBillingPortal}
                disabled={portalLoading}
              >
                {portalLoading ? "Opening..." : "Manage subscription"}
              </Button>
            ) : (
              <Link href="/upgrade">
                <Button>Upgrade</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
