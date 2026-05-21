import { createHmac, timingSafeEqual } from "crypto";

const STRIPE_API = "https://api.stripe.com/v1";

export const FREE_TIER_LIMIT = 5;

/** Make an authenticated Stripe API call (form-encoded body) */
export async function stripePost(path: string, params: Record<string, string>) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? "Stripe error");
  return json;
}

export async function stripeGet(path: string) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? "Stripe error");
  return json;
}

/** Verify Stripe webhook signature without the SDK */
export function verifyStripeWebhook(payload: string, signature: string, secret: string): boolean {
  try {
    const parts: Record<string, string[]> = {};
    for (const part of signature.split(",")) {
      const [k, v] = part.split("=");
      if (!parts[k]) parts[k] = [];
      parts[k].push(v);
    }
    const timestamp = parts["t"]?.[0];
    const sigs = parts["v1"] ?? [];
    if (!timestamp || sigs.length === 0) return false;

    // Reject if timestamp is > 5 minutes old
    const ts = parseInt(timestamp, 10);
    if (Math.abs(Date.now() / 1000 - ts) > 300) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");

    return sigs.some((sig) => {
      try {
        return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}
