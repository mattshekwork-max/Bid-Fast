import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

// Update the contractor's estimate pricing defaults
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const admin = getSupabaseAdmin();

  const update = {
    labor_rate: numOrNull(body.labor_rate),
    markup_percent: numOrNull(body.markup_percent),
    expense_flat: numOrNull(body.expense_flat),
    show_adjustments: body.show_adjustments !== false,
  };

  const { error } = await admin.from("users").update(update).eq("id", user.id);

  if (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json(
      { error: `Failed to save settings: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
