import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: memberId } = await params;
  const admin = getSupabaseAdmin();

  // Fetch the member
  const { data: member, error: memberError } = await admin
    .from("team_members")
    .select("id, user_id, team_id, role")
    .eq("id", memberId)
    .maybeSingle();

  if (memberError) {
    console.error("Error fetching member:", memberError);
    return NextResponse.json({ error: "Failed to fetch member" }, { status: 500 });
  }

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (member.role === "owner") {
    return NextResponse.json({ error: "Cannot remove team owner" }, { status: 400 });
  }

  // Verify caller owns the team
  const { data: team } = await admin
    .from("teams")
    .select("id")
    .eq("id", member.team_id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!team) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Un-tag the removed member's estimates
  await admin
    .from("estimates")
    .update({ team_id: null })
    .eq("user_id", member.user_id)
    .eq("team_id", member.team_id);

  // Remove the member
  const { error: deleteError } = await admin
    .from("team_members")
    .delete()
    .eq("id", memberId);

  if (deleteError) {
    console.error("Failed to delete member:", deleteError);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
