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
  firstName?: string;
  lastName?: string;
  subscriptionStatus?: string;
  subscriptionEndsAt?: string;
}

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUserEmail(user?.email || null);

        const response = await fetch("/api/users");
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        setUserData(data.user);
      } catch {
        setError("Failed to load user data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const isActive = userData?.subscriptionStatus === "active";

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
            {userData?.firstName && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="mt-1">{userData.firstName} {userData.lastName}</p>
              </div>
            )}
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
              ) : userData?.subscriptionStatus === "canceled" ? (
                <Badge variant="secondary">Canceled</Badge>
              ) : userData?.subscriptionStatus === "past_due" ? (
                <Badge variant="destructive">Past due</Badge>
              ) : (
                <Badge variant="outline">Free</Badge>
              )}
            </div>

            {userData?.subscriptionEndsAt && isActive && (
              <p className="text-sm text-muted-foreground">
                Current period ends{" "}
                {new Date(userData.subscriptionEndsAt).toLocaleDateString()}
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
