"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",
  CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",
  HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
  KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",
  MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",
  MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",
  NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",
  OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
  SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",
  VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",
};

const TRADE_OPTIONS = [
  "Electrical","Plumbing","HVAC","Roofing","Drywall","Tile & Flooring",
  "Carpentry","Painting","Concrete","Landscaping","Solar","General Contractor","Other",
];

const UNIT_OPTIONS = ["hr","sq","sf","lf","day","ea","job"];

export interface LaborRate {
  name: string;
  min: number;
  max: number;
  unit: string;
}

export interface PricingConfig {
  state: string;
  trade: string;
  markup_pct: number;
  labor_rates: LaborRate[];
  custom_rules: string;
}

const DEFAULT_CONFIG: PricingConfig = {
  state: "",
  trade: "",
  markup_pct: 15,
  labor_rates: [{ name: "", min: 0, max: 0, unit: "hr" }],
  custom_rules: "",
};

export default function PricingCard() {
  const [config, setConfig] = useState<PricingConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users/pricing")
      .then((r) => r.json())
      .then(({ pricing_config }) => {
        if (pricing_config) setConfig({ ...DEFAULT_CONFIG, ...pricing_config });
      })
      .finally(() => setLoading(false));
  }, []);

  function updateRate(index: number, field: keyof LaborRate, value: string | number) {
    setConfig((prev) => {
      const rates = [...prev.labor_rates];
      rates[index] = { ...rates[index], [field]: value };
      return { ...prev, labor_rates: rates };
    });
  }

  function addRate() {
    setConfig((prev) => ({
      ...prev,
      labor_rates: [...prev.labor_rates, { name: "", min: 0, max: 0, unit: "hr" }],
    }));
  }

  function removeRate(index: number) {
    setConfig((prev) => ({
      ...prev,
      labor_rates: prev.labor_rates.filter((_, i) => i !== index),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/users/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Save failed");
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <Card className="rounded-[6px]">
      <CardHeader>
        <CardTitle>Pricing Configuration</CardTitle>
        <CardDescription>
          Set your rates for your state and trade. The AI uses these when building estimates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* State + Trade */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>State</Label>
            <select
              value={config.state}
              onChange={(e) => setConfig((p) => ({ ...p, state: e.target.value }))}
              className="w-full h-9 rounded-[6px] border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Select state —</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{STATE_NAMES[s]} ({s})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Primary Trade</Label>
            <select
              value={config.trade}
              onChange={(e) => setConfig((p) => ({ ...p, trade: e.target.value }))}
              className="w-full h-9 rounded-[6px] border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Select trade —</option>
              {TRADE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Materials Markup */}
        <div className="space-y-1.5">
          <Label>Materials Markup (%)</Label>
          <div className="flex items-center gap-2 w-32">
            <Input
              type="number"
              min={0}
              max={100}
              value={config.markup_pct}
              onChange={(e) => setConfig((p) => ({ ...p, markup_pct: Number(e.target.value) }))}
              className="rounded-[6px]"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>

        {/* Labor Rates */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Labor Rates</Label>
            <button
              onClick={addRate}
              className="text-xs text-primary hover:underline font-medium"
            >
              + Add row
            </button>
          </div>

          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_80px_70px_32px] gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span>Task / Trade</span>
            <span>Min $</span>
            <span>Max $</span>
            <span>Unit</span>
            <span />
          </div>

          {config.labor_rates.map((rate, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_80px_70px_32px] gap-2 items-center">
              <Input
                placeholder="e.g. Roofing Labor"
                value={rate.name}
                onChange={(e) => updateRate(i, "name", e.target.value)}
                className="rounded-[6px] h-8 text-sm"
              />
              <Input
                type="number"
                min={0}
                placeholder="75"
                value={rate.min || ""}
                onChange={(e) => updateRate(i, "min", Number(e.target.value))}
                className="rounded-[6px] h-8 text-sm"
              />
              <Input
                type="number"
                min={0}
                placeholder="110"
                value={rate.max || ""}
                onChange={(e) => updateRate(i, "max", Number(e.target.value))}
                className="rounded-[6px] h-8 text-sm"
              />
              <select
                value={rate.unit}
                onChange={(e) => updateRate(i, "unit", e.target.value)}
                className="h-8 rounded-[6px] border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <button
                onClick={() => removeRate(i)}
                disabled={config.labor_rates.length === 1}
                className="text-muted-foreground hover:text-destructive disabled:opacity-30 text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}

          <p className="text-xs text-muted-foreground">
            Units: <strong>hr</strong> = per hour · <strong>sq</strong> = per square (100 sf, roofing) · <strong>sf</strong> = per sq ft · <strong>lf</strong> = per linear ft · <strong>day</strong> = per day
          </p>
        </div>

        {/* Custom Rules */}
        <div className="space-y-1.5">
          <Label>Custom Rules <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <textarea
            rows={3}
            placeholder={`e.g. "Always add 10% waste on shingles. Minimum job is $800. Include permit fees as a separate line item."`}
            value={config.custom_rules}
            onChange={(e) => setConfig((p) => ({ ...p, custom_rules: e.target.value }))}
            className="w-full rounded-[6px] border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <p className="text-xs text-muted-foreground">Plain English — the AI reads these as instructions when building your estimate.</p>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-[6px] font-semibold"
          >
            {saving ? "Saving…" : "Save Pricing"}
          </Button>
          {status === "saved" && (
            <span className="text-sm text-green-600 font-medium">✓ Saved</span>
          )}
          {status === "error" && (
            <span className="text-sm text-destructive font-medium">Failed to save. Try again.</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
