import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hasActiveSubscription } from "@/lib/subscription";

const FREE_ESTIMATE_LIMIT = 3;

function buildSystemPrompt(pricingConfig: object | null, language: string): string {
  let prompt =
    "You are an expert trade contractor estimator. Generate a detailed estimate from this job description. " +
    "Return ONLY valid JSON with this structure: { title, description, lineItems: [{description, quantity, unit, unitCost, total}], " +
    "laborHours, laborRate, laborTotal, materialsTotal, subtotal, tax, total, notes }. Use realistic market rates.";
  if (language === "es") {
    prompt += " Respond entirely in Spanish. All text in the JSON values must be in Spanish.";
  }
  if (pricingConfig) {
    prompt += ` Use these custom rates where applicable: ${JSON.stringify(pricingConfig)}.`;
  }
  return prompt;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { transcript, language = "en", pricingConfig: bodyPricingConfig } = await req.json();

  if (!transcript) {
    return NextResponse.json({ error: "transcript is required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Free-tier gate: 3 estimates, then require Pro
  const subscribed = await hasActiveSubscription(admin, user.id);
  if (!subscribed) {
    const { count } = await admin
      .from("estimates")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) >= FREE_ESTIMATE_LIMIT) {
      return NextResponse.json(
        {
          error: "Free limit reached. Upgrade to Pro for unlimited estimates.",
          upgrade: true,
        },
        { status: 403 }
      );
    }
  }
  const { data: userData } = await admin
    .from("users")
    .select("pricing_config")
    .eq("id", user.id)
    .single();

  const pricingConfig = bodyPricingConfig ?? userData?.pricing_config ?? null;
  const systemPrompt = buildSystemPrompt(pricingConfig, language);

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcript },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!groqRes.ok) {
    console.error("Groq LLM error:", await groqRes.text());
    return NextResponse.json({ error: "Estimate generation failed" }, { status: 500 });
  }

  const completion = await groqRes.json();
  let raw: string = completion.choices?.[0]?.message?.content ?? "";

  // Strip markdown code fences if model wrapped the JSON
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("Failed to parse LLM JSON:", raw);
    return NextResponse.json({ error: "Failed to parse estimate" }, { status: 500 });
  }

  const { data: inserted, error: insertError } = await admin
    .from("estimates")
    .insert({
      user_id: user.id,
      title: (parsed.title as string) ?? "Untitled Estimate",
      transcript,
      estimate_data: parsed,
      status: "draft",
      language,
    })
    .select()
    .single();

  if (insertError || !inserted) {
    console.error("Failed to save estimate:", insertError);
    return NextResponse.json({ error: "Failed to save estimate" }, { status: 500 });
  }

  return NextResponse.json({ estimate: inserted });
}
