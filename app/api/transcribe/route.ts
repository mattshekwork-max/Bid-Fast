import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function extFor(type: string): string {
  if (type.includes("mp4")) return "mp4";
  if (type.includes("ogg")) return "ogg";
  if (type.includes("wav")) return "wav";
  if (type.includes("mpeg") || type.includes("mp3")) return "mp3";
  return "webm";
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY is not set on the server." }, { status: 503 });
  }

  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    const languageField = formData.get("language") as string | null;

    if (!audio) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }
    if (audio.size === 0) {
      return NextResponse.json({ error: "Recording was empty — please try again." }, { status: 400 });
    }

    const language = languageField === "es" ? "es" : "en";

    // Re-wrap with an explicit filename + type so Groq reliably detects format
    const type = audio.type || "audio/webm";
    const buf = await audio.arrayBuffer();
    const file = new File([buf], `recording.${extFor(type)}`, { type });

    const groqForm = new FormData();
    groqForm.append("file", file);
    groqForm.append("model", "whisper-large-v3-turbo");
    groqForm.append("language", language);
    groqForm.append("response_format", "json");

    const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: groqForm,
    });

    const text = await groqRes.text();
    if (!groqRes.ok) {
      console.error("Groq transcription error:", groqRes.status, text);
      // Surface the real reason so failures are diagnosable
      let detail = text;
      try { detail = JSON.parse(text)?.error?.message ?? text; } catch { /* keep raw */ }
      return NextResponse.json(
        { error: `Transcription failed (${groqRes.status}): ${detail}` },
        { status: 502 }
      );
    }

    const transcription = JSON.parse(text);
    return NextResponse.json({ text: transcription.text });
  } catch (err) {
    console.error("Transcription error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Transcription failed: ${msg}` }, { status: 500 });
  }
}
