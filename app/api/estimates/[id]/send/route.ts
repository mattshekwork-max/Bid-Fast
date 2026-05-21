import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { randomBytes } from "crypto";

type Params = Promise<{ id: string }>;

export async function POST(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getSupabaseAdmin();

  // Fetch estimate + contractor company info in parallel
  const [{ data: estimate, error: fetchError }, { data: contractor }] = await Promise.all([
    admin.from("estimates").select("id, title, client_name, client_email, client_token, status").eq("id", id).eq("user_id", user.id).single(),
    admin.from("users").select("company_name, company_phone, company_address, company_logo_url, company_website, company_license").eq("id", user.id).single(),
  ]);

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

  // Email via Resend
  if (process.env.RESEND_API_KEY && estimate.client_email) {
    const companyName = contractor?.company_name ?? "Your Contractor";
    const companyPhone = contractor?.company_phone ?? "";
    const companyAddress = contractor?.company_address ?? "";
    const companyLogo = contractor?.company_logo_url ?? "";
    const companyWebsite = contractor?.company_website ?? "";
    const companyLicense = contractor?.company_license ?? "";

    // FROM: use env override, otherwise fall back to Resend onboarding address for testing
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
    const fromName = contractor?.company_name ?? "Bid.Fast";

    const logoHtml = companyLogo
      ? `<img src="${companyLogo}" alt="${companyName}" style="height:48px;object-fit:contain;margin-bottom:12px;display:block;">`
      : "";

    const contactLines = [companyPhone, companyAddress, companyLicense ? `Lic# ${companyLicense}` : "", companyWebsite]
      .filter(Boolean)
      .map((line) => `<p style="margin:2px 0;font-size:12px;color:#6B7280;">${line}</p>`)
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f9fc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f9fc;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);max-width:600px;width:100%;">

        <!-- Header bar -->
        <tr><td style="background:#065f46;padding:24px 32px;">
          ${logoHtml}
          <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;">${companyName}</p>
          ${contactLines}
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:14px;color:#374151;">Hi${estimate.client_name ? ` ${estimate.client_name}` : ""},</p>
          <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">
            Your estimate for <strong>${estimate.title}</strong> is ready to review.
            Click the button below to view the full breakdown and accept or decline.
          </p>

          <!-- CTA button -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr><td style="background:#007a5e;border-radius:6px;">
              <a href="${clientUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.02em;">
                View &amp; Respond to Estimate →
              </a>
            </td></tr>
          </table>

          <p style="margin:0 0 4px;font-size:12px;color:#9CA3AF;">Or copy this link into your browser:</p>
          <p style="margin:0 0 24px;font-size:12px;color:#6B7280;word-break:break-all;">${clientUrl}</p>

          <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
          <p style="margin:0;font-size:12px;color:#9CA3AF;">
            Sent by ${companyName} via <a href="${appUrl}" style="color:#007a5e;text-decoration:none;">Bid.Fast</a>.
            This estimate link is unique to you.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [estimate.client_email],
          subject: `Your estimate is ready — ${estimate.title}`,
          html,
        }),
      });

      if (!emailRes.ok) {
        const err = await emailRes.json().catch(() => ({}));
        console.error("Resend error:", err);
        // Don't block — return the link even if email fails
      }
    } catch (err) {
      console.error("Email send failed:", err);
      // Non-blocking
    }
  }

  return NextResponse.json({ clientUrl, token });
}
