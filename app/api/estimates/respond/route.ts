import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// Public endpoint — a contractor's client accepts or declines an estimate
// via the shareable client_token link. No auth required (token is the secret).
export async function POST(req: NextRequest) {
  const { token, response } = await req.json();

  if (!token || (response !== "accepted" && response !== "declined")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: estimate, error } = await admin
    .from("estimates")
    .select("id, client_response")
    .eq("client_token", token)
    .maybeSingle();

  if (error) {
    console.error("respond lookup error:", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (!estimate) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }
  if (estimate.client_response) {
    return NextResponse.json({ error: "This estimate has already been answered." }, { status: 409 });
  }

  const { error: updateError } = await admin
    .from("estimates")
    .update({
      client_response: response,
      client_responded_at: new Date().toISOString(),
      status: response,
    })
    .eq("id", estimate.id);

  if (updateError) {
    console.error("respond update error:", updateError);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, response });
}
