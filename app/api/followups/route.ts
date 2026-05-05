import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient, validateWorkspace } from "@/lib/supabase/service-role";

const VALID_TYPES = ["email", "call", "text"];
const VALID_PRIORITIES = ["urgent", "high", "medium", "low"];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspace_id = searchParams.get("workspace_id");
    const lead_id = searchParams.get("lead_id");

    if (!workspace_id) {
      return NextResponse.json(
        { error: "workspace_id is required" },
        { status: 400 }
      );
    }

    if (!lead_id) {
      return NextResponse.json(
        { error: "lead_id is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();
    const valid = await validateWorkspace(supabase, workspace_id);
    if (!valid) {
      return NextResponse.json({ error: "Invalid workspace_id" }, { status: 403 });
    }

    const { data: followUps, error } = await supabase
      .from("follow_ups")
      .select("*")
      .eq("workspace_id", workspace_id)
      .eq("lead_id", lead_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[FollowUps GET] Query failed:", error);
      return NextResponse.json({ error: "Failed to fetch follow-ups" }, { status: 500 });
    }

    return NextResponse.json({ follow_ups: followUps || [] });
  } catch (error) {
    console.error("[FollowUps GET] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lead_id, workspace_id, type, priority, due_at, notes } = body;

    if (!lead_id || !workspace_id) {
      return NextResponse.json(
        { error: "lead_id and workspace_id are required" },
        { status: 400 }
      );
    }

    const followUpType = type || "email";
    const followUpPriority = priority || "medium";

    if (!VALID_TYPES.includes(followUpType)) {
      return NextResponse.json(
        { error: `Invalid type. Allowed: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!VALID_PRIORITIES.includes(followUpPriority)) {
      return NextResponse.json(
        { error: `Invalid priority. Allowed: ${VALID_PRIORITIES.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    const valid = await validateWorkspace(supabase, workspace_id);
    if (!valid) {
      return NextResponse.json({ error: "Invalid workspace_id" }, { status: 403 });
    }

    // Verify lead exists and belongs to workspace
    const { data: existingLead, error: leadError } = await supabase
      .from("leads")
      .select("id")
      .eq("id", lead_id)
      .eq("workspace_id", workspace_id)
      .single();

    if (leadError || !existingLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const { data: followUp, error } = await supabase
      .from("follow_ups")
      .insert({
        lead_id,
        workspace_id,
        type: followUpType,
        priority: followUpPriority,
        due_at: due_at || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[FollowUps POST] Insert failed:", error);
      return NextResponse.json({ error: "Failed to create follow-up" }, { status: 500 });
    }

    return NextResponse.json({ follow_up: followUp }, { status: 201 });
  } catch (error) {
    console.error("[FollowUps POST] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}