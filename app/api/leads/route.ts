import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient, validateWorkspace } from "@/lib/supabase/service-role";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspace_id = searchParams.get("workspace_id");
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

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

    let query = supabase
      .from("leads")
      .select("*")
      .eq("workspace_id", workspace_id)
      .order("urgency_score", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }
    if (source) {
      query = query.eq("source", source);
    }

    const { data: leads, error } = await query;

    if (error) {
      console.error("[Leads GET] Query failed:", error);
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
    }

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("[Leads GET] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, name, email, phone, company, source, message } = body;

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

    // Run AI pipeline if message is provided
    let urgencyScore = null;
    let urgencyReason = null;
    let intent = null;
    let leadSummary = null;
    let subjectLine = null;
    let suggestedReply = null;

    if (message) {
      const leadContext = { name: name || email || "Unknown", company: company || "", message };
      const { classifyUrgency } = await import("@/lib/ai/groq");
      const { summarizeLead } = await import("@/lib/ai/gemini");

      const [classification, summary] = await Promise.all([
        classifyUrgency(leadContext),
        summarizeLead(leadContext),
      ]);

      urgencyScore = classification.urgency_score;
      urgencyReason = classification.urgency_reason;
      intent = classification.intent;
      leadSummary = summary.summary;
      subjectLine = summary.subject_line;
      suggestedReply = summary.suggested_reply;
    }

    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        workspace_id,
        name: name || null,
        email: email || null,
        phone: phone || null,
        company: company || null,
        source: source || "manual",
        urgency_score: urgencyScore,
        urgency_reason: urgencyReason,
        intent,
        summary: leadSummary,
        subject_line: subjectLine,
        suggested_reply: suggestedReply,
      })
      .select()
      .single();

    if (error) {
      console.error("[Leads POST] Insert failed:", error);
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
    }

    // Create follow_up if urgency >= 7
    if (urgencyScore && urgencyScore >= 7) {
      await supabase.from("follow_ups").insert({
        lead_id: lead.id,
        workspace_id,
        type: "email",
        priority: urgencyScore >= 9 ? "urgent" : "high",
        notes: "Auto-generated from manual lead entry",
      });
    }

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error("[Leads POST] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}