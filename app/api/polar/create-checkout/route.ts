import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { polar, isPolarConfigured } from "@/lib/polar";
import { ensurePolarCustomer } from "@/lib/polar-customer";

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

    const userId = user.id;

    // Get user from database
    const { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure Polar customer exists
    const customerId = await ensurePolarCustomer(
      supabase,
      userId,
      dbUser.email,
      `${dbUser.first_name || ""} ${dbUser.last_name || ""}`.trim() || undefined
    );

    // Create checkout session — Polar uses an array of product IDs
    const checkout = await polar.checkouts.create({
      products: [process.env.POLAR_PRODUCT_ID!],
      customerId,
      successUrl: `${req.headers.get("origin")}/dashboard?success=true`,
      metadata: {
        userId,
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error: any) {
    console.error("Error creating Polar checkout:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
