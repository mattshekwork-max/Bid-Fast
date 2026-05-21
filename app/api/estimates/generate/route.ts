import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { FREE_TIER_LIMIT } from "@/lib/stripe";
import { createEstimate, replaceLineItems, replaceMaterials } from "@/lib/estimates";

// Uses Groq LLaMA 3.3 70B for estimate generation (same API key as Whisper transcription)

const BASE_PROMPT_TOP = `You are a professional trade estimating assistant. You parse voice transcripts from contractors — electricians, plumbers, HVAC techs, tile setters, carpenters, drywall crews, and other skilled trades — and produce structured job estimates.

Trade vocabulary you understand (non-exhaustive):
- Electrical: Romex (NM-B), THHN, EMT conduit, 200A panel, breaker, junction box, GFCI, arc-fault, service entrance, load center
- Plumbing: PEX, CPVC, copper, SharkBite, P-trap, ball valve, gate valve, PRV, water heater, manifold, rough-in
- HVAC: ton, SEER, mini-split, air handler, condenser, lineset, plenum, flex duct, RTU, damper
- Drywall: 5/8 rock, 1/2 sheet, green board, blueboard, corner bead, taping mud, texture
- Tile: subway tile, LVP, Schluter, thinset, grout, membrane, backerboard, mud bed
- General: OSB, LVL beam, joist hanger, lag bolt, Simpson tie, flashing, housewrap`;

const DEFAULT_PRICING = `Pricing guidance (use realistic US regional averages, ±20%):
- Electrician labor: $85–$125/hr
- Plumber labor: $90–$130/hr
- HVAC tech labor: $80–$120/hr
- Tile setter: $65–$95/hr
- Drywall crew: $50–$80/hr
- General laborer: $35–$55/hr
- Always include a 10–15% materials markup unless transcript indicates otherwise`;

const PROMPT_SCHEMA = `Output ONLY valid JSON matching this schema exactly (no markdown, no extra text):
{
  "title": "string — short job description, e.g. 'Panel Upgrade 200A'",
  "client_name": "string | null",
  "client_email": "string | null",
  "parsed_description": "string | null — special conditions, exclusions, or assumptions",
  "line_items": [
    {
      "description": "string",
      "quantity": number,
      "unit": "hr | ea | lf | sf | ls | sq | day",
      "unit_cost": number,
      "total_cost": number,
      "category": "string — trade category e.g. electrical, plumbing, hvac, tile, drywall, general",
      "item_type": "labor | material"
    }
  ],
  "materials": [
    {
      "material_name": "string",
      "quantity": number,
      "unit": "ea | lf | sf | box | roll | bag | sheet | gal",
      "unit_price": number,
      "total_price": number,
      "supplier_note": "string | null"
    }
  ],
  "total_labor_cost": number,
  "total_material_cost": number
}`;

function buildSystemPrompt(pricingConfig: Record<string, unknown> | null): string {
  let pricingSection = DEFAULT_PRICING;

  if (pricingConfig) {
    const lines: string[] = [];
    const state = pricingConfig.state as string | undefined;
    const trade = pricingConfig.trade as string | undefined;
    const markup = pricingConfig.markup_pct as number | undefined;
    const rates = pricingConfig.labor_rates as Array<{ name: string; min: number; max: number; unit: string }> | undefined;
    const custom = pricingConfig.custom_rules as string | undefined;

    const location = [trade, state ? `${state} rates` : null].filter(Boolean).join(", ");
    if (location) lines.push(`Pricing guidance for this contractor (${location}):`);
    else lines.push("Pricing guidance for this contractor:");

    if (rates && rates.length > 0) {
      for (const r of rates) {
        if (r.name && r.max > 0) {
          lines.push(`- ${r.name}: $${r.min}–$${r.max}/${r.unit}`);
        }
      }
    }

    lines.push(`- Materials markup: ${markup ?? 15}%`);

    if (custom && custom.trim()) {
      lines.push(`\nAdditional contractor rules:\n${custom.trim()}`);
    }

    pricingSection = lines.join("\n");
  }

  return `${BASE_PROMPT_TOP}\n\n${pricingSection}\n\n${PROMPT_SCHEMA}`;
}

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY is not configured" }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let voice_transcript: string;
  try {
    const body = await request.json();
    voice_transcript = body.transcript;
    if (!voice_transcript || typeof voice_transcript !== "string" || voice_transcript.trim().length === 0) {
      return NextResponse.json({ error: "transcript is required" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Check subscription + free tier limit
  const [{ data: userData }, { count: estimateCount }] = await Promise.all([
    admin.from("users").select("pricing_config, subscription_status").eq("id", user.id).single(),
    admin.from("estimates").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const isPro = userData?.subscription_status === "pro";
  if (!isPro && (estimateCount ?? 0) >= FREE_TIER_LIMIT) {
    return NextResponse.json(
      { error: `Free plan limit reached (${FREE_TIER_LIMIT} estimates). Upgrade to Pro for unlimited estimates.`, upgrade: true },
      { status: 403 }
    );
  }
  const pricingConfig = (userData?.pricing_config as Record<string, unknown> | null) ?? null;
  const systemPrompt = buildSystemPrompt(pricingConfig);

  let parsed: {
    title: string;
    client_name: string | null;
    client_email: string | null;
    parsed_description: string | null;
    line_items: {
      description: string;
      quantity: number;
      unit: string;
      unit_cost: number;
      total_cost: number;
      category: string;
      item_type: string;
    }[];
    materials: {
      material_name: string;
      quantity: number;
      unit: string;
      unit_price: number;
      total_price: number;
      supplier_note: string | null;
    }[];
    total_labor_cost: number;
    total_material_cost: number;
  };

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Voice transcript from contractor:\n\n${voice_transcript}` },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content ?? "";
    parsed = JSON.parse(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const total_labor_cost = parsed.total_labor_cost ?? 0;
  const total_material_cost = parsed.total_material_cost ?? 0;
  const total_cost = total_labor_cost + total_material_cost;

  const { data: estimate, error: estError } = await createEstimate(supabase, user.id, {
    title: parsed.title ?? "New Estimate",
    client_name: parsed.client_name ?? null,
    client_email: parsed.client_email ?? null,
    voice_transcript,
    parsed_description: parsed.parsed_description ?? null,
    total_labor_cost,
    total_material_cost,
    total_cost,
    status: "draft",
  });

  if (estError || !estimate) {
    return NextResponse.json({ error: estError?.message ?? "Failed to save estimate" }, { status: 500 });
  }

  if (parsed.line_items?.length > 0) {
    await replaceLineItems(supabase, estimate.id, parsed.line_items);
  }

  if (parsed.materials?.length > 0) {
    await replaceMaterials(supabase, estimate.id, parsed.materials);
  }

  return NextResponse.json({ estimateId: estimate.id });
}
