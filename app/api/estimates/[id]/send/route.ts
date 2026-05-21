import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { randomBytes } from "crypto";

type Params = Promise<{ id: string }>;

export async function POST(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  // Verify ownership
  const { data: estimate, error: fetchError } = await admin
    .from("estimates")
    .select("id, title, client_email, client_token, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !estimate) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  // Generate or reuse token
  const token = estimate.client_token ?? randomBytes(24).toString("hex");

  const { error: updateError } = await admin
    .from("estimates")
    .update({ client_token: token, status: "sent" })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const clientUrl = `${appUrl}/client/${token}`;

  // Email via Resend (if configured)
  if (process.env.RESEND_API_KEY && estimate.client_email) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Bid.Fast <estimates@bid.fast>",
          to: [estimate.client_email],
          subject: `Your estimate is ready — ${estimate.title}`,
          html: `
            <p>Hi there,</p>
            <p>Your estimate for <strong>${estimate.title}</strong> is ready to review.</p>
            <p><a href="${clientUrl}" style="display:inline-block;padding:12px 24px;background:#007a5e;color:white;border-radius:8px;text-decoration:none;font-weight:600;">View Estimate</a></p>
            <p>You can accept or decline directly from the link above.</p>
            <p style="color:#6B7280;font-size:12px;">Powered by Bid.Fast</p>
          `,
        }),
      });
    } catch {
      // Email failure should not block the response
    }
  }

  return NextResponse.json({ clientUrl, token });
}
