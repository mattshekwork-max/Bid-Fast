import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hasActiveSubscription } from "@/lib/subscription";

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

function buildSystemPrompt(language: string): string {
  let prompt =
    "You are an expert trade contractor estimator. From the job walkthrough, produce a detailed estimate. " +
    "Return ONLY valid JSON with this exact shape: " +
    '{ "title": string, "description": string, ' +
    '"laborItems": [{ "description": string, "quantity": number, "unit": string, "unitCost": number }], ' +
    '"materials": [{ "name": string, "quantity": number, "unit": string, "unitPrice": number, "supplierNote": string }], ' +
    '"notes": string }. ' +
    "unitCost and unitPrice are per-unit dollar amounts (numbers only, no symbols). Use realistic current market rates.";
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
        { role: "system", content: buildSystemPrompt(language) },
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

  const totalLabor = laborItems.reduce((s, i) => s + num(i.quantity) * num(i.unitCost), 0);
  const totalMaterial = materials.reduce((s, m) => s + num(m.quantity) * num(m.unitPrice), 0);
  const totalCost = totalLabor + totalMaterial;

  // Insert the estimate header
  const { data: estimate, error: insertError } = await admin
    .from("estimates")
    .insert({
      user_id: user.id,
      title: ai.title || "Untitled Estimate",
      voice_transcript: transcript,
      parsed_description: ai.description ?? null,
      status: "draft",
      total_labor_cost: totalLabor,
      total_material_cost: totalMaterial,
      total_cost: totalCost,
      client_token: crypto.randomUUID(),
    })
    .select()
    .single();

  if (insertError || !estimate) {
    console.error("Failed to save estimate:", insertError);
    return NextResponse.json({ error: "Failed to save estimate" }, { status: 500 });
  }

  // Insert priced line items (labor + materials)
  const lineItems = [
    ...laborItems.map((i, idx) => ({
      estimate_id: estimate.id,
      category: "labor",
      description: i.description || "Labor",
      quantity: num(i.quantity) || 1,
      unit: i.unit || "hr",
      unit_cost: num(i.unitCost),
      total_cost: num(i.quantity) * num(i.unitCost),
      item_type: "labor",
      sort_order: idx,
    })),
    ...materials.map((m, idx) => ({
      estimate_id: estimate.id,
      category: "material",
      description: m.name || "Material",
      quantity: num(m.quantity) || 1,
      unit: m.unit || "each",
      unit_cost: num(m.unitPrice),
      total_cost: num(m.quantity) * num(m.unitPrice),
      item_type: "material",
      sort_order: laborItems.length + idx,
    })),
  ];
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
