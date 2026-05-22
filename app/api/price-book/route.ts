import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// GET — list the contractor's custom price-book entries
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("price_book")
    .select("id, item_name, unit, unit_price")
    .eq("user_id", user.id)
    .order("item_name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

// POST — add a custom price
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { item_name, unit, unit_price } = await req.json();
  if (!item_name || typeof item_name !== "string") {
    return NextResponse.json({ error: "item_name is required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("price_book")
    .insert({
      user_id: user.id,
      item_name: item_name.trim(),
      unit: (typeof unit === "string" && unit.trim()) || "each",
      unit_price: Number(unit_price) || 0,
    })
    .select("id, item_name, unit, unit_price")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}
