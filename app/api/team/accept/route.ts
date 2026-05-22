import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await req.json();
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: invite, error: inviteError } = await admin
    .from("team_members")
    .select("id, team_id, email, status, role")
    .eq("invite_token", token)
    .maybeSingle();

  if (inviteError) {
    console.error("Error fetching invite:", inviteError);
    return NextResponse.json({ error: "Failed to fetch invite" }, { status: 500 });
  }

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.status === "active") {
    return NextResponse.json({ error: "Invite already accepted" }, { status: 409 });
  }

  if (invite.role === "owner") {
    return NextResponse.json({ error: "Cannot accept owner invite" }, { status: 400 });
  }

  // Prevent joining a second team
  const { data: existing } = await admin
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .neq("team_id", invite.team_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Already a member of another team" }, { status: 409 });
  }

  // Accept the invite
  const { error: updateError } = await admin
    .from("team_members")
    .update({
      user_id: user.id,
      status: "active",
      invite_token: null,
      joined_at: new Date().toISOString(),
    })
    .eq("id", invite.id);

  if (updateError) {
    console.error("Failed to accept invite:", updateError);
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }

  // Tag user's existing estimates with the team
  await admin
    .from("estimates")
    .update({ team_id: invite.team_id })
    .eq("user_id", user.id)
    .is("team_id", null);

  return NextResponse.json({ ok: true, teamId: invite.team_id });
}
