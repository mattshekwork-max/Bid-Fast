import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hasActiveSubscription } from "@/lib/subscription";
import { buildPriceReference } from "@/lib/price-catalog";

const FREE_ESTIMATE_LIMIT = 3;

type LaborItem = { description: string; quantity: number; unit: string; unitCost: number };
type Material = { name: string; quantity: number; unit: string; unitPrice: number; supplierNote?: string };
type AiEstimate = {
  title: string;
  description?: string;
  laborItems: LaborItem[];
  materials: Material[];
  notes?: string;
};

function buildSystemPrompt(language: string, laborRate: number, priceReference: string): string {
  let prompt =
    "You are an expert trade contractor estimator. From the job walkthrough, produce a detailed estimate. " +
    "Return ONLY valid JSON with this exact shape: " +
    '{ "title": string, "description": string, ' +
    '"laborItems": [{ "description": string, "quantity": number, "unit": string, "unitCost": number }], ' +
    '"materials": [{ "name": string, "quantity": number, "unit": string, "unitPrice": number, "supplierNote": string }], ' +
    '"notes": string }.\n\n' +
    "QUANTITY RULES (important):\n" +
    "- Set quantity to the REAL measured amount and unitCost/unitPrice to the TRUE per-unit rate, so quantity × rate = the line total. " +
    "Never collapse a measurable item into quantity 1 with unit \"job\".\n" +
    "- Put ONLY the item name in \"description\"/\"name\". Never put the quantity inside the name — the quantity and unit fields cover that. " +
    'Write "Cabinets" not "Cabinets (22 linear feet)".\n' +
    "- Examples: cabinets → quantity 22, unit \"linear ft\", unitPrice ~545. Countertops → quantity 55, unit \"sq ft\", unitPrice ~82. " +
    "Comp shingles → quantity 30, unit \"square\", unitPrice ~140. Recessed lights → quantity 6, unit \"each\", unitCost ~50.\n" +
    "- Express labor as hours × hourly rate where it makes sense (e.g., quantity 16, unit \"hr\", unitCost 75).\n" +
    "- Use unit \"job\" or \"lump\" ONLY for tasks with no natural unit (permits, haul-off, gas-line move, inspections).\n" +
    "- All dollar values are numbers only (no symbols).\n\n" +
    "PRICING LEVEL (important): This is a PAID professional contractor bid, not a DIY budget. " +
    "Price at full retail contractor rates a licensed pro would actually charge a client. " +
    "Charge retail material prices (what the client pays, marked up above supplier cost), and bill labor at professional crew rates. " +
    "Account for prep, setup, cleanup, mobilization, and don't undercount labor hours. " +
    "When a rate could fall within a range, choose the UPPER end of the realistic current US market range. " +
    "Do NOT lowball — underpricing loses the contractor money.";
  if (laborRate > 0) {
    prompt += `\n- Use $${laborRate} per hour as the labor rate for all hourly labor lines.`;
  }
  if (priceReference) {
    prompt +=
      "\n\nKNOWN MATERIAL/EQUIPMENT PRICES — when a material or piece of equipment matches one of these " +
      "(including obvious synonyms, e.g. \"Tesla battery\" = Tesla Powerwall), use this unit price exactly. " +
      "These are equipment/material costs only — still add labor separately. Estimate anything not listed.\n" +
      priceReference;
  }
  if (language === "es") {
    prompt += " Respond entirely in Spanish — all string values in Spanish.";
  }
  return prompt;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { transcript, language = "en" } = await req.json();
  if (!transcript) {
    return NextResponse.json({ error: "transcript is required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Ensure a users row exists (estimates.user_id has a FK to users.id).
  // Self-heals accounts created before the signup hook, or if it didn't run.
  await admin.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? `${user.id}@unknown.local`,
      first_name: (user.user_metadata as Record<string, string> | null)?.first_name ?? null,
      last_name: (user.user_metadata as Record<string, string> | null)?.last_name ?? null,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  // Load this contractor's pricing defaults (labor rate, markup, expenses)
  const { data: settings } = await admin
    .from("users")
    .select("labor_rate, markup_percent, expense_flat, discount_flat, show_adjustments")
    .eq("id", user.id)
    .maybeSingle();

  const laborRate = num(settings?.labor_rate);
  const markupPct = num(settings?.markup_percent);
  const expenseFlat = num(settings?.expense_flat);
  const discountFlat = num(settings?.discount_flat);
  const showAdjustments = settings?.show_adjustments !== false; // default true

  // Contractor's custom prices override the built-in catalog
  const { data: customPrices } = await admin
    .from("price_book")
    .select("item_name, unit, unit_price")
    .eq("user_id", user.id);
  const priceReference = buildPriceReference(customPrices ?? []);

  // Free-tier gate: 3 estimates, then require Pro
  const subscribed = await hasActiveSubscription(admin, user.id);
  if (!subscribed) {
    const { count } = await admin
      .from("estimates")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if ((count ?? 0) >= FREE_ESTIMATE_LIMIT) {
      return NextResponse.json(
        { error: "Free limit reached. Upgrade to Pro for unlimited estimates.", upgrade: true },
        { status: 403 }
      );
    }
  }

  // Generate the estimate with Groq LLaMA
  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: buildSystemPrompt(language, laborRate, priceReference) },
        { role: "user", content: transcript },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  });

  if (!groqRes.ok) {
    console.error("Groq LLM error:", await groqRes.text());
    return NextResponse.json({ error: "Estimate generation failed" }, { status: 500 });
  }

  const completion = await groqRes.json();
  let raw: string = completion.choices?.[0]?.message?.content ?? "";
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  let ai: AiEstimate;
  try {
    ai = JSON.parse(raw);
  } catch {
    console.error("Failed to parse LLM JSON:", raw);
    return NextResponse.json({ error: "Failed to parse estimate" }, { status: 500 });
  }

  const laborItems = Array.isArray(ai.laborItems) ? ai.laborItems : [];
  const materials = Array.isArray(ai.materials) ? ai.materials : [];

  const rawLabor = laborItems.reduce((s, i) => s + num(i.quantity) * num(i.unitCost), 0);
  const rawMaterial = materials.reduce((s, m) => s + num(m.quantity) * num(m.unitPrice), 0);
  const base = rawLabor + rawMaterial;

  // Apply contractor pricing settings
  const markupAmount = base * (markupPct / 100);
  const expenses = expenseFlat;
  const discount = discountFlat;
  const grandTotal = Math.max(0, base + markupAmount + expenses - discount);

  // When adjustments are hidden, fold them into the line prices proportionally
  // so the visible lines still sum to the final total.
  const fold = !showAdjustments && base > 0 && markupAmount + expenses - discount !== 0;
  const factor = fold ? grandTotal / base : 1;

  // Insert the estimate header
  const { data: estimate, error: insertError } = await admin
    .from("estimates")
    .insert({
      user_id: user.id,
      title: ai.title || "Untitled Estimate",
      voice_transcript: transcript,
      parsed_description: ai.description ?? null,
      status: "draft",
      total_labor_cost: rawLabor * factor,
      total_material_cost: rawMaterial * factor,
      total_cost: grandTotal,
      client_token: crypto.randomUUID(),
    })
    .select()
    .single();

  if (insertError || !estimate) {
    console.error("Failed to save estimate:", insertError);
    return NextResponse.json(
      { error: `Failed to save estimate: ${insertError?.message ?? "unknown error"}` },
      { status: 500 }
    );
  }

  // Priced line items (labor + materials) — inflated by factor when folding
  const lineItems = [
    ...laborItems.map((i, idx) => ({
      estimate_id: estimate.id,
      category: "labor",
      description: i.description || "Labor",
      quantity: num(i.quantity) || 1,
      unit: i.unit || "hr",
      unit_cost: num(i.unitCost) * factor,
      total_cost: num(i.quantity) * num(i.unitCost) * factor,
      item_type: "labor",
      sort_order: idx,
    })),
    ...materials.map((m, idx) => ({
      estimate_id: estimate.id,
      category: "material",
      description: m.name || "Material",
      quantity: num(m.quantity) || 1,
      unit: m.unit || "each",
      unit_cost: num(m.unitPrice) * factor,
      total_cost: num(m.quantity) * num(m.unitPrice) * factor,
      item_type: "material",
      sort_order: laborItems.length + idx,
    })),
  ];

  // Visible adjustment lines (only when showing adjustments)
  if (showAdjustments) {
    let order = lineItems.length;
    if (expenses > 0) {
      lineItems.push({
        estimate_id: estimate.id,
        category: "expense",
        description: "Expenses (gas, fees, disposal)",
        quantity: 1,
        unit: "job",
        unit_cost: expenses,
        total_cost: expenses,
        item_type: "adjustment",
        sort_order: order++,
      });
    }
    if (markupAmount > 0) {
      lineItems.push({
        estimate_id: estimate.id,
        category: "markup",
        description: `Overhead & profit (${markupPct}%)`,
        quantity: 1,
        unit: "job",
        unit_cost: markupAmount,
        total_cost: markupAmount,
        item_type: "adjustment",
        sort_order: order++,
      });
    }
    if (discount > 0) {
      lineItems.push({
        estimate_id: estimate.id,
        category: "discount",
        description: "Discount",
        quantity: 1,
        unit: "job",
        unit_cost: -discount,
        total_cost: -discount,
        item_type: "adjustment",
        sort_order: order++,
      });
    }
  }

  if (lineItems.length) {
    const { error: liError } = await admin.from("estimate_line_items").insert(lineItems);
    if (liError) console.error("Failed to save line items:", liError);
  }

  // Insert material shopping list
  if (materials.length) {
    const matRows = materials.map((m, idx) => ({
      estimate_id: estimate.id,
      material_name: m.name || "Material",
      quantity: num(m.quantity) || 1,
      unit: m.unit || "each",
      unit_price: num(m.unitPrice),
      total_price: num(m.quantity) * num(m.unitPrice),
      supplier_note: m.supplierNote ?? null,
      sort_order: idx,
    }));
    const { error: matError } = await admin.from("material_list_items").insert(matRows);
    if (matError) console.error("Failed to save material list:", matError);
  }

  return NextResponse.json({ estimate });
}
