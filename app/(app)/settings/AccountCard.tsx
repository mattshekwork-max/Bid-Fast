"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  email: string;
  createdAt: string;
}

export default function AccountCard({ email, createdAt }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Card className="rounded-[6px]">
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Your Bid.Fast account details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Email</p>
          <p className="mt-1">{email}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Member since</p>
          <p className="mt-1">
            {new Date(createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Button variant="destructive" size="sm" className="rounded-[6px]" onClick={handleSignOut} disabled={loading}>
          {loading ? "Signing out…" : "Sign out"}
        </Button>
      </CardContent>
    </Card>
  );
}
