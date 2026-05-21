"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CompanyProfile {
  company_name: string;
  company_phone: string;
  company_address: string;
  company_logo_url: string;
  company_website: string;
  company_license: string;
}

const DEFAULT: CompanyProfile = {
  company_name: "",
  company_phone: "",
  company_address: "",
  company_logo_url: "",
  company_website: "",
  company_license: "",
};

export default function CompanyCard() {
  const [profile, setProfile] = useState<CompanyProfile>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    fetch("/api/users/company")
      .then((r) => r.json())
      .then(({ company }) => {
        if (company) setProfile({ ...DEFAULT, ...company });
      })
      .finally(() => setLoading(false));
  }, []);

  function set(field: keyof CompanyProfile, value: string) {
    setProfile((p) => ({ ...p, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/users/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
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
        <CardTitle>Company Profile</CardTitle>
        <CardDescription>
          This info appears on estimates you send to clients and on PDFs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Company Name</Label>
            <Input
              placeholder="Webb Electric LLC"
              value={profile.company_name}
              onChange={(e) => set("company_name", e.target.value)}
              className="rounded-[6px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input
              placeholder="(512) 555-0190"
              value={profile.company_phone}
              onChange={(e) => set("company_phone", e.target.value)}
              className="rounded-[6px]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Address</Label>
          <Input
            placeholder="1234 Trade St, Austin, TX 78701"
            value={profile.company_address}
            onChange={(e) => set("company_address", e.target.value)}
            className="rounded-[6px]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Website</Label>
            <Input
              placeholder="https://webbelectric.com"
              value={profile.company_website}
              onChange={(e) => set("company_website", e.target.value)}
              className="rounded-[6px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>License # <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              placeholder="LIC-123456"
              value={profile.company_license}
              onChange={(e) => set("company_license", e.target.value)}
              className="rounded-[6px]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Logo URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input
            placeholder="https://yoursite.com/logo.png"
            value={profile.company_logo_url}
            onChange={(e) => set("company_logo_url", e.target.value)}
            className="rounded-[6px]"
          />
          <p className="text-xs text-muted-foreground">Paste a public image URL — shown on client estimates and PDFs.</p>
          {profile.company_logo_url && (
            <img
              src={profile.company_logo_url}
              alt="Logo preview"
              className="h-12 object-contain rounded border border-border mt-1"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button onClick={handleSave} disabled={saving} className="rounded-[6px] font-semibold">
            {saving ? "Saving…" : "Save Company Info"}
          </Button>
          {status === "saved" && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
          {status === "error" && <span className="text-sm text-destructive font-medium">Failed to save. Try again.</span>}
        </div>
      </CardContent>
    </Card>
  );
}
