import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

type Params = Promise<{ id: string }>;

export async function POST(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;

  let body: { token: string; response: "accepted" | "declined" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { token, response } = body;
  if (!token || !response || !["accepted", "declined"].includes(response)) {
    return NextResponse.json({ error: "token and response (accepted|declined) are required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Validate token matches the estimate
  const { data: estimate, error: fetchError } = await admin
    .from("estimates")
    .select("id, client_token, status")
    .eq("id", id)
    .single();

  if (fetchError || !estimate) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  if (estimate.client_token !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  if (estimate.status === "accepted" || estimate.status === "declined") {
    return NextResponse.json({ error: "Estimate already responded to" }, { status: 409 });
  }

  const { error: updateError } = await admin
    .from("estimates")
    .update({
      client_response: response,
      client_responded_at: new Date().toISOString(),
      status: response,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, status: response });
}
