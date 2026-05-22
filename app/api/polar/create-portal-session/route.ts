import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { polar, isPolarConfigured } from "@/lib/polar";

export async function POST(req: NextRequest) {
  try {
    if (!isPolarConfigured() || !polar) {
      return NextResponse.json(
        {
          error:
            "Polar is not configured. Please add your POLAR_ACCESS_TOKEN to .env",
        },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("polar_customer_id")
      .eq("id", user.id)
      .single();

    if (!dbUser || !dbUser.polar_customer_id) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Create customer session — returns a customerPortalUrl
    const session = await polar.customerSessions.create({
      customerId: dbUser.polar_customer_id,
    });

    return NextResponse.json({ url: session.customerPortalUrl });
  } catch (error: any) {
    console.error("Error creating Polar portal session:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
