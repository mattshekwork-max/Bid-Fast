import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient, validateWorkspace } from "@/lib/supabase/service-role";

const ALLOWED_STATUSES = ["new", "contacted", "qualified", "lost", "won"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const workspace_id = searchParams.get("workspace_id");

    if (!workspace_id) {
      return NextResponse.json(
        { error: "workspace_id is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();
    const valid = await validateWorkspace(supabase, workspace_id);
    if (!valid) {
      return NextResponse.json({ error: "Invalid workspace_id" }, { status: 403 });
    }

    const { data: lead, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspace_id)
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("[Leads GET /id] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, workspace_id } = body;

    if (!workspace_id) {
      return NextResponse.json(
        { error: "workspace_id is required" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    const valid = await validateWorkspace(supabase, workspace_id);
    if (!valid) {
      return NextResponse.json({ error: "Invalid workspace_id" }, { status: 403 });
    }

    // Verify lead exists and belongs to workspace
    const { data: existing, error: fetchError } = await supabase
      .from("leads")
      .select("id")
      .eq("id", id)
      .eq("workspace_id", workspace_id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const { data: lead, error: updateError } = await supabase
      .from("leads")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[Leads PATCH] Update failed:", updateError);
      return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("[Leads PATCH] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}