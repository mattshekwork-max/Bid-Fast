import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient, validateWorkspace } from "@/lib/supabase/service-role";
import { classifyUrgency } from "@/lib/ai/groq";
import { summarizeLead } from "@/lib/ai/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workspace_id,
      from: fromAddress,
      to: toAddress,
      subject,
      body_text,
      body_html,
      message_id,
      in_reply_to,
    } = body;

    if (!workspace_id || !fromAddress || !toAddress || !subject || !body_text) {
      return NextResponse.json(
        { error: "Missing required fields: workspace_id, from, to, subject, body_text" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Validate workspace
    const valid = await validateWorkspace(supabase, workspace_id);
    if (!valid) {
      return NextResponse.json({ error: "Invalid workspace_id" }, { status: 403 });
    }

    // 1. Store raw email event
    const { data: emailEvent, error: emailError } = await supabase
      .from("email_events")
      .insert({
        workspace_id,
        direction: "inbound",
        from_address: fromAddress,
        to_address: toAddress,
        subject,
        body_text,
        body_html: body_html || null,
        message_id: message_id || null,
        in_reply_to: in_reply_to || null,
        processed: false,
      })
      .select()
      .single();

    if (emailError) {
      console.error("[Ingest] Failed to store email event:", emailError);
      return NextResponse.json(
        { error: "Failed to store email event" },
        { status: 500 }
      );
    }

    // 2. Run AI pipeline (with graceful fallback)
    const leadContext = {
      name: fromAddress, // Will be updated when we find/create lead
      company: "",
      message: `${subject}\n\n${body_text}`,
    };

    const [classification, summary] = await Promise.all([
      classifyUrgency(leadContext),
      summarizeLead(leadContext),
    ]);

    // 3. Find or create lead by email + workspace_id
    const { data: existingLead } = await supabase
      .from("leads")
      .select("*")
      .eq("email", fromAddress)
      .eq("workspace_id", workspace_id)
      .single();

    let leadId: string;
    let urgencyScore: number;
    let intent: string;

    if (existingLead) {
      // Update existing lead
      const updateData = {
        urgency_score: classification.urgency_score,
        urgency_reason: classification.urgency_reason,
        intent: classification.intent,
        summary: summary.summary,
        subject_line: summary.subject_line,
        suggested_reply: summary.suggested_reply,
        last_activity_at: new Date().toISOString(),
      };

      const { data: updatedLead, error: updateError } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", existingLead.id)
        .select()
        .single();

      if (updateError) {
        console.error("[Ingest] Failed to update lead:", updateError);
        return NextResponse.json(
          { error: "Failed to update lead" },
          { status: 500 }
        );
      }

      leadId = updatedLead.id;
      urgencyScore = classification.urgency_score;
      intent = classification.intent;
    } else {
      // Create new lead
      const { data: newLead, error: createError } = await supabase
        .from("leads")
        .insert({
          workspace_id,
          name: fromAddress, // Email as placeholder name
          email: fromAddress,
          source: "email",
          urgency_score: classification.urgency_score,
          urgency_reason: classification.urgency_reason,
          intent: classification.intent,
          summary: summary.summary,
          subject_line: summary.subject_line,
          suggested_reply: summary.suggested_reply,
        })
        .select()
        .single();

      if (createError) {
        console.error("[Ingest] Failed to create lead:", createError);
        return NextResponse.json(
          { error: "Failed to create lead" },
          { status: 500 }
        );
      }

      leadId = newLead.id;
      urgencyScore = classification.urgency_score;
      intent = classification.intent;
    }

    // 4. Link email event to lead
    await supabase
      .from("email_events")
      .update({ lead_id: leadId, processed: true })
      .eq("id", emailEvent.id);

    // 5. Create follow_up if urgency >= 7
    if (urgencyScore >= 7) {
      await supabase.from("follow_ups").insert({
        lead_id: leadId,
        workspace_id,
        type: "email",
        priority: urgencyScore >= 9 ? "urgent" : "high",
        notes: `Auto-generated: ${classification.action_needed}`,
      });
    }

    return NextResponse.json({
      lead_id: leadId,
      urgency_score: urgencyScore,
      intent,
    });
  } catch (error) {
    console.error("[Ingest] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}