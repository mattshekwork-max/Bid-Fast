import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient, validateWorkspace } from "@/lib/supabase/service-role";

const VALID_OUTCOMES = ["completed", "skipped", "no_answer", "bad_info"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { outcome, workspace_id } = body;

    if (!workspace_id) {
      return NextResponse.json(
        { error: "workspace_id is required" },
        { status: 400 }
      );
    }

    if (!outcome) {
      return NextResponse.json(
        { error: "outcome is required" },
        { status: 400 }
      );
    }

    if (!VALID_OUTCOMES.includes(outcome)) {
      return NextResponse.json(
        { error: `Invalid outcome. Allowed: ${VALID_OUTCOMES.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    const valid = await validateWorkspace(supabase, workspace_id);
    if (!valid) {
      return NextResponse.json({ error: "Invalid workspace_id" }, { status: 403 });
    }

    // Verify follow_up exists and belongs to workspace
    const { data: existing, error: fetchError } = await supabase
      .from("follow_ups")
      .select("id")
      .eq("id", id)
      .eq("workspace_id", workspace_id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });
    }

    const { data: followUp, error: updateError } = await supabase
      .from("follow_ups")
      .update({
        outcome,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[FollowUps PATCH] Update failed:", updateError);
      return NextResponse.json({ error: "Failed to update follow-up" }, { status: 500 });
    }

    return NextResponse.json({ follow_up: followUp });
  } catch (error) {
    console.error("[FollowUps PATCH] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}