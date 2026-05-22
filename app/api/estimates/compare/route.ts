import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type LaborItem = { description: string; quantity: number; unit: string; unitCost: number };
type Material = { name: string; quantity: number; unit: string; unitPrice: number };
type AiEstimate = { title: string; description?: string; laborItems: LaborItem[]; materials: Material[]; notes?: string };

function buildPrompt(language: string): string {
  let prompt =
    "You are an expert trade contractor estimator. From the job walkthrough, produce a detailed estimate. " +
    "Return ONLY valid JSON with this exact shape: " +
    '{ "title": string, "description": string, ' +
    '"laborItems": [{ "description": string, "quantity": number, "unit": string, "unitCost": number }], ' +
    '"materials": [{ "name": string, "quantity": number, "unit": string, "unitPrice": number, "supplierNote": string }], ' +
    '"notes": string }.\n\n' +
    "QUANTITY RULES: Set quantity to the REAL measured amount and unitCost/unitPrice to the TRUE per-unit rate so quantity × rate = the line total. " +
    'Put ONLY the item name in "description"/"name" (no quantity in the label). ' +
    'Use unit "job"/"lump" only for unit-less tasks (permits, haul-off). ' +
    "All dollar values are numbers only.\n\n" +
    "PRICING LEVEL: This is a PAID professional contractor bid, not a DIY budget. Price at full retail contractor rates a licensed pro " +
    "would charge a client — retail material prices (marked up above supplier cost) and professional crew labor rates. Account for prep, " +
    "setup, cleanup, and mobilization; don't undercount hours. When a rate could fall in a range, choose the UPPER end of the realistic " +
    "current US market range. Do NOT lowball.";
  if (language === "es") prompt += " Respond entirely in Spanish — all string values in Spanish.";
  return prompt;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

function totals(ai: AiEstimate) {
  const labor = (ai.laborItems ?? []).reduce((s, i) => s + num(i.quantity) * num(i.unitCost), 0);
  const material = (ai.materials ?? []).reduce((s, m) => s + num(m.quantity) * num(m.unitPrice), 0);
  return { labor, material, total: labor + material };
}

function parseJson(raw: string): AiEstimate {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(cleaned);
}

async function runGroq(prompt: string, transcript: string) {
  if (!process.env.GROQ_API_KEY) return { ok: false, error: "GROQ_API_KEY not set" };
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: prompt }, { role: "user", content: transcript }],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  });
  const text = await res.text();
  if (!res.ok) return { ok: false, error: `Groq ${res.status}: ${text.slice(0, 200)}` };
  try {
    const ai = parseJson(JSON.parse(text).choices?.[0]?.message?.content ?? "");
    return { ok: true, model: "Groq · LLaMA 3.3 70B", estimate: ai, totals: totals(ai) };
  } catch {
    return { ok: false, error: "Groq returned unparseable JSON" };
  }
}

async function runGemini(prompt: string, transcript: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, error: "GEMINI_API_KEY not set — add it in Vercel to compare." };
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: prompt }] },
        contents: [{ role: "user", parts: [{ text: transcript }] }],
        generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
      }),
    }
  );
  const text = await res.text();
  if (!res.ok) return { ok: false, error: `Gemini ${res.status}: ${text.slice(0, 200)}` };
  try {
    const json = JSON.parse(text);
    const content = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const ai = parseJson(content);
    return { ok: true, model: `Gemini · ${model}`, estimate: ai, totals: totals(ai) };
  } catch {
    return { ok: false, error: "Gemini returned unparseable JSON" };
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { transcript, language = "en" } = await req.json();
  if (!transcript) return NextResponse.json({ error: "transcript is required" }, { status: 400 });

  const prompt = buildPrompt(language);
  const [groq, gemini] = await Promise.all([runGroq(prompt, transcript), runGemini(prompt, transcript)]);

  return NextResponse.json({ groq, gemini });
}
