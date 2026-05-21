"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";
import PricingCard from "./PricingCard";
import CompanyCard from "./CompanyCard";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Settings</h1>

      <Card className="rounded-[6px]">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your Bid.Fast account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="mt-1">{user?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Member since</p>
            <p className="mt-1">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                : "—"}
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-[6px]"
            onClick={handleSignOut}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>

      {/* Company */}
      <CompanyCard />

      {/* Pricing */}
      <PricingCard />
    </div>
  );
}
