import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasActiveSubscription } from "@/lib/subscription";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ hasPlus: false });
    }

    const hasPlus = await hasActiveSubscription(supabase, user.id);

    return NextResponse.json({ hasPlus });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return NextResponse.json({ hasPlus: false });
  }
}
