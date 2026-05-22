import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  // Check if user owns a team
  const { data: ownedTeam, error: ownedError } = await admin
    .from("teams")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (ownedError) {
    console.error("Error checking owned team:", ownedError);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }

  let teamId: string;
  let teamName: string;
  let isOwner: boolean;

  if (ownedTeam) {
    teamId = ownedTeam.id;
    teamName = ownedTeam.name;
    isOwner = true;
  } else {
    // Check membership
    const { data: membership, error: memberError } = await admin
      .from("team_members")
      .select("team_id, teams(id, name)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (memberError) {
      console.error("Error checking team membership:", memberError);
      return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
    }

    if (!membership) {
      return NextResponse.json({ team: null, members: [], isOwner: false });
    }

    const team = membership.teams as unknown as { id: string; name: string };
    teamId = team.id;
    teamName = team.name;
    isOwner = false;
  }

  const { data: members, error: membersError } = await admin
    .from("team_members")
    .select("id, email, role, status, invited_at, joined_at")
    .eq("team_id", teamId)
    .order("invited_at");

  if (membersError) {
    console.error("Error fetching team members:", membersError);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }

  return NextResponse.json({
    team: { id: teamId, name: teamName },
    members: members ?? [],
    isOwner,
  });
}
