import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Check Pro subscription
  const { data: userData, error: userError } = await admin
    .from("users")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  if (userError || !userData) {
    return NextResponse.json({ error: "Failed to verify subscription" }, { status: 500 });
  }

  if (userData.subscription_status !== "pro") {
    return NextResponse.json({ error: "Pro required", upgrade: true }, { status: 403 });
  }

  // Get or create team
  let { data: team, error: teamError } = await admin
    .from("teams")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (teamError) {
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }

  if (!team) {
    const { data: newTeam, error: createError } = await admin
      .from("teams")
      .insert({ owner_id: user.id, name: "My Team" })
      .select("id")
      .single();

    if (createError || !newTeam) {
      return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
    }
    team = newTeam;
  }

  // Ensure owner is listed as a member
  const { data: ownerMember } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", team.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ownerMember) {
    await admin.from("team_members").insert({
      team_id: team.id,
      user_id: user.id,
      email: user.email,
      role: "owner",
      status: "active",
    });
  }

  // Create invite
  const token = crypto.randomUUID();

  const { error: inviteError } = await admin.from("team_members").insert({
    team_id: team.id,
    email,
    role: "member",
    status: "pending",
    invite_token: token,
  });

  if (inviteError) {
    console.error("Failed to create invite:", inviteError);
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }

  // Send invite email via Resend
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/team/join?token=${token}`;
  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Bid.Fast <noreply@bid-fast.com>",
      to: email,
      subject: "You've been invited to a Bid.Fast team",
      html: `
        <p>You've been invited to join a team on <strong>Bid.Fast</strong>.</p>
        <p>Click the link below to accept your invitation:</p>
        <p><a href="${inviteLink}">${inviteLink}</a></p>
        <p>If you don't have an account, you'll be prompted to create one.</p>
      `,
    }),
  });

  if (!emailRes.ok) {
    console.error("Failed to send invite email:", await emailRes.text());
    // Non-fatal — invite row exists, email failure is logged
  }

  return NextResponse.json({ ok: true });
}
