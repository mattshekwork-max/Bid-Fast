import { Resend } from "resend";

const isResendConfigured =
  !!process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 0;

const resend = isResendConfigured ? new Resend(process.env.RESEND_API_KEY) : null;

const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const appName = process.env.NEXT_PUBLIC_APP_NAME || "My App";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.log(`[EMAIL NOT CONFIGURED] Would have sent to ${to}:`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${html.substring(0, 200)}...`);
    return { success: true, simulated: true };
  }

  const { data, error } = await resend.emails.send({
    from: `${appName} <${fromEmail}>`,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }

  return { success: true, data };
}

export async function sendWelcomeEmail(to: string, name?: string) {
  const greeting = name ? `Hi ${name}` : "Hi there";
  return sendEmail({
    to,
    subject: `Welcome to ${appName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">${greeting},</h1>
        <p style="color: #666; line-height: 1.6;">Thanks for signing up for ${appName}. We're excited to have you!</p>
        <p style="color: #666; line-height: 1.6;">Get started by visiting your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">dashboard</a>.</p>
        <p style="color: #999; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
          ${appName}
        </p>
      </div>
    `,
  });
}

export async function sendSubscriptionEmail(to: string, name?: string) {
  const greeting = name ? `Hi ${name}` : "Hi there";
  return sendEmail({
    to,
    subject: `You're upgraded! Welcome to ${appName} Pro`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">${greeting},</h1>
        <p style="color: #666; line-height: 1.6;">Your Pro subscription is now active! You have access to all premium features.</p>
        <p style="color: #666; line-height: 1.6;">You can manage your subscription anytime from <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">settings</a>.</p>
        <p style="color: #999; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
          ${appName}
        </p>
      </div>
    `,
  });
}
