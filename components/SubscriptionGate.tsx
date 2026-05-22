"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock } from "lucide-react";

interface SubscriptionGateProps {
  isActive: boolean;
  children: React.ReactNode;
  feature?: string;
}

// Wrap any premium content with this component.
// Pass `isActive` from your server component using hasActiveSubscription().
//
// Usage:
//   const isActive = await hasActiveSubscription(userId);
//   <SubscriptionGate isActive={isActive}>
//     <PremiumContent />
//   </SubscriptionGate>
export function SubscriptionGate({
  isActive,
  children,
  feature = "this feature",
}: SubscriptionGateProps) {
  if (isActive) {
    return <>{children}</>;
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle>Upgrade to unlock</CardTitle>
        <CardDescription>
          You need an active subscription to access {feature}.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Link href="/upgrade">
          <Button>View plans</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
