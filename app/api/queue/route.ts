import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient, validateWorkspace } from "@/lib/supabase/service-role";

export async function GET(request: NextRequest) {
  try {
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

    // Get leads in 'new' or 'contacted' status, sorted by urgency
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .eq("workspace_id", workspace_id)
      .in("status", ["new", "contacted"])
      .order("urgency_score", { ascending: false, nullsFirst: false });

    if (leadsError) {
      console.error("[Queue GET] Leads query failed:", leadsError);
      return NextResponse.json({ error: "Failed to fetch queue" }, { status: 500 });
    }

    // Get pending follow_ups count per lead
    const leadIds = (leads || []).map((l) => l.id);

    let followUpCounts: Record<string, number> = {};
    if (leadIds.length > 0) {
      const { data: followUps, error: fuError } = await supabase
        .from("follow_ups")
        .select("lead_id")
        .eq("workspace_id", workspace_id)
        .is("completed_at", null)
        .in("lead_id", leadIds);

      if (!fuError && followUps) {
        for (const fu of followUps) {
          followUpCounts[fu.lead_id] = (followUpCounts[fu.lead_id] || 0) + 1;
        }
      }
    }

    // Merge follow_up counts into leads
    const queue = (leads || []).map((lead) => ({
      ...lead,
      pending_follow_ups: followUpCounts[lead.id] || 0,
    }));

    return NextResponse.json({ queue });
  } catch (error) {
    console.error("[Queue GET] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}