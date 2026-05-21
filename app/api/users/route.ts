import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  let body: { id: string; email: string; full_name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { id, email, full_name } = body;
  if (!id || !email) {
    return NextResponse.json({ error: "id and email are required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("users")
    .upsert({ id, email, full_name: full_name ?? null }, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}
